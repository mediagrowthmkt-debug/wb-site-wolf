/**
 * submit-form.js — Wolf Carpenters lead capture → GHL
 * Netlify Serverless Function
 *
 * Receives form data, creates/upserts contact in GHL with source "site",
 * then adds a note with the service and message details.
 *
 * Env vars required in Netlify dashboard:
 *   GHL_WOLF_API_KEY  — Wolf Carpenters GHL Private Integration token
 */

const https = require('https');

const GHL_LOCATION_ID = 'xZgZbZ25TgMXr6HsImkO';
const GHL_API_HOST    = 'services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

function ghlRequest(method, path, data, apiKey) {
  return new Promise((resolve, reject) => {
    const body    = JSON.stringify(data);
    const options = {
      hostname: GHL_API_HOST,
      path,
      method,
      headers: {
        Authorization:    `Bearer ${apiKey}`,
        'Content-Type':   'application/json',
        Version:          GHL_API_VERSION,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const CORS_HEADERS = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.GHL_WOLF_API_KEY;
  if (!apiKey) {
    console.error('[submit-form] GHL_WOLF_API_KEY not configured');
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  // Parse payload
  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const {
    name    = '',
    email   = '',
    phone   = '',
    message = '',
    service = '',
    address = '',
  } = payload;

  // Split name → firstName / lastName
  const parts     = name.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName  = parts.slice(1).join(' ') || '';

  // Build tags
  const tags = ['website-lead'];
  if (service) tags.push(`service:${service}`);

  // Contact payload — source "site" is the key requirement
  const contactBody = {
    locationId: GHL_LOCATION_ID,
    firstName,
    lastName,
    name:       name.trim() || undefined,
    email:      email.trim() || undefined,
    phone:      phone.trim() || undefined,
    source:     'site',
    tags,
  };
  if (address) contactBody.address1 = address.trim();

  // Remove undefined keys
  Object.keys(contactBody).forEach((k) => contactBody[k] === undefined && delete contactBody[k]);

  try {
    // 1. Upsert contact
    const contactRes = await ghlRequest('POST', '/contacts/', contactBody, apiKey);

    if (contactRes.status !== 200 && contactRes.status !== 201) {
      console.error('[submit-form] GHL contact error:', JSON.stringify(contactRes.body));
      return {
        statusCode: 502,
        headers:    CORS_HEADERS,
        body:       JSON.stringify({ error: 'Failed to create contact', detail: contactRes.body }),
      };
    }

    const contactId = contactRes.body?.contact?.id;

    // 2. Add note with service + message details (only if there's content)
    if (contactId && (message || service || address)) {
      const noteLines = [];
      if (service) noteLines.push(`Service: ${service}`);
      if (address) noteLines.push(`Address: ${address}`);
      if (message) noteLines.push(`Message:\n${message}`);

      await ghlRequest(
        'POST',
        `/contacts/${contactId}/notes`,
        { body: noteLines.join('\n') },
        apiKey
      ).catch((err) => console.warn('[submit-form] Note creation failed (non-fatal):', err.message));
    }

    return {
      statusCode: 200,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ success: true, contactId }),
    };

  } catch (err) {
    console.error('[submit-form] Unexpected error:', err);
    return {
      statusCode: 500,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
