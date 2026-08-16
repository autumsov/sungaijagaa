/**
 * Configuration & Client Initializer for Supabase Integration
 * 
 * PETUNJUK PENGISIAN:
 * Ganti nilai SUPABASE_URL dan SUPABASE_ANON_KEY di bawah ini dengan kredensial
 * yang ada di Project Settings -> API pada Dashboard Supabase Anda (https://supabase.com).
 */

const SUPABASE_CONFIG = {
  // Masukkan Project URL Supabase Anda di sini (Contoh: "https://xyzcompany.supabase.co")
  url: "YOUR_SUPABASE_PROJECT_URL",
  
  // Masukkan anon / public API key Supabase Anda di sini (AMAH ditaruh di frontend)
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  
  // Storage Bucket Name untuk foto desa
  storageBucket: "sungai-jaga-assets"
};

let _supabaseClient = null;

/**
 * Mengecek apakah kredensial Supabase sudah diisi dengan benar
 */
function isSupabaseConfigured() {
  return (
    typeof window.supabase !== "undefined" &&
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.url !== "YOUR_SUPABASE_PROJECT_URL" &&
    SUPABASE_CONFIG.anonKey &&
    SUPABASE_CONFIG.anonKey !== "YOUR_SUPABASE_ANON_KEY"
  );
}

/**
 * Mengembalikan instance Supabase Client
 */
function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!_supabaseClient && window.supabase && window.supabase.createClient) {
    _supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return _supabaseClient;
}
