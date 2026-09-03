import { useEffect, useState } from "react";
import {
  fetchVehicleServicePricing,
  type VehiclePricingResult,
} from "./vehiclePricing";

export type VehiclePricingLoadState =
  | { error: null; pricing: null; status: "idle" | "loading" }
  | { error: null; pricing: VehiclePricingResult; status: "success" }
  | { error: string; pricing: null; status: "error" };

const idleState: VehiclePricingLoadState = {
  error: null,
  pricing: null,
  status: "idle",
};

export function useVehicleServicePricing({
  enabled,
  make,
  model,
  serviceIds,
  vehicleModelId,
  year,
}: {
  enabled: boolean;
  make: string;
  model: string;
  serviceIds: string[];
  vehicleModelId: number | null;
  year: string;
}): VehiclePricingLoadState {
  const [resolvedState, setResolvedState] = useState<{
    requestKey: string;
    state: VehiclePricingLoadState;
  }>({ requestKey: "", state: idleState });
  const serviceIdsKey = serviceIds.join("|");
  const requestKey = [
    String(vehicleModelId ?? ""),
    make,
    model,
    year,
    serviceIdsKey,
  ].join("|");

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ignore = false;
    const requestedServiceIds = serviceIdsKey.split("|").filter(Boolean);

    void fetchVehicleServicePricing({
      make,
      model,
      serviceIds: requestedServiceIds,
      vehicleModelId,
      year,
    })
      .then((pricing) => {
        if (!ignore) {
          setResolvedState({
            requestKey,
            state: { error: null, pricing, status: "success" },
          });
        }
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load estimated pricing.";

        console.error("Vehicle pricing lookup failed:", error);

        if (!ignore) {
          setResolvedState({
            requestKey,
            state: { error: message, pricing: null, status: "error" },
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [enabled, make, model, requestKey, serviceIdsKey, vehicleModelId, year]);

  if (!enabled) {
    return idleState;
  }

  return resolvedState.requestKey === requestKey
    ? resolvedState.state
    : { error: null, pricing: null, status: "loading" };
}
