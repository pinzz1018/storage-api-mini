// netlify/functions/get.js
// Endpoint: GET /.netlify/functions/get?key=nama_key
// Header: x-api-key: <api key kamu>
// Fungsi: ambil data berdasarkan key milik pemilik API key ini.

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

    const itemKey = event.queryStringParameters && event.queryStringParameters.key;

    if (!itemKey) {
      return jsonResponse(400, { error: 'query parameter "key" wajib diisi, contoh: ?key=nama_key' });
    }

    // Penting: filter selalu pakai api_key_id milik yang punya request ini,
    // supaya user A tidak bisa lihat data user B walau tau nama key-nya.
    const { data, error } = await supabase
      .from('storage_items')
      .select('item_key, item_value, created_at, updated_at')
      .eq('api_key_id', auth.apiKeyRow.id)
      .eq('item_key', itemKey)
      .single();

    if (error || !data) {
      return jsonResponse(404, { error: `Data dengan key "${itemKey}" tidak ditemukan` });
    }

    return jsonResponse(200, {
      key: data.item_key,
      value: data.item_value,
      created_at: data.created_at,
      updated_at: data.updated_at
    });
  } catch (err) {
    console.error('Get error:', err);
    return jsonResponse(500, { error: 'Terjadi kesalahan server', detail: err.message });
  }
};
