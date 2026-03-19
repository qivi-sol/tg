import { createClient } from "@supabase/supabase-js";
import { appConfig, hasSupabaseConfig } from "../lib/config";

let client: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!client) {
    client = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return client;
};
