export type VehicleCheckInPhotoType =
  | "odometer"
  | "front"
  | "rear"
  | "left"
  | "right";

export interface VehicleCheckInValidationValues {
  odometerReading: string;
  photos: Record<VehicleCheckInPhotoType, boolean>;
}

export interface VehicleCheckInValidationErrors {
  odometerReading?: string;
  photos: Partial<Record<VehicleCheckInPhotoType, string>>;
}

export function normalizeOdometerReading(value: string): string {
  return value.replace(/[,\s]/g, "").trim();
}

export function parseOdometerReading(value: string): number | null {
  const normalizedValue = normalizeOdometerReading(value);

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

export function validateVehicleCheckInForm(
  values: VehicleCheckInValidationValues,
): VehicleCheckInValidationErrors {
  const errors: VehicleCheckInValidationErrors = {
    odometerReading: undefined,
    photos: {},
  };

  const normalizedOdometerReading = normalizeOdometerReading(
    values.odometerReading,
  );

  if (!normalizedOdometerReading) {
    errors.odometerReading = "Meter reading is required.";
  } else if (!/^\d+$/.test(normalizedOdometerReading)) {
    errors.odometerReading = "Enter the meter reading using numbers only.";
  } else if (normalizedOdometerReading.length > 7) {
    errors.odometerReading = "Meter reading looks too large.";
  }

  (Object.keys(values.photos) as VehicleCheckInPhotoType[]).forEach(
    (photoType) => {
      if (!values.photos[photoType]) {
        errors.photos[photoType] = "This photo is required.";
      }
    },
  );

  return errors;
}

export function hasVehicleCheckInValidationErrors(
  errors: VehicleCheckInValidationErrors,
): boolean {
  return Boolean(errors.odometerReading) || Object.values(errors.photos).some(Boolean);
}
