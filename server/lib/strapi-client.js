/* ==========================================================================
   strapi-client.js — small shared helper for one-off scripts that write
   content into Strapi (migrate-to-strapi.js, convert-<slug>.js). Not used
   by the running server; these scripts are run manually, once per page.
   ========================================================================== */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const STRAPI_URL = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_URL || !TOKEN) {
  console.error('Missing STRAPI_URL or STRAPI_API_TOKEN in server/.env');
  process.exit(1);
}

async function api(pathname, options = {}) {
  const res = await fetch(`${STRAPI_URL}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${pathname} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function findPageBySlug(slug) {
  const res = await api(`/api/pages?filters[slug][$eq]=${encodeURIComponent(slug)}&status=draft`);
  return res.data && res.data[0] ? res.data[0] : null;
}

async function upsertPage(slug, data) {
  const existing = await findPageBySlug(slug);
  if (existing) {
    await api(`/api/pages/${existing.documentId}?status=published`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
    console.log(`Updated + published page "${slug}".`);
  } else {
    await api('/api/pages?status=published', { method: 'POST', body: JSON.stringify({ data }) });
    console.log(`Created + published page "${slug}".`);
  }
}

// Uploads a local file to Strapi's media library and returns its numeric id
// (usable directly as a media field's value). Idempotent: if a file with the
// same name was already uploaded, reuses it instead of duplicating.
async function uploadFile(localPath) {
  const fs = require('fs');
  const path = require('path');
  const name = path.basename(localPath);

  const existingRes = await fetch(`${STRAPI_URL}/api/upload/files?filters[name][$eq]=${encodeURIComponent(name)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (existingRes.ok) {
    const existing = await existingRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      console.log(`Reusing already-uploaded media "${name}" (id ${existing[0].id}).`);
      return existing[0].id;
    }
  }

  const buffer = fs.readFileSync(localPath);
  const form = new FormData();
  form.append('files', new Blob([buffer]), name);

  const res = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`POST /api/upload (${name}) -> ${res.status}: ${JSON.stringify(body)}`);
  }
  console.log(`Uploaded "${name}" (id ${body[0].id}).`);
  return body[0].id;
}

module.exports = { api, findPageBySlug, upsertPage, uploadFile };
