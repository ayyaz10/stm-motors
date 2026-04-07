import { supabase } from "./supabase";
import type { VehicleCheckInPhotoType } from "../utils/vehicleCheckInValidation";

export const VEHICLE_CHECK_IN_STORAGE_BUCKET = "vehicle-checks";

export interface VehicleCheckInPhotoUrls {
  odometer: string | null;
  front: string | null;
  rear: string | null;
  left: string | null;
  right: string | null;
}

export interface VehicleCheckInInsertPayload {
  booking_id: string | null;
  job_id: string | null;
  mechanic_name: string;
  mechanic_phone: string | null;
  visible_damage: boolean | null;
  warning_lights: boolean | null;
  notes: string | null;
  odometer_photo_path: string;
  front_photo_path: string;
  rear_photo_path: string;
  left_photo_path: string;
  right_photo_path: string;
  submitted_at: string;
}

export function buildVehicleCheckInPhotoPath(
  referenceId: string,
  photoType: VehicleCheckInPhotoType,
  timestamp: number,
): string {
  return `${referenceId}/${photoType}-${timestamp}.jpg`;
}

export async function uploadVehicleCheckInPhoto(
  path: string,
  file: File,
): Promise<string> {
  const { error } = await supabase.storage
    .from(VEHICLE_CHECK_IN_STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Failed to upload photo.");
  }

  return path;
}

export async function removeVehicleCheckInPhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(VEHICLE_CHECK_IN_STORAGE_BUCKET)
    .remove(paths);

  if (error) {
    throw new Error(error.message || "Failed to clean up uploaded photos.");
  }
}

export async function insertVehicleCheckInRecord(
  payload: VehicleCheckInInsertPayload,
): Promise<string> {
  const { data, error } = await supabase
    .from("vehicle_check_ins")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to save check-in details.");
  }

  return data.id as string;
}

export async function updateVehicleCheckInRecord(
  checkInId: string,
  payload: VehicleCheckInInsertPayload,
): Promise<string> {
  const { data, error } = await supabase
    .from("vehicle_check_ins")
    .update(payload)
    .eq("id", checkInId)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update check-in details.");
  }

  return data.id as string;
}

export async function fetchVehicleCheckInPhotoPathsForJob(
  jobId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("vehicle_check_ins")
    .select(
      "odometer_photo_path, front_photo_path, rear_photo_path, left_photo_path, right_photo_path",
    )
    .eq("job_id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to inspect saved check-in photos.");
  }

  if (!data) {
    return [];
  }

  return [
    data.odometer_photo_path,
    data.front_photo_path,
    data.rear_photo_path,
    data.left_photo_path,
    data.right_photo_path,
  ].filter((path): path is string => Boolean(path));
}

export async function createVehicleCheckInPhotoUrls(paths: {
  odometer_photo_path: string | null;
  front_photo_path: string | null;
  rear_photo_path: string | null;
  left_photo_path: string | null;
  right_photo_path: string | null;
}): Promise<VehicleCheckInPhotoUrls> {
  const entries = [
    { key: "odometer" as const, path: paths.odometer_photo_path },
    { key: "front" as const, path: paths.front_photo_path },
    { key: "rear" as const, path: paths.rear_photo_path },
    { key: "left" as const, path: paths.left_photo_path },
    { key: "right" as const, path: paths.right_photo_path },
  ];
  const activeEntries = entries.filter(
    (entry): entry is { key: keyof VehicleCheckInPhotoUrls; path: string } =>
      Boolean(entry.path),
  );

  if (activeEntries.length === 0) {
    return {
      odometer: null,
      front: null,
      rear: null,
      left: null,
      right: null,
    };
  }

  const { data, error } = await supabase.storage
    .from(VEHICLE_CHECK_IN_STORAGE_BUCKET)
    .createSignedUrls(
      activeEntries.map((entry) => entry.path),
      60 * 60,
    );

  if (error) {
    throw new Error(error.message || "Failed to load check-in photo previews.");
  }

  const urls: VehicleCheckInPhotoUrls = {
    odometer: null,
    front: null,
    rear: null,
    left: null,
    right: null,
  };

  activeEntries.forEach((entry, index) => {
    urls[entry.key] = data[index]?.signedUrl ?? null;
  });

  return urls;
}
