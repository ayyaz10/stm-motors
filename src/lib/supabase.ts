import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  typeof __STM_SUPABASE_URL__ === "string"
    ? __STM_SUPABASE_URL__.trim()
    : "";
const supabaseAnonKey =
  typeof __STM_SUPABASE_ANON_KEY__ === "string"
    ? __STM_SUPABASE_ANON_KEY__.trim()
    : "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
