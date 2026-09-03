import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  buildAdminBookingEmail,
  buildCustomerBookingEmail,
  getMissingBookingEmailConfig,
  type BookingEmailConfig,
} from "../_shared/booking-emails.ts";
import {
  BOOKING_NOTIFICATION_STALE_MS,
  BOOKING_SELECT_COLUMNS,
  buildBookingRequestHash,
  getLondonDateKey,
  sanitizeCreateBookingPayload,
  sanitizeIdempotencyKey,
  toCreatedBookingResponse,
  type BookingEmailDeliveryStatus,
  type BookingEmailNotificationRecord,
  type BookingRecord,
  type BookingSubmissionRequestRecord,
  type CreateBookingSuccessResponse,
  type IncomingBookingPayload,
} from "../_shared/create-booking.ts";
import { resolveVehicleServicePricing } from "../_shared/fixaroo-pricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

const defaultPublicWebsiteUrl = "https://stmmotors.com";
const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
const fixarooPricingEnabled =
  Deno.env.get("FIXAROO_PRICING_ENABLED")?.trim().toLowerCase() === "true";
const fixarooApiKey = fixarooPricingEnabled
  ? Deno.env.get("FIXAROO_API_KEY")?.trim() ?? ""
  : "";
const fixarooLabourPrice = Number(
  Deno.env.get("FIXAROO_LABOUR_PRICE")?.trim() ?? "40",
);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for create-booking.",
  );
}

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type NotificationEmailType = "admin" | "customer";

interface ResolvedBookingEmailConfig {
  adminBookingEmail: string;
  bookingFromEmail: string;
  publicWebsiteUrl: string;
  resendApiKey: string;
}

interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeFailureReason(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Unexpected email error.";

  return message.slice(0, 500);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function buildRetryMessage(): string {
  return "This booking request is already being processed. Please wait a moment and try again if needed.";
}

async function fetchBookingById(bookingId: string): Promise<BookingRecord> {
  const { data, error } = await adminClient
    .from("bookings")
    .select(BOOKING_SELECT_COLUMNS)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load booking details.");
  }

  if (!data) {
    throw new Error("Booking not found.");
  }

  return {
    ...(data as BookingRecord),
    total_price: Number((data as BookingRecord).total_price),
  };
}

async function markSubmissionCreated(
  submissionId: string,
  bookingId: string,
): Promise<void> {
  const { error } = await adminClient
    .from("public_booking_submission_requests")
    .update({
      booking_id: bookingId,
      status: "created",
      error_code: null,
      error_message: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    throw new Error(
      error.message || "Failed to store the booking idempotency state.",
    );
  }
}

async function markSubmissionFailed(
  submissionId: string,
  errorCode: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await adminClient
    .from("public_booking_submission_requests")
    .update({
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage.slice(0, 500),
      completed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    console.error("Failed to update booking submission state", {
      submissionId,
      error: error.message,
    });
  }
}

async function fetchSubmissionRequestByKey(
  idempotencyKey: string,
): Promise<BookingSubmissionRequestRecord> {
  const { data, error } = await adminClient
    .from("public_booking_submission_requests")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load the booking request state.");
  }

  if (!data) {
    throw new Error("Booking request state not found.");
  }

  return data as BookingSubmissionRequestRecord;
}

async function acquireSubmissionRequest(
  idempotencyKey: string,
  requestHash: string,
): Promise<
  | {
      kind: "acquired";
      row: BookingSubmissionRequestRecord;
    }
  | {
      kind: "existing";
      row: BookingSubmissionRequestRecord;
    }
  | {
      kind: "conflict";
    }
  | {
      kind: "processing";
    }
> {
  const { data, error } = await adminClient
    .from("public_booking_submission_requests")
    .insert({
      idempotency_key: idempotencyKey,
      request_hash: requestHash,
      status: "processing",
    })
    .select("*")
    .single();

  if (!error && data) {
    return {
      kind: "acquired",
      row: data as BookingSubmissionRequestRecord,
    };
  }

  if (!isUniqueViolation(error)) {
    throw new Error(error?.message || "Failed to start booking processing.");
  }

  const existing = await fetchSubmissionRequestByKey(idempotencyKey);

  if (existing.request_hash !== requestHash) {
    return { kind: "conflict" };
  }

  if (existing.booking_id && existing.status === "created") {
    return {
      kind: "existing",
      row: existing,
    };
  }

  const now = Date.now();
  const lastUpdated = Date.parse(existing.updated_at || existing.created_at);
  const isStaleProcessing =
    existing.status === "processing" &&
    Number.isFinite(lastUpdated) &&
    now - lastUpdated >= BOOKING_NOTIFICATION_STALE_MS;
  const canRetryFailed = existing.status === "failed" && !existing.booking_id;

  if (!isStaleProcessing && !canRetryFailed) {
    return { kind: "processing" };
  }

  const { data: reclaimed, error: reclaimError } = await adminClient
    .from("public_booking_submission_requests")
    .update({
      status: "processing",
      error_code: null,
      error_message: null,
      completed_at: null,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (reclaimError || !reclaimed) {
    throw new Error(
      reclaimError?.message || "Failed to restart booking processing.",
    );
  }

  return {
    kind: "acquired",
    row: reclaimed as BookingSubmissionRequestRecord,
  };
}

async function fetchNotificationRecord(
  bookingId: string,
  emailType: NotificationEmailType,
): Promise<BookingEmailNotificationRecord | null> {
  const { data, error } = await adminClient
    .from("booking_email_notifications")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("email_type", emailType)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message || "Failed to load the booking email notification state.",
    );
  }

  return (data as BookingEmailNotificationRecord | null) ?? null;
}

async function upsertNotificationPending(
  bookingId: string,
  emailType: NotificationEmailType,
  recipientEmail: string,
): Promise<BookingEmailNotificationRecord> {
  const { data, error } = await adminClient
    .from("booking_email_notifications")
    .upsert(
      {
        booking_id: bookingId,
        email_type: emailType,
        recipient_email: recipientEmail,
        status: "pending",
        failure_reason: null,
      },
      {
        onConflict: "booking_id,email_type",
      },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message || "Failed to update the booking email state.",
    );
  }

  return data as BookingEmailNotificationRecord;
}

async function updateNotificationResult(
  notificationId: string,
  values: Partial<BookingEmailNotificationRecord>,
): Promise<void> {
  const { error } = await adminClient
    .from("booking_email_notifications")
    .update(values)
    .eq("id", notificationId);

  if (error) {
    throw new Error(error.message || "Failed to save the email result.");
  }
}

async function recordNotificationFailure(
  bookingId: string,
  emailType: NotificationEmailType,
  recipientEmail: string,
  reason: string,
): Promise<void> {
  const existing = await fetchNotificationRecord(bookingId, emailType);
  const pending = existing
    ? await upsertNotificationPending(bookingId, emailType, recipientEmail)
    : await upsertNotificationPending(bookingId, emailType, recipientEmail);

  await updateNotificationResult(pending.id, {
    status: "failed",
    last_attempted_at: new Date().toISOString(),
    failure_reason: reason.slice(0, 500),
    attempt_count: (existing?.attempt_count ?? 0) + 1,
  });
}

async function sendResendEmail(
  apiKey: string,
  idempotencyKey: string,
  payload: ResendEmailPayload,
): Promise<string | null> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let parsedBody: { id?: string; message?: string } | null = null;

  if (responseText) {
    try {
      parsedBody = JSON.parse(responseText) as { id?: string; message?: string };
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      parsedBody?.message || `Resend request failed with status ${response.status}.`,
    );
  }

  return parsedBody?.id ?? null;
}

async function deliverTrackedEmail(args: {
  booking: BookingRecord;
  config: ResolvedBookingEmailConfig;
  emailType: NotificationEmailType;
  recipientEmail: string;
  replyTo?: string;
  websiteSource: string | null;
}): Promise<BookingEmailDeliveryStatus> {
  const { booking, config, emailType, recipientEmail, replyTo, websiteSource } =
    args;
  const existing = await fetchNotificationRecord(booking.id, emailType);

  if (existing?.status === "sent") {
    return "sent";
  }

  const pending = await upsertNotificationPending(
    booking.id,
    emailType,
    recipientEmail,
  );

  const preparedEmail =
    emailType === "admin"
      ? buildAdminBookingEmail({
          booking,
          publicWebsiteUrl: config.publicWebsiteUrl,
          websiteSource,
        })
      : buildCustomerBookingEmail({
          booking,
          publicWebsiteUrl: config.publicWebsiteUrl,
          websiteSource,
        });

  try {
    const resendMessageId = await sendResendEmail(
      config.resendApiKey,
      `booking-${booking.id}-${emailType}-v1`,
      {
        from: config.bookingFromEmail,
        to: [recipientEmail],
        subject: preparedEmail.subject,
        html: preparedEmail.html,
        text: preparedEmail.text,
        reply_to: replyTo,
      },
    );

    await updateNotificationResult(pending.id, {
      status: "sent",
      resend_message_id: resendMessageId,
      last_attempted_at: new Date().toISOString(),
      failure_reason: null,
      attempt_count: (existing?.attempt_count ?? 0) + 1,
    });

    return "sent";
  } catch (error) {
    await updateNotificationResult(pending.id, {
      status: "failed",
      last_attempted_at: new Date().toISOString(),
      failure_reason: safeFailureReason(error),
      attempt_count: (existing?.attempt_count ?? 0) + 1,
    });

    console.error("Booking email delivery failed", {
      bookingId: booking.id,
      emailType,
      error: safeFailureReason(error),
    });

    return "failed";
  }
}

async function ensureBookingEmails(args: {
  booking: BookingRecord;
  config: BookingEmailConfig;
  websiteSource: string | null;
}): Promise<CreateBookingSuccessResponse["emailStatus"]> {
  const { booking, config, websiteSource } = args;
  const emailStatus: CreateBookingSuccessResponse["emailStatus"] = {
    admin: "failed",
    customer: "failed",
  };

  const missingConfig = getMissingBookingEmailConfig(config);

  if (missingConfig.length > 0) {
    const failureReason = `Missing email configuration: ${missingConfig.join(", ")}`;

    await recordNotificationFailure(
      booking.id,
      "admin",
      config.adminBookingEmail || "info@stmmotors.com",
      failureReason,
    );
    await recordNotificationFailure(
      booking.id,
      "customer",
      booking.email,
      failureReason,
    );

    console.error("Booking email configuration is incomplete", {
      bookingId: booking.id,
      missingConfig,
    });

    return emailStatus;
  }

  const resolvedConfig = {
    adminBookingEmail: config.adminBookingEmail!,
    bookingFromEmail: config.bookingFromEmail!,
    publicWebsiteUrl: config.publicWebsiteUrl!,
    resendApiKey: config.resendApiKey!,
  };

  emailStatus.admin = await deliverTrackedEmail({
    booking,
    config: resolvedConfig,
    emailType: "admin",
    recipientEmail: resolvedConfig.adminBookingEmail,
    replyTo: booking.email,
    websiteSource,
  });
  emailStatus.customer = await deliverTrackedEmail({
    booking,
    config: resolvedConfig,
    emailType: "customer",
    recipientEmail: booking.email,
    replyTo: resolvedConfig.adminBookingEmail,
    websiteSource,
  });

  return emailStatus;
}

async function createBookingRecord(
  payload: ReturnType<typeof sanitizeCreateBookingPayload>,
): Promise<BookingRecord> {
  const resolvedPricing = await resolveVehicleServicePricing({
    fixarooApiKey,
    labourPrice: fixarooLabourPrice,
    make: payload.make ?? "",
    model: payload.model ?? "",
    serviceIds: payload.selected_services,
    supabaseClient: adminClient,
    vehicleModelId: payload.vehicle_model_id,
    year: payload.year ?? "",
  });
  const { data, error } = await adminClient.rpc(
    "create_public_booking_parts_priced",
    {
    p_full_name: payload.full_name,
    p_phone: payload.phone,
    p_email: payload.email,
    p_street_address_1: payload.street_address_1,
    p_street_address_2: payload.street_address_2,
    p_city: payload.city,
    p_postcode: payload.postcode,
    p_car_registration: payload.car_registration,
    p_make: payload.make,
    p_model: payload.model,
    p_fuel: payload.fuel,
    p_engine: payload.engine,
    p_year: payload.year,
    p_vehicle_model_id: payload.vehicle_model_id,
    p_selected_services: payload.selected_services,
    p_total_price: payload.total_price,
    p_pricing_snapshot: resolvedPricing.servicePricingSnapshot,
    p_pricing_source: resolvedPricing.pricingSource,
    p_availability: payload.availability,
    p_availability_note: payload.availability_note,
    p_work_notes: payload.work_notes,
    p_vehicle_driveable: payload.vehicle_driveable,
    p_latitude: payload.latitude,
    p_longitude: payload.longitude,
    p_geocoded_at: payload.geocoded_at,
    },
  );

  if (error) {
    throw new Error(error.message || "Failed to create booking.");
  }

  const bookingId =
    isRecord(data) && typeof data.id === "string" ? data.id : null;

  if (!bookingId) {
    throw new Error("Booking was created without a booking id.");
  }

  return fetchBookingById(bookingId);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse(
      { success: false, error: "Invalid JSON request body." },
      400,
    );
  }

  if (!isRecord(requestBody)) {
    return jsonResponse(
      { success: false, error: "Request body must be an object." },
      400,
    );
  }

  let idempotencyKey: string;
  let sanitizedPayload: ReturnType<typeof sanitizeCreateBookingPayload>;

  try {
    idempotencyKey = sanitizeIdempotencyKey(requestBody.idempotencyKey);
    sanitizedPayload = sanitizeCreateBookingPayload(
      (requestBody.booking ?? {}) as IncomingBookingPayload,
      getLondonDateKey(),
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Booking request is invalid.",
      },
      400,
    );
  }

  try {
    const requestHash = await buildBookingRequestHash(sanitizedPayload);
    const submissionState = await acquireSubmissionRequest(
      idempotencyKey,
      requestHash,
    );

    if (submissionState.kind === "conflict") {
      return jsonResponse(
        {
          success: false,
          error:
            "This booking request no longer matches the original submission. Please submit the booking again.",
        },
        409,
      );
    }

    if (submissionState.kind === "processing") {
      return jsonResponse(
        {
          success: false,
          error: buildRetryMessage(),
        },
        409,
      );
    }

    const publicWebsiteUrl =
      Deno.env.get("PUBLIC_WEBSITE_URL")?.trim() || defaultPublicWebsiteUrl;
    const config: BookingEmailConfig = {
      adminBookingEmail: Deno.env.get("ADMIN_BOOKING_EMAIL")?.trim() ?? null,
      bookingFromEmail: Deno.env.get("BOOKING_FROM_EMAIL")?.trim() ?? null,
      publicWebsiteUrl,
      resendApiKey: Deno.env.get("RESEND_API_KEY")?.trim() ?? null,
    };
    const websiteSource = request.headers.get("origin")?.trim() || publicWebsiteUrl;

    const booking =
      submissionState.kind === "existing" && submissionState.row.booking_id
        ? await fetchBookingById(submissionState.row.booking_id)
        : await createBookingRecord(sanitizedPayload);

    if (submissionState.kind === "acquired") {
      await markSubmissionCreated(submissionState.row.id, booking.id);
    }

    const emailStatus = await ensureBookingEmails({
      booking,
      config,
      websiteSource,
    });

    return jsonResponse(toCreatedBookingResponse(booking, emailStatus), 200);
  } catch (error) {
    console.error("Booking creation failed", {
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unexpected error.",
    });

    try {
      const failedSubmission = await fetchSubmissionRequestByKey(idempotencyKey);

      if (failedSubmission.status === "processing") {
        await markSubmissionFailed(
          failedSubmission.id,
          "booking_create_failed",
          error instanceof Error ? error.message : "Unexpected booking error.",
        );
      }
    } catch (submissionError) {
      console.error("Failed to persist booking submission failure state", {
        idempotencyKey,
        error:
          submissionError instanceof Error
            ? submissionError.message
            : "Unexpected submission persistence error.",
      });
    }

    return jsonResponse(
      {
        success: false,
        error: "We could not save your booking just now. Please try again.",
      },
      500,
    );
  }
});
