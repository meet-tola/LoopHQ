import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Env } from "../config/env.config";

const supabaseUrl = Env.SUPABASE_URL;
const supabaseAnonKey = Env.SUPABASE_ANON_KEY;
const supabaseServiceKey = Env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Public client — uses the user's JWT for RLS-scoped queries
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Service role client — bypasses RLS
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Creates a client authenticated as a specific user
export const supabaseWithAuth = (
  accessToken: string
): SupabaseClient =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });