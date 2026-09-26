import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  escapeHtml,
  getMarketplaceEmailConfig,
  getRemoteIp,
  isEmail,
  isUuid,
  marketplaceCorsHeaders,
  marketplaceJsonResponse,
  nullableText,
  sendMarketplaceEmail,
  trimText,
  verifyMarketplaceCaptcha,
} from "../_shared/marketplace.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Mechanic application function configuration is incomplete.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const mechanicTypes = new Set(["mobile_mechanic", "garage_and_mobile", "garage_based"]);
const applicationSelect =
  "id, created_at, updated_at, submitted_at, status, first_name, last_name, email, phone, postcode, business_name, mechanic_type, years_experience, service_radius_miles, website_url, qualifications_summary, insurance_held, services_offered, work_types, has_diagnostic_tools, has_service_van, additional_notes, review_note, reviewed_at, approved_at, approved_by, auth_user_id, invite_sent_at";

const mechanicTypeLabels: Record<string, string> = {
  mobile_mechanic: "Mobile mechanic",
  garage_and_mobile: "Garage + mobile",
  garage_based: "Garage-based",
};

function displayValue(value: string | null | undefined) {
  return value?.trim() || "Not provided";
}

function displayList(values: string[]) {
  return values.length
    ? values.map((value) => value.replaceAll("_", " ")).join(", ")
    : "Not provided";
}

function stringList(value: unknown, maxItems = 30) {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 100))
    .filter(Boolean);
  return items.length === value.length ? [...new Set(items)] : null;
}

function requiredInteger(value: unknown, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number.parseInt(trimText(value, 10), 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function safeWebsite(value: unknown) {
  const text = trimText(value, 300);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: marketplaceCorsHeaders(request) });
  }
  if (request.method !== "POST") {
    return marketplaceJsonResponse(request, { error: "Method not allowed." }, 405);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const applicationId = trimText(body.applicationId, 50);
    const firstName = trimText(body.firstName, 80);
    const lastName = trimText(body.lastName, 80);
    const email = trimText(body.email, 254).toLowerCase();
    const phone = trimText(body.phone, 40);
    const postcode = trimText(body.postcode, 12).toUpperCase();
    const mechanicType = trimText(body.mechanicType, 40);
    const yearsExperience = requiredInteger(body.yearsExperience, 0, 80);
    const serviceRadiusMiles = requiredInteger(body.serviceRadiusMiles, 0, 500);
    const insuranceHeld = stringList(body.insuranceHeld);
    const servicesOffered = stringList(body.servicesOffered);
    const workTypes = stringList(body.workTypes);
    const websiteUrl = safeWebsite(body.websiteUrl);

    if (!isUuid(applicationId)) {
      return marketplaceJsonResponse(request, { error: "The application reference is invalid. Refresh and try again." }, 400);
    }
    if (!firstName || !lastName || !isEmail(email) || phone.length < 7 || postcode.length < 2) {
      return marketplaceJsonResponse(request, { error: "Enter valid contact details before applying." }, 400);
    }
    if (!mechanicTypes.has(mechanicType) || yearsExperience === null || serviceRadiusMiles === null) {
      return marketplaceJsonResponse(request, { error: "Enter valid mechanic experience and coverage details." }, 400);
    }
    if (!insuranceHeld?.length || !servicesOffered?.length || !workTypes?.length) {
      return marketplaceJsonResponse(request, { error: "Complete the insurance, services and work-type selections." }, 400);
    }
    if (typeof body.hasDiagnosticTools !== "boolean" || typeof body.hasServiceVan !== "boolean") {
      return marketplaceJsonResponse(request, { error: "Complete the tools and service-van questions." }, 400);
    }
    if (websiteUrl === undefined) {
      return marketplaceJsonResponse(request, { error: "Enter a valid business website URL or leave it blank." }, 400);
    }

    const { data: existing, error: existingError } = await admin
      .from("mechanic_applications")
      .select(applicationSelect)
      .eq("id", applicationId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      if (existing.email !== email) {
        return marketplaceJsonResponse(request, { error: "This application reference is already in use." }, 409);
      }
      return marketplaceJsonResponse(request, { application: existing });
    }

    const emailConfig = getMarketplaceEmailConfig();
    const captchaSecret = emailConfig.captchaSecret;
    if (!captchaSecret) throw new Error("Mechanic application CAPTCHA is not configured.");
    await verifyMarketplaceCaptcha({
      token: trimText(body.captchaToken, 4000),
      secret: captchaSecret,
      remoteIp: getRemoteIp(request),
    });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from("mechanic_applications")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("submitted_at", since);
    if (countError) throw countError;
    if ((count ?? 0) >= 3) {
      return marketplaceJsonResponse(request, { error: "Too many recent applications. Please wait before trying again." }, 429);
    }

    const now = new Date().toISOString();
    const { data: application, error: insertError } = await admin
      .from("mechanic_applications")
      .insert({
        id: applicationId,
        created_at: now,
        updated_at: now,
        submitted_at: now,
        status: "submitted",
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        postcode,
        business_name: nullableText(body.businessName, 160),
        mechanic_type: mechanicType,
        years_experience: yearsExperience,
        service_radius_miles: serviceRadiusMiles,
        website_url: websiteUrl,
        qualifications_summary: nullableText(body.qualificationsSummary, 2000),
        insurance_held: insuranceHeld,
        services_offered: servicesOffered,
        work_types: workTypes,
        has_diagnostic_tools: body.hasDiagnosticTools,
        has_service_van: body.hasServiceVan,
        additional_notes: nullableText(body.additionalNotes, 3000),
      })
      .select(applicationSelect)
      .single();
    if (insertError || !application) throw insertError || new Error("Application was not returned after submission.");

    const applicantName = `${firstName} ${lastName}`;
    const businessName = nullableText(body.businessName, 160);
    const qualificationsSummary = nullableText(body.qualificationsSummary, 2000);
    const additionalNotes = nullableText(body.additionalNotes, 3000);
    const mechanicTypeLabel = mechanicTypeLabels[mechanicType] ?? mechanicType.replaceAll("_", " ");
    const insuranceLabel = displayList(insuranceHeld);
    const servicesLabel = displayList(servicesOffered);
    const workTypesLabel = displayList(workTypes);
    let notificationSent = false;
    try {
      notificationSent = await sendMarketplaceEmail({
        apiKey: emailConfig.apiKey,
        from:
          Deno.env.get("MECHANIC_APPLICATION_FROM_EMAIL")?.trim() ||
          emailConfig.from,
        to:
          Deno.env.get("MECHANIC_APPLICATION_TO_EMAIL")?.trim() ||
          emailConfig.to,
        replyTo: email,
        subject: `New mechanic application - ${applicantName}`,
        html: `
        <!doctype html>
        <html lang="en">
          <body style="margin:0;padding:24px;background:#f4f8ff;font-family:Arial,Helvetica,sans-serif;color:#0b1730;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr><td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border:1px solid #d9e5fb;border-radius:24px;overflow:hidden;">
                  <tr><td style="padding:28px;background:#1c69d4;color:#ffffff;">
                    <h1 style="margin:0 0 10px;font-size:30px;line-height:1.2;">New mechanic application</h1>
                    <p style="margin:0;color:#e4efff;">Application ${escapeHtml(applicationId)} was submitted to STM Motors.</p>
                  </td></tr>
                  <tr><td style="padding:28px;font-size:15px;line-height:1.8;">
                    <h2 style="margin:0 0 8px;font-size:20px;">Applicant</h2>
                    <p style="margin:0 0 20px;"><strong>${escapeHtml(applicantName)}</strong><br>Email: ${escapeHtml(email)}<br>Phone: ${escapeHtml(phone)}<br>Postcode: ${escapeHtml(postcode)}<br>Business: ${escapeHtml(displayValue(businessName))}<br>Website: ${escapeHtml(displayValue(websiteUrl))}</p>
                    <h2 style="margin:0 0 8px;font-size:20px;">Experience and coverage</h2>
                    <p style="margin:0 0 20px;">Mechanic type: ${escapeHtml(mechanicTypeLabel)}<br>Years of experience: ${yearsExperience}<br>Service radius: ${serviceRadiusMiles} miles<br>Diagnostic tools: ${body.hasDiagnosticTools ? "Yes" : "No"}<br>Service van: ${body.hasServiceVan ? "Yes" : "No"}</p>
                    <h2 style="margin:0 0 8px;font-size:20px;">Services and setup</h2>
                    <p style="margin:0 0 20px;">Insurance: ${escapeHtml(insuranceLabel)}<br>Services: ${escapeHtml(servicesLabel)}<br>Work types: ${escapeHtml(workTypesLabel)}</p>
                    <h2 style="margin:0 0 8px;font-size:20px;">Additional information</h2>
                    <p style="margin:0;white-space:pre-wrap;">Qualifications: ${escapeHtml(displayValue(qualificationsSummary))}<br><br>Notes: ${escapeHtml(displayValue(additionalNotes))}</p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>`,
        text: [
          "STM Motors - New mechanic application",
          `Application ID: ${applicationId}`,
          `Submitted at: ${now}`,
          "",
          `Name: ${applicantName}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `Postcode: ${postcode}`,
          `Business: ${displayValue(businessName)}`,
          `Website: ${displayValue(websiteUrl)}`,
          `Mechanic type: ${mechanicTypeLabel}`,
          `Years of experience: ${yearsExperience}`,
          `Service radius: ${serviceRadiusMiles} miles`,
          `Insurance: ${insuranceLabel}`,
          `Services: ${servicesLabel}`,
          `Work types: ${workTypesLabel}`,
          `Diagnostic tools: ${body.hasDiagnosticTools ? "Yes" : "No"}`,
          `Service van: ${body.hasServiceVan ? "Yes" : "No"}`,
          `Qualifications: ${displayValue(qualificationsSummary)}`,
          `Additional notes: ${displayValue(additionalNotes)}`,
        ].join("\n"),
      });
    } catch (notificationError) {
      console.error("Mechanic application notification request failed.", {
        applicationId,
        message:
          notificationError instanceof Error
            ? notificationError.message
            : "Unknown email delivery error",
      });
    }

    if (!notificationSent) {
      console.warn("Mechanic application was saved without an admin notification email.", {
        applicationId,
      });
    }

    return marketplaceJsonResponse(request, { application, notificationSent }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit the application.";
    console.error("Mechanic application submission failed.", { message });
    if (message.toLowerCase().includes("spam protection")) {
      return marketplaceJsonResponse(request, { error: message }, 400);
    }
    return marketplaceJsonResponse(
      request,
      { error: "The mechanic application service is temporarily unavailable. Please try again." },
      500,
    );
  }
});
