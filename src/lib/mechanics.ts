import { supabase } from "./supabase";

export interface MechanicOption {
  id: string;
  full_name: string | null;
  email: string;
}

export async function fetchMechanicOptions(): Promise<MechanicOption[]> {
  const { data, error } = await supabase.rpc("list_mechanics");

  if (error) {
    throw new Error(error.message || "Failed to load mechanics.");
  }

  return (data ?? []) as MechanicOption[];
}
