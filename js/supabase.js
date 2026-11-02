import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  throw new Error(
    'Supabase library is not loaded. Add <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> before your module scripts.'
  );
}

if (!SUPABASE_URL || SUPABASE_URL.includes("PUT_YOUR_SUPABASE_URL_HERE")) {
  console.warn("Supabase URL is missing in config.js");
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("PUT_YOUR_SUPABASE_ANON_KEY_HERE")) {
  console.warn("Supabase anon key is missing in config.js");
}

export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);