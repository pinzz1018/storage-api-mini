// netlify/functions/register.js
// Endpoint: POST /.netlify/functions/register
// Body: { "owner_name": "nama kamu atau nama project" }
// Fungsi: generate API key baru untuk user/project.

const crypto = require('crypto');
const { getSupabaseClient, jsonResponse } = require('./_supabase');

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method tidak diizinkan, gunakan POST' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const ownerName = (body.owner_name || '').trim();

    if (!ownerName) {
      return jsonResponse(400, { error: 'owner_name wajib diisi' });
    }

    if (ownerName.length > 100) {
      return jsonResponse(400, { error: 'owner_name maksimal 100 karakter' });
    }

    // Generate API key acak yang aman (32 bytes -> hex string)
    const newKey = 'sk_' + crypto.randomBytes(24).toString('hex');

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('api_keys')
      .insert({ key: newKey, owner_name: ownerName })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return jsonResponse(500, { error: 'Gagal membuat API key' });
    }

    return jsonResponse(201, {
      message: 'API key berhasil dibuat. Simpan baik-baik, key ini tidak akan ditampilkan lagi.',
      api_key: newKey,
      owner_name: data.owner_name,
      created_at: data.created_at
    });
  } catch (err) {
    console.error('Register error:', err);
    return jsonResponse(500, { error: 'Terjadi kesalahan server', detail: err.message });
  }
};
