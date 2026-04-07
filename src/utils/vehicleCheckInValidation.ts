export type VehicleCheckInPhotoType =
  | "odometer"
  | "front"
  | "rear"
  | "left"
  | "right";

export interface VehicleCheckInValidationValues {
  photos: Record<VehicleCheckInPhotoType, boolean>;
}

export interface VehicleCheckInValidationErrors {
  photos: Partial<Record<VehicleCheckInPhotoType, string>>;
}

export function validateVehicleCheckInForm(
  values: VehicleCheckInValidationValues,
): VehicleCheckInValidationErrors {
  const errors: VehicleCheckInValidationErrors = {
    photos: {},
  };

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
  return Object.values(errors.photos).some(Boolean);
}
