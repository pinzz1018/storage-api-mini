// netlify/functions/_supabase.js
// Helper untuk koneksi ke Supabase, dipakai semua function lain.
// File yang diawali underscore (_) tidak jadi endpoint sendiri,
// cuma dipakai sebagai "module" internal.

const { createClient } = require('@supabase/supabase-js');

// Secret key HANYA ada di sini (backend), tidak pernah dikirim ke browser.
// Diambil dari Environment Variables Netlify, bukan hardcode di kode.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('SUPABASE_URL atau SUPABASE_SECRET_KEY belum di-set di environment variables');
  }
  return createClient(supabaseUrl, supabaseSecretKey);
}

// Helper untuk format response JSON yang konsisten
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      // Izinkan diakses dari domain manapun (buat testing).
      // Nanti bisa dibatasi ke domain tertentu saja kalau sudah production.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

// Helper untuk validasi API key dari header request.
// Mengembalikan data api_key row kalau valid, atau null kalau tidak valid.
async function validateApiKey(supabase, event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-Api-Key'];

  if (!apiKey) {
    return { valid: false, error: 'Header x-api-key tidak ditemukan' };
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key', apiKey)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false, error: 'API key tidak valid atau tidak aktif' };
  }

  // Update last_used_at (tidak perlu ditunggu / non-blocking)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {});

  return { valid: true, apiKeyRow: data };
}

module.exports = { getSupabaseClient, jsonResponse, validateApiKey };
