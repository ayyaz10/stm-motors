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
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 4 * 1024 * 1024;
const maxImages = 4;

function formValue(form: FormData, key: string, maxLength: number) {
  return trimText(form.get(key), maxLength);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: marketplaceCorsHeaders(request) });
  if (request.method !== "POST") return marketplaceJsonResponse(request, { error: "Method not allowed." }, 405);

  const uploadedPaths: string[] = [];
  let insertedId: string | null = null;

  try {
    const form = await request.formData();
    if (formValue(form, "website", 200)) return marketplaceJsonResponse(request, { success: true, reference: "" });

    const idempotencyKey = formValue(form, "idempotencyKey", 50);
    const name = formValue(form, "name", 120);
    const email = formValue(form, "email", 254).toLowerCase();
    const phone = formValue(form, "phone", 40);
    const postcode = formValue(form, "postcode", 12).toUpperCase();
    const preferredContact = formValue(form, "preferredContact", 20);
    const registrationNumber = formValue(form, "registrationNumber", 15).replace(/\s+/g, "").toUpperCase();
    const make = formValue(form, "make", 80);
    const model = formValue(form, "model", 120);
    const year = Number(formValue(form, "year", 4));
    const mileage = Number(formValue(form, "mileage", 12));
    const condition = formValue(form, "condition", 1500);
    const outstandingFinance = formValue(form, "outstandingFinance", 20);
    const privacyConsent = form.get("privacyConsent") === "true";
    const images = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);

    if (!isUuid(idempotencyKey) || name.length < 2 || !isEmail(email) || phone.length < 7) {
      return marketplaceJsonResponse(request, { error: "Enter valid contact details before submitting." }, 400);
    }
    if (!postcode || !registrationNumber || !make || !model || !Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1 || !Number.isInteger(mileage) || mileage < 0) {
      return marketplaceJsonResponse(request, { error: "Enter valid registration, vehicle, year and mileage details." }, 400);
    }
    if (condition.length < 10 || !["yes", "no", "unsure"].includes(outstandingFinance)) {
      return marketplaceJsonResponse(request, { error: "Describe the vehicle condition and finance status." }, 400);
    }
    if (!["email", "phone", "either"].includes(preferredContact) || !privacyConsent) {
      return marketplaceJsonResponse(request, { error: "Choose a contact method and accept the privacy notice." }, 400);
    }
    if (images.length > maxImages) return marketplaceJsonResponse(request, { error: `Upload no more than ${maxImages} images.` }, 400);
    for (const image of images) {
      if (!allowedImageTypes.has(image.type) || image.size > maxImageBytes) {
        return marketplaceJsonResponse(request, { error: "Images must be JPG, PNG or WebP and no larger than 4MB each." }, 400);
      }
    }

    const config = getMarketplaceEmailConfig();
    await verifyMarketplaceCaptcha({
      token: formValue(form, "captchaToken", 4000),
      secret: config.captchaSecret,
      remoteIp: getRemoteIp(request),
    });

    const { data: existing } = await admin
      .from("marketplace_sell_submissions")
      .select("reference")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing) return marketplaceJsonResponse(request, { success: true, reference: existing.reference });

    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("marketplace_sell_submissions")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);
    if ((count ?? 0) >= 2) return marketplaceJsonResponse(request, { error: "Too many recent submissions. Please wait before trying again." }, 429);

    const id = crypto.randomUUID();
    insertedId = id;
    const reference = `MVS-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const expectedPriceValue = Number(formValue(form, "expectedPrice", 20));
    const previousOwnersValue = Number(formValue(form, "previousOwners", 4));
    const { error: insertError } = await admin.from("marketplace_sell_submissions").insert({
      id,
      reference,
      idempotency_key: idempotencyKey,
      name,
      email,
      phone,
      postcode,
      preferred_contact: preferredContact,
      registration_number: registrationNumber,
      make,
      model,
      year,
      mileage,
      fuel_type: nullableText(form.get("fuelType"), 40),
      transmission: nullableText(form.get("transmission"), 40),
      colour: nullableText(form.get("colour"), 60),
      body_type: nullableText(form.get("bodyType"), 60),
      service_history: nullableText(form.get("serviceHistory"), 1500),
      mot_expiry: formValue(form, "motExpiry", 10) || null,
      previous_owners: Number.isInteger(previousOwnersValue) && previousOwnersValue >= 0 ? previousOwnersValue : null,
      condition,
      known_faults: nullableText(form.get("knownFaults"), 2000),
      outstanding_finance: outstandingFinance,
      expected_price: Number.isFinite(expectedPriceValue) && expectedPriceValue >= 0 ? expectedPriceValue : null,
      additional_notes: nullableText(form.get("additionalNotes"), 2500),
      privacy_consent: true,
      source_url: normalizeSourceUrl(form.get("sourceUrl")),
    });
    if (insertError) throw insertError;

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];
      const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await admin.storage
        .from("marketplace-seller-submissions")
        .upload(path, image, { contentType: image.type, upsert: false });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      const { error: imageRowError } = await admin.from("marketplace_sell_submission_images").insert({
        submission_id: id,
        storage_path: path,
        original_filename: image.name.slice(0, 200),
        mime_type: image.type,
        size_bytes: image.size,
        sort_order: index,
      });
      if (imageRowError) throw imageRowError;
    }

    await sendMarketplaceEmail({
      apiKey: config.apiKey,
      from: config.from,
      to: config.to,
      replyTo: email,
      subject: `${reference} — sell my car: ${year} ${make} ${model}`,
      html: `<h1>Sell my car submission</h1><p><strong>Reference:</strong> ${escapeHtml(reference)}</p><p><strong>Vehicle:</strong> ${escapeHtml(`${year} ${make} ${model}`)}<br><strong>Registration:</strong> ${escapeHtml(registrationNumber)}<br><strong>Mileage:</strong> ${mileage.toLocaleString("en-GB")}</p><p><strong>Customer:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Phone:</strong> ${escapeHtml(phone)}<br><strong>Postcode:</strong> ${escapeHtml(postcode)}</p><p><strong>Condition</strong><br>${escapeHtml(condition).replaceAll("\n", "<br>")}</p><p>${images.length} private image(s) uploaded. Review them in the marketplace admin.</p>`,
      text: `Sell my car submission\nReference: ${reference}\nVehicle: ${year} ${make} ${model}\nRegistration: ${registrationNumber}\nMileage: ${mileage}\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone}\nPostcode: ${postcode}\n\nCondition:\n${condition}\n\n${images.length} private image(s) uploaded.`,
    });

    return marketplaceJsonResponse(request, { success: true, reference });
  } catch (error) {
    console.error("Sell vehicle submission failed.", error);
    if (uploadedPaths.length) await admin.storage.from("marketplace-seller-submissions").remove(uploadedPaths);
    if (insertedId) await admin.from("marketplace_sell_submissions").delete().eq("id", insertedId);
    return marketplaceJsonResponse(request, { error: error instanceof Error ? error.message : "Unable to submit your vehicle." }, 500);
  }
});

