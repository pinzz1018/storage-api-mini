// netlify/functions/delete.js
// Endpoint: DELETE /.netlify/functions/delete?key=nama_key
// Header: x-api-key: <api key kamu>
// Fungsi: hapus data berdasarkan key milik pemilik API key ini.

const { getSupabaseClient, jsonResponse, validateApiKey } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== 'DELETE') {
    return jsonResponse(405, { error: 'Method tidak diizinkan, gunakan DELETE' });
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

    const { data, error } = await supabase
      .from('storage_items')
      .delete()
      .eq('api_key_id', auth.apiKeyRow.id)
      .eq('item_key', itemKey)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return jsonResponse(500, { error: 'Gagal menghapus data' });
    }

    if (!data || data.length === 0) {
      return jsonResponse(404, { error: `Data dengan key "${itemKey}" tidak ditemukan` });
    }

    return jsonResponse(200, { message: `Data dengan key "${itemKey}" berhasil dihapus` });
  } catch (err) {
    console.error('Delete error:', err);
    return jsonResponse(500, { error: 'Terjadi kesalahan server', detail: err.message });
  }
};
