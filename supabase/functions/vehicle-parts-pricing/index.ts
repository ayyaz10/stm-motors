import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { resolveVehicleServicePricing } from "../_shared/fixaroo-pricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};
const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
const fixarooPricingEnabled =
  Deno.env.get("FIXAROO_PRICING_ENABLED")?.trim().toLowerCase() === "true";
const fixarooApiKey = fixarooPricingEnabled
  ? Deno.env.get("FIXAROO_API_KEY")?.trim() ?? ""
  : "";
const configuredLabourPrice = Number(
  Deno.env.get("FIXAROO_LABOUR_PRICE")?.trim() ?? "40",
);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for vehicle-parts-pricing.",
  );
}

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const body: unknown = await request.json();

    if (!isRecord(body) || !Array.isArray(body.serviceIds)) {
      return jsonResponse(
        { success: false, error: "Vehicle and service details are required." },
        400,
      );
    }

    const serviceIds = body.serviceIds.filter(
      (serviceId): serviceId is string => typeof serviceId === "string",
    );
    const numericVehicleModelId = Number(body.vehicleModelId);
    const pricing = await resolveVehicleServicePricing({
      fixarooApiKey,
      labourPrice: configuredLabourPrice,
      make: typeof body.make === "string" ? body.make.trim() : "",
      model: typeof body.model === "string" ? body.model.trim() : "",
      serviceIds,
      supabaseClient: adminClient,
      vehicleModelId: Number.isSafeInteger(numericVehicleModelId)
        ? numericVehicleModelId
        : null,
      year: typeof body.year === "string" ? body.year.trim() : "",
    });

    return jsonResponse({ success: true, pricing });
  } catch (error) {
    console.error("Vehicle parts pricing failed.", error);
    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Vehicle parts pricing is unavailable.",
      },
      400,
    );
  }
});
