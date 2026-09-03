import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __STM_SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL ?? ""),
      __STM_SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY ?? ""),
      __STM_RECAPTCHA_SITE_KEY__: JSON.stringify(
        env.VITE_RECAPTCHA_SITE_KEY ?? "",
      ),
      __STM_SITE_MODE__: JSON.stringify(
        env.VITE_SITE_MODE ??
          (mode === "marketplace" || mode === "staff" ? mode : "auto"),
      ),
    },
  };
})
