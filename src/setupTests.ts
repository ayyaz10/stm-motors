import "@testing-library/jest-dom";

(globalThis as { __STM_SUPABASE_URL__?: string }).__STM_SUPABASE_URL__ =
  "https://example.supabase.co";
(globalThis as { __STM_SUPABASE_ANON_KEY__?: string }).__STM_SUPABASE_ANON_KEY__ =
  "test-anon-key";
(globalThis as { __STM_RECAPTCHA_SITE_KEY__?: string }).__STM_RECAPTCHA_SITE_KEY__ =
  "";
(globalThis as { __STM_SITE_MODE__?: string }).__STM_SITE_MODE__ = "service";
