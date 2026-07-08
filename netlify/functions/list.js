// netlify/functions/list.js
// Endpoint: GET /.netlify/functions/list
// Header: x-api-key: <api key kamu>
// Fungsi: lihat semua key yang dipunya oleh pemilik API key ini (tanpa value lengkap,
// hanya ringkasan, biar response tidak kebesaran kalau datanya banyak).

const { getSupabaseClient, jsonResponse, validateApiKey } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method tidak diizinkan, gunakan GET' });
  }

  try {
    const supabase = getSupabaseClient();

    const auth = await validateApiKey(supabase, event);
    if (!auth.valid) {
      return jsonResponse(401, { error: auth.error });
    }

    const { data, error } = await supabase
      .from('storage_items')
      .select('item_key, created_at, updated_at')
      .eq('api_key_id', auth.apiKeyRow.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return jsonResponse(500, { error: 'Gagal mengambil daftar data' });
    }

    return jsonResponse(200, {
      total: data.length,
      items: data
    });
  } catch (err) {
    console.error('List error:', err);
    return jsonResponse(500, { error: 'Terjadi kesalahan server', detail: err.message });
  }
};
