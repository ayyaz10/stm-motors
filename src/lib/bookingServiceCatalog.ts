import {
  getServicePricingSummary,
  services,
  type ServicePricingModel,
} from "../data/services.ts";

export interface TrustedBookingService {
  id: string;
  pricingModel: ServicePricingModel;
  name: string;
  price: number;
  labourTime: string;
}

export const TRUSTED_BOOKING_SERVICES: TrustedBookingService[] = services
  .filter((service) => service.active)
  .map((service) => ({
    id: service.id,
    pricingModel: service.pricingModel,
    name: service.name,
    price: service.price,
    labourTime: service.labourTime,
  }));

const serviceById = new Map(
  TRUSTED_BOOKING_SERVICES.map((service) => [service.id, service]),
);

export function getTrustedBookingServices(
  serviceIds: string[],
): TrustedBookingService[] {
  const normalizedIds = serviceIds
    .map((serviceId) => serviceId.trim())
    .filter((serviceId) => serviceId.length > 0);

  if (normalizedIds.length === 0) {
    throw new Error("Select at least one valid service.");
  }

  const uniqueIds = new Set(normalizedIds);

  if (uniqueIds.size !== normalizedIds.length) {
    throw new Error("Duplicate services are not allowed.");
  }

  return normalizedIds.map((serviceId) => {
    const trustedService = serviceById.get(serviceId);

    if (!trustedService) {
      throw new Error(`Unsupported service: ${serviceId}`);
    }

    return trustedService;
  });
}

export function getTrustedBookingTotal(serviceIds: string[]): number {
  const total = getTrustedBookingServices(serviceIds).reduce(
    (sum, service) =>
      service.pricingModel === "fixed" ? sum + service.price : sum,
    0,
  );

  return Number(total.toFixed(2));
}

export function getTrustedBookingPricingSummary(
  serviceIds: string[],
  fixedTotalOverride?: number,
) {
  getTrustedBookingServices(serviceIds);

  return getServicePricingSummary(serviceIds, fixedTotalOverride);
}
