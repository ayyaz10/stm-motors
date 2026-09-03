import { supabase } from "./supabase";
import type {
  AvailabilityBlock,
  AvailabilityBlockType,
} from "./availability";

export interface CreateAvailabilityBlockPayload {
  date: string;
  start_time: string;
  end_time: string;
  block_type: Exclude<AvailabilityBlockType, "scheduled_job">;
  reason: string | null;
}

export async function fetchPublicUnavailableWindows(
  startDate: string,
  endDate: string,
): Promise<AvailabilityBlock[]> {
  const { data, error } = await supabase.rpc("get_public_unavailable_windows", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    throw new Error(error.message || "Failed to load unavailable windows.");
  }

  return (data ?? []) as AvailabilityBlock[];
}

export async function fetchOpsAvailabilityBlocks(
  startDate: string,
  endDate: string,
): Promise<AvailabilityBlock[]> {
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("id, date, start_time, end_time, block_type, reason, created_at")
    .gte("date", startDate)
    .lte("date", endDate)
    .eq("is_active", true)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load availability blocks.");
  }

  return (data ?? []) as AvailabilityBlock[];
}

export async function createAvailabilityBlock(
  payload: CreateAvailabilityBlockPayload,
): Promise<AvailabilityBlock> {
  const { data, error } = await supabase
    .from("availability_blocks")
    .insert([
      {
        date: payload.date,
        start_time: payload.start_time,
        end_time: payload.end_time,
        block_type: payload.block_type,
        reason: payload.reason,
      },
    ])
    .select("id, date, start_time, end_time, block_type, reason, created_at")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to save availability block.");
  }

  return data as AvailabilityBlock;
}

export async function deleteAvailabilityBlock(blockId: string): Promise<void> {
  const { error } = await supabase
    .from("availability_blocks")
    .update({
      is_active: false,
    })
    .eq("id", blockId);

  if (error) {
    throw new Error(error.message || "Failed to remove availability block.");
  }
}
