import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  escapeHtml,
  getMarketplaceEmailConfig,
  getRemoteIp,
  isEmail,
  isUuid,
  marketplaceCorsHeaders,
  marketplaceJsonResponse,
  normalizeSourceUrl,
  nullableText,
  sendMarketplaceEmail,
  trimText,
  verifyMarketplaceCaptcha,
} from "../_shared/marketplace.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
if (!supabaseUrl || !serviceRoleKey) throw new Error("Marketplace function configuration is incomplete.");
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: marketplaceCorsHeaders(request) });
  if (request.method !== "POST") return marketplaceJsonResponse(request, { error: "Method not allowed." }, 405);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const website = trimText(body.website, 200);
    if (website) return marketplaceJsonResponse(request, { success: true, reference: "" });

    const idempotencyKey = trimText(body.idempotencyKey, 50);
    const vehicleId = trimText(body.vehicleId, 50);
    const name = trimText(body.name, 120);
    const email = trimText(body.email, 254).toLowerCase();
    const phone = nullableText(body.phone, 40);
    const preferredContact = trimText(body.preferredContact, 20);
    const message = trimText(body.message, 3000);
    const privacyConsent = body.privacyConsent === true;
    const sourceUrl = normalizeSourceUrl(body.sourceUrl);

    if (!isUuid(idempotencyKey) || !isUuid(vehicleId)) {
      return marketplaceJsonResponse(request, { error: "This enquiry is missing valid vehicle details." }, 400);
    }
    if (name.length < 2 || !isEmail(email) || message.length < 10) {
      return marketplaceJsonResponse(request, { error: "Enter your name, valid email and a useful message." }, 400);
    }
    if (!phone && preferredContact === "phone") {
      return marketplaceJsonResponse(request, { error: "Enter a phone number for phone contact." }, 400);
    }
    if (!["email", "phone", "either"].includes(preferredContact) || !privacyConsent) {
      return marketplaceJsonResponse(request, { error: "Choose a contact method and accept the privacy notice." }, 400);
    }

    const config = getMarketplaceEmailConfig();
    await verifyMarketplaceCaptcha({
      token: trimText(body.captchaToken, 4000),
      secret: config.captchaSecret,
      remoteIp: getRemoteIp(request),
    });

    const { data: existing } = await admin
      .from("marketplace_vehicle_enquiries")
      .select("reference")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing) return marketplaceJsonResponse(request, { success: true, reference: existing.reference });

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("marketplace_vehicle_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);
    if ((count ?? 0) >= 3) {
      return marketplaceJsonResponse(request, { error: "Too many recent enquiries. Please wait before trying again." }, 429);
    }

    const { data: listing, error: listingError } = await admin
      .from("marketplace_vehicle_listings")
      .select("id, slug, make, model, derivative, year, price, status, show_when_sold")
      .eq("id", vehicleId)
      .maybeSingle();
    const isPublic = listing && (
      listing.status === "published" ||
      listing.status === "reserved" ||
      (listing.status === "sold" && listing.show_when_sold)
    );
    if (listingError || !isPublic) {
      return marketplaceJsonResponse(request, { error: "This vehicle is no longer available for enquiries." }, 404);
    }

    const id = crypto.randomUUID();
    const reference = `MVQ-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const vehicleTitle = `${listing.year} ${listing.make} ${listing.model}${listing.derivative ? ` ${listing.derivative}` : ""}`;
    const { error: insertError } = await admin.from("marketplace_vehicle_enquiries").insert({
      id,
      reference,
      idempotency_key: idempotencyKey,
      vehicle_id: listing.id,
      vehicle_title_snapshot: vehicleTitle,
      listing_slug_snapshot: listing.slug,
      displayed_price_snapshot: listing.price,
      name,
      email,
      phone,
      preferred_contact: preferredContact,
      message,
      privacy_consent: true,
      source_url: sourceUrl,
    });
    if (insertError) throw insertError;

    await sendMarketplaceEmail({
      apiKey: config.apiKey,
      from: config.from,
      to: config.to,
      replyTo: email,
      subject: `${reference} — enquiry for ${vehicleTitle}`,
      html: `<h1>Vehicle purchase enquiry</h1><p><strong>Reference:</strong> ${escapeHtml(reference)}</p><p><strong>Vehicle:</strong> ${escapeHtml(vehicleTitle)}</p><p><strong>Customer:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Phone:</strong> ${escapeHtml(phone ?? "Not supplied")}<br><strong>Preferred contact:</strong> ${escapeHtml(preferredContact)}</p><p><strong>Message</strong><br>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`,
      text: `Vehicle purchase enquiry\nReference: ${reference}\nVehicle: ${vehicleTitle}\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone ?? "Not supplied"}\nPreferred contact: ${preferredContact}\n\n${message}`,
    });

    return marketplaceJsonResponse(request, { success: true, reference });
  } catch (error) {
    console.error("Marketplace vehicle enquiry failed.", error);
    return marketplaceJsonResponse(request, { error: error instanceof Error ? error.message : "Unable to send your enquiry." }, 500);
  }
});

