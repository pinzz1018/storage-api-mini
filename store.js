// netlify/functions/store.js
// Endpoint: POST /.netlify/functions/store
// Header: x-api-key: <api key kamu>
// Body: { "key": "nama_key", "value": <apa saja - string/object/array/number> }
// Fungsi: simpan atau update data key-value milik pemilik API key ini.

const { getSupabaseClient, jsonResponse, validateApiKey } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method tidak diizinkan, gunakan POST' });
  }

  try {
    const supabase = getSupabaseClient();

    const auth = await validateApiKey(supabase, event);
    if (!auth.valid) {
      return jsonResponse(401, { error: auth.error });
    }

    const body = JSON.parse(event.body || '{}');
    const itemKey = (body.key || '').trim();
    const itemValue = body.value;

    if (!itemKey) {
      return jsonResponse(400, { error: 'field "key" wajib diisi' });
    }

    if (itemKey.length > 200) {
      return jsonResponse(400, { error: 'key maksimal 200 karakter' });
    }

    if (itemValue === undefined) {
      return jsonResponse(400, { error: 'field "value" wajib diisi' });
    }

    // Batasi ukuran value biar tidak ada yang nyimpen data raksasa (proteksi kasar)
    const valueSize = JSON.stringify(itemValue).length;
    if (valueSize > 500000) { // ~500KB
      return jsonResponse(400, { error: 'value terlalu besar, maksimal ~500KB' });
    }

    // Upsert: kalau key sudah ada untuk api_key ini, update. Kalau belum, insert baru.
    const { data, error } = await supabase
      .from('storage_items')
      .upsert(
        {
          api_key_id: auth.apiKeyRow.id,
          item_key: itemKey,
          item_value: itemValue,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'api_key_id,item_key' }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return jsonResponse(500, { error: 'Gagal menyimpan data' });
    }

    return jsonResponse(200, {
      message: 'Data berhasil disimpan',
      key: data.item_key,
      value: data.item_value,
      updated_at: data.updated_at
    });
  } catch (err) {
    console.error('Store error:', err);
    return jsonResponse(500, { error: 'Terjadi kesalahan server', detail: err.message });
  }
};
