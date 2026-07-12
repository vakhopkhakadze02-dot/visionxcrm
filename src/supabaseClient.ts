import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = 
  typeof supabaseUrl === "string" && 
  (supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://")) &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.trim().length > 0;

// Create a mock client if not configured to prevent crashes during setup
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);
