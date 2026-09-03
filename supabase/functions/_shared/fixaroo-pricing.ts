import type { SupabaseClient } from "npm:@supabase/supabase-js@2.100.0";
import {
  DEFAULT_FIXAROO_LABOUR_PRICE,
  getFixarooCategories,
  resolveFixarooServiceParts,
  toFixarooModelSlug,
  toFixarooSlug,
  type FixarooPartCandidate,
  type FixarooSelectedPart,
} from "../../../src/lib/fixarooPricing.ts";

export type PricingSource = "fixaroo" | "mixed" | "supabase_fallback";
export type ServicePricingSource =
  | "fixaroo"
  | "labour_only"
  | "supabase_fallback";

interface VehiclePricingRow {
  mapping_reason: string;
  price: number | string;
  pricing_type: "estimated" | "from";
  service_id: string;
  vehicle_category: "small" | "mid_size" | "suv_premium";
  vehicle_model_id: number | string | null;
}

interface FixarooApiPart {
  brand?: unknown;
  category?: unknown;
  currency?: unknown;
  id?: unknown;
  in_stock?: unknown;
  name?: unknown;
  part_number?: unknown;
  price_from?: unknown;
}

interface FixarooVehiclePartsResponse {
  data?: FixarooApiPart[];
}

export interface ResolvedServicePrice {
  labourPrice: number | null;
  partsPrice: number | null;
  price: number;
  pricingType: "estimated" | "from";
  selectedParts: FixarooSelectedPart[];
  serviceId: string;
  source: ServicePricingSource;
}

export interface ResolvedVehiclePricing {
  mappingReason: string;
  pricesByServiceId: Record<string, ResolvedServicePrice>;
  pricingSource: PricingSource;
  servicePricingSnapshot: Array<{
    labour_price: number | null;
    parts: FixarooSelectedPart[];
    parts_price: number | null;
    pricing_type: "estimated" | "from";
    quoted_price: number;
    service_id: string;
    source: ServicePricingSource;
  }>;
  vehicleCategory: "small" | "mid_size" | "suv_premium";
  vehicleModelId: number | null;
}

const FIXAROO_API_ORIGIN = "https://api.fixaroo.co";
const FIXAROO_CACHE_HOURS = 24;
const FIXAROO_REQUEST_TIMEOUT_MS = 8_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePositivePrice(value: unknown): number | null {
  const priceInPence = Number(value);

  if (!Number.isFinite(priceInPence) || priceInPence <= 0) {
    return null;
  }

  return Number((priceInPence / 100).toFixed(2));
}

function normalizeFixarooParts(
  category: string,
  payload: unknown,
): FixarooPartCandidate[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    return [];
  }

  const rawParts = (payload as FixarooVehiclePartsResponse).data ?? [];

  return rawParts.reduce<FixarooPartCandidate[]>((parts, rawPart) => {
    const price = parsePositivePrice(rawPart.price_from);

    if (
      typeof rawPart.id !== "string" ||
      typeof rawPart.name !== "string" ||
      !price
    ) {
      return parts;
    }

    parts.push({
      brand: typeof rawPart.brand === "string" ? rawPart.brand : undefined,
      category:
        typeof rawPart.category === "string" ? rawPart.category : category,
      currency:
        typeof rawPart.currency === "string" ? rawPart.currency : "GBP",
      id: rawPart.id,
      inStock: rawPart.in_stock !== false,
      name: rawPart.name,
      partNumber:
        typeof rawPart.part_number === "string"
          ? rawPart.part_number
          : undefined,
      price,
    });

    return parts;
  }, []);
}

async function readCachedParts(
  supabaseClient: SupabaseClient,
  cacheKey: string,
): Promise<unknown | null> {
  const { data, error } = await supabaseClient
    .from("fixaroo_parts_cache")
    .select("response")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.warn("Fixaroo cache read failed; continuing without cache.", {
      cacheKey,
      message: error.message,
    });
    return null;
  }

  return data?.response ?? null;
}

async function cacheParts(
  supabaseClient: SupabaseClient,
  cacheKey: string,
  response: unknown,
): Promise<void> {
  const expiresAt = new Date(
    Date.now() + FIXAROO_CACHE_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const { error } = await supabaseClient.from("fixaroo_parts_cache").upsert(
    {
      cache_key: cacheKey,
      expires_at: expiresAt,
      fetched_at: new Date().toISOString(),
      response,
    },
    { onConflict: "cache_key" },
  );

  if (error) {
    console.warn("Fixaroo cache write failed.", {
      cacheKey,
      message: error.message,
    });
  }
}

async function fetchFixarooCategory({
  apiKey,
  category,
  fetchImpl,
  makeSlug,
  modelSlug,
  supabaseClient,
  year,
}: {
  apiKey: string;
  category: string;
  fetchImpl: typeof fetch;
  makeSlug: string;
  modelSlug: string;
  supabaseClient: SupabaseClient;
  year: number;
}): Promise<FixarooPartCandidate[]> {
  const cacheKey = [makeSlug, modelSlug, String(year), category].join("|");
  const cachedResponse = await readCachedParts(supabaseClient, cacheKey);

  if (cachedResponse) {
    return normalizeFixarooParts(category, cachedResponse);
  }

  const requestUrl = new URL(
    `/v1/vehicles/${encodeURIComponent(makeSlug)}/${encodeURIComponent(
      modelSlug,
    )}/${year}/parts`,
    FIXAROO_API_ORIGIN,
  );
  requestUrl.searchParams.set("category", category);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FIXAROO_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(requestUrl, {
      headers: { "X-API-Key": apiKey },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Fixaroo returned HTTP ${response.status}.`);
    }

    const payload: unknown = await response.json();
    await cacheParts(supabaseClient, cacheKey, payload);
    return normalizeFixarooParts(category, payload);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadSupabaseFallback(
  supabaseClient: SupabaseClient,
  {
    make,
    model,
    serviceIds,
    vehicleModelId,
  }: {
    make: string;
    model: string;
    serviceIds: string[];
    vehicleModelId: number | null;
  },
): Promise<VehiclePricingRow[]> {
  const { data, error } = await supabaseClient.rpc(
    "get_vehicle_service_pricing",
    {
      p_make: make || null,
      p_model: model || null,
      p_service_ids: serviceIds,
      p_vehicle_model_id: vehicleModelId,
    },
  );

  if (error) {
    throw new Error(error.message || "Fallback pricing is unavailable.");
  }

  const rows = (data ?? []) as VehiclePricingRow[];

  if (rows.length !== serviceIds.length) {
    throw new Error("Fallback pricing is incomplete.");
  }

  return rows;
}

function getConfiguredLabourPrice(value: number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Number(value.toFixed(2));
  }

  return DEFAULT_FIXAROO_LABOUR_PRICE;
}

async function resolveCatalogVehicle(
  supabaseClient: SupabaseClient,
  {
    make,
    model,
    vehicleModelId,
    year,
  }: {
    make: string;
    model: string;
    vehicleModelId: number | null;
    year: number;
  },
): Promise<{ makeSlug: string; modelSlug: string } | null> {
  if (!vehicleModelId || !Number.isInteger(year)) {
    return null;
  }

  const { data: modelRow, error: modelError } = await supabaseClient
    .from("vehicle_models")
    .select("id, make_id, name")
    .eq("id", vehicleModelId)
    .maybeSingle();

  if (modelError || !modelRow) {
    return null;
  }

  const { data: makeRow, error: makeError } = await supabaseClient
    .from("vehicle_makes")
    .select("name")
    .eq("id", modelRow.make_id)
    .maybeSingle();
  const { data: yearRow, error: yearError } = await supabaseClient
    .from("vehicle_model_years")
    .select("year")
    .eq("model_id", vehicleModelId)
    .eq("year", year)
    .maybeSingle();

  if (makeError || yearError || !makeRow || !yearRow) {
    return null;
  }

  const catalogMakeSlug = toFixarooSlug(String(makeRow.name));
  const catalogModelSlug = toFixarooModelSlug(
    String(makeRow.name),
    String(modelRow.name),
  );

  if (
    catalogMakeSlug !== toFixarooSlug(make) ||
    catalogModelSlug !== toFixarooModelSlug(make, model)
  ) {
    return null;
  }

  return { makeSlug: catalogMakeSlug, modelSlug: catalogModelSlug };
}

export async function resolveVehicleServicePricing({
  fetchImpl = fetch,
  fixarooApiKey,
  labourPrice,
  make,
  model,
  serviceIds,
  supabaseClient,
  vehicleModelId,
  year,
}: {
  fetchImpl?: typeof fetch;
  fixarooApiKey: string;
  labourPrice?: number;
  make: string;
  model: string;
  serviceIds: string[];
  supabaseClient: SupabaseClient;
  vehicleModelId: number | null;
  year: string;
}): Promise<ResolvedVehiclePricing> {
  const uniqueServiceIds = [...new Set(serviceIds)];

  if (!uniqueServiceIds.length || uniqueServiceIds.length !== serviceIds.length) {
    throw new Error("Select at least one valid service.");
  }

  const fallbackRows = await loadSupabaseFallback(supabaseClient, {
    make,
    model,
    serviceIds: uniqueServiceIds,
    vehicleModelId,
  });
  const firstRow = fallbackRows[0];
  const fallbackByServiceId = new Map(
    fallbackRows.map((row) => [row.service_id, row]),
  );
  const resolvedYear = Number(year);
  const catalogVehicle = await resolveCatalogVehicle(supabaseClient, {
    make,
    model,
    vehicleModelId,
    year: resolvedYear,
  });
  const makeSlug = catalogVehicle?.makeSlug ?? "";
  const modelSlug = catalogVehicle?.modelSlug ?? "";
  const canUseFixaroo =
    Boolean(fixarooApiKey) &&
    Boolean(catalogVehicle) &&
    Number.isInteger(resolvedYear) &&
    resolvedYear >= 1886 &&
    resolvedYear <= new Date().getFullYear() + 1;
  const categories = canUseFixaroo
    ? getFixarooCategories(uniqueServiceIds)
    : [];
  const categoryResults = await Promise.all(
    categories.map(async (category) => {
      try {
        const parts = await fetchFixarooCategory({
          apiKey: fixarooApiKey,
          category,
          fetchImpl,
          makeSlug,
          modelSlug,
          supabaseClient,
          year: resolvedYear,
        });
        return [category, parts] as const;
      } catch (error) {
        console.warn("Fixaroo category lookup failed; using fallback pricing.", {
          category,
          make: makeSlug,
          message: error instanceof Error ? error.message : String(error),
          model: modelSlug,
          year: resolvedYear,
        });
        return [category, []] as const;
      }
    }),
  );
  const partsByCategory = Object.fromEntries(categoryResults);
  const resolvedLabourPrice = getConfiguredLabourPrice(labourPrice);
  const pricesByServiceId: Record<string, ResolvedServicePrice> = {};
  const servicePricingSnapshot: ResolvedVehiclePricing["servicePricingSnapshot"] =
    [];

  uniqueServiceIds.forEach((serviceId) => {
    const fallbackRow = fallbackByServiceId.get(serviceId);

    if (!fallbackRow) {
      throw new Error(`Fallback pricing is unavailable for ${serviceId}.`);
    }

    const resolvedParts = canUseFixaroo
      ? resolveFixarooServiceParts(serviceId, partsByCategory)
      : null;
    const source: ServicePricingSource = resolvedParts
      ? resolvedParts.selectedParts.length
        ? "fixaroo"
        : "labour_only"
      : "supabase_fallback";
    const fallbackPrice = Number(fallbackRow.price);
    const price = resolvedParts
      ? Number((resolvedParts.partsPrice + resolvedLabourPrice).toFixed(2))
      : fallbackPrice;
    const servicePrice: ResolvedServicePrice = {
      labourPrice: resolvedParts ? resolvedLabourPrice : null,
      partsPrice: resolvedParts?.partsPrice ?? null,
      price,
      pricingType: fallbackRow.pricing_type,
      selectedParts: resolvedParts?.selectedParts ?? [],
      serviceId,
      source,
    };

    pricesByServiceId[serviceId] = servicePrice;
    servicePricingSnapshot.push({
      labour_price: servicePrice.labourPrice,
      parts: servicePrice.selectedParts,
      parts_price: servicePrice.partsPrice,
      pricing_type: servicePrice.pricingType,
      quoted_price: servicePrice.price,
      service_id: serviceId,
      source,
    });
  });

  const sourceValues = new Set(
    servicePricingSnapshot.map((snapshot) => snapshot.source),
  );
  const allFallback = sourceValues.size === 1 && sourceValues.has("supabase_fallback");
  const hasFallback = sourceValues.has("supabase_fallback");
  const pricingSource: PricingSource = allFallback
    ? "supabase_fallback"
    : hasFallback
      ? "mixed"
      : "fixaroo";
  const resolvedVehicleModelId = Number(firstRow.vehicle_model_id);

  return {
    mappingReason: firstRow.mapping_reason,
    pricesByServiceId,
    pricingSource,
    servicePricingSnapshot,
    vehicleCategory: firstRow.vehicle_category,
    vehicleModelId: Number.isSafeInteger(resolvedVehicleModelId)
      ? resolvedVehicleModelId
      : null,
  };
}
