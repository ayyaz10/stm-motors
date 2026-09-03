import { formatServicePrice } from "../data/services";
import { supabase } from "./supabase";

export type VehiclePricingCategory = "small" | "mid_size" | "suv_premium";
export type VehiclePricingType = "estimated" | "from";
export type VehiclePricingSource = "fixaroo" | "mixed" | "supabase_fallback";
export type VehicleServicePricingSource =
  | "fixaroo"
  | "labour_only"
  | "supabase_fallback";

export interface VehicleServicePrice {
  labourPrice?: number | null;
  partsPrice?: number | null;
  price: number;
  pricingType: VehiclePricingType;
  serviceId: string;
  source?: VehicleServicePricingSource;
}

export interface VehiclePricingResult {
  mappingReason: string;
  pricesByServiceId: Record<string, VehicleServicePrice>;
  pricingSource?: VehiclePricingSource;
  vehicleCategory: VehiclePricingCategory;
  vehicleModelId: number | null;
}

interface VehiclePartsPricingFunctionResponse {
  error?: string;
  pricing?: VehiclePricingResult;
  success?: boolean;
}

export interface SelectedVehiclePricingSummary {
  displayLabel: string;
  hasFromPrices: boolean;
  totalPrice: number;
}

const isVehiclePricingCategory = (
  value: string,
): value is VehiclePricingCategory =>
  value === "small" || value === "mid_size" || value === "suv_premium";

const isVehiclePricingType = (value: string): value is VehiclePricingType =>
  value === "estimated" || value === "from";

export async function fetchVehicleServicePricing({
  make,
  model,
  serviceIds,
  vehicleModelId,
  year,
}: {
  make: string;
  model: string;
  serviceIds: string[];
  vehicleModelId: number | null;
  year: string;
}): Promise<VehiclePricingResult> {
  const uniqueServiceIds = [...new Set(serviceIds)];

  if (!uniqueServiceIds.length) {
    throw new Error("No services are available for estimated pricing.");
  }

  const { data, error } = await supabase.functions.invoke(
    "vehicle-parts-pricing",
    {
      body: {
        make: make.trim(),
        model: model.trim(),
        serviceIds: uniqueServiceIds,
        vehicleModelId,
        year: year.trim(),
      },
    },
  );

  const result = data as VehiclePartsPricingFunctionResponse | null;

  if (error) {
    throw new Error(
      result?.error || error.message || "Failed to load estimated pricing.",
    );
  }

  if (!result?.success || !result.pricing) {
    throw new Error(result?.error || "Failed to load estimated pricing.");
  }

  const pricing = result.pricing;

  if (!isVehiclePricingCategory(pricing.vehicleCategory)) {
    throw new Error("The vehicle pricing category is unavailable.");
  }

  const pricesByServiceId = Object.entries(
    pricing.pricesByServiceId ?? {},
  ).reduce<Record<string, VehicleServicePrice>>((prices, [serviceId, row]) => {
    const price = Number(row.price);

    if (
      !uniqueServiceIds.includes(serviceId) ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !isVehiclePricingType(row.pricingType)
    ) {
      throw new Error("The pricing service returned an invalid estimated price.");
    }

    prices[serviceId] = {
      labourPrice:
        typeof row.labourPrice === "number" ? row.labourPrice : null,
      partsPrice: typeof row.partsPrice === "number" ? row.partsPrice : null,
      price,
      pricingType: row.pricingType,
      serviceId,
      source: row.source,
    };

    return prices;
  }, {});

  if (Object.keys(pricesByServiceId).length !== uniqueServiceIds.length) {
    throw new Error("Estimated pricing is incomplete for the selected services.");
  }

  return {
    mappingReason: pricing.mappingReason,
    pricesByServiceId,
    pricingSource: pricing.pricingSource,
    vehicleCategory: pricing.vehicleCategory,
    vehicleModelId: pricing.vehicleModelId,
  };
}

export function formatVehicleServicePrice(
  servicePrice: VehicleServicePrice,
): string {
  const formattedPrice = Number.isInteger(servicePrice.price)
    ? `£${servicePrice.price.toFixed(0)}`
    : formatServicePrice(servicePrice.price);

  return servicePrice.pricingType === "from"
    ? `From ${formattedPrice}`
    : formattedPrice;
}

export function getSelectedVehiclePricingSummary(
  selectedServiceIds: string[],
  pricing: VehiclePricingResult | null,
): SelectedVehiclePricingSummary | null {
  if (!pricing || selectedServiceIds.length === 0) {
    return null;
  }

  const selectedPrices = selectedServiceIds.map(
    (serviceId) => pricing.pricesByServiceId[serviceId],
  );

  if (selectedPrices.some((servicePrice) => !servicePrice)) {
    return null;
  }

  const totalPrice = Number(
    selectedPrices
      .reduce((total, servicePrice) => total + servicePrice.price, 0)
      .toFixed(2),
  );
  const hasFromPrices = selectedPrices.some(
    (servicePrice) => servicePrice.pricingType === "from",
  );

  return {
    displayLabel: `${hasFromPrices ? "From " : ""}${
      Number.isInteger(totalPrice)
        ? `£${totalPrice.toFixed(0)}`
        : formatServicePrice(totalPrice)
    }`,
    hasFromPrices,
    totalPrice,
  };
}
