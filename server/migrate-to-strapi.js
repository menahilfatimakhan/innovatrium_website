/* ==========================================================================
   migrate-to-strapi.js — one-off migration of data/content.json and
   data/programs.json into the new Strapi CMS. Run once:
     node migrate-to-strapi.js
   Requires STRAPI_URL and STRAPI_API_TOKEN in server/.env (full-access token).
   Safe to re-run: pages are looked up by slug and updated in place rather
   than duplicated; site-setting is a single type so PUT always overwrites.
   ========================================================================== */
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STRAPI_URL = process.env.STRAPI_URL;
const TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_URL || !TOKEN) {
  console.error('Missing STRAPI_URL or STRAPI_API_TOKEN in server/.env');
  process.exit(1);
}

const BLOCK_COMPONENT = {
  richText: 'block.rich-text',
  cardGrid: 'block.card-grid',
  steps: 'block.steps',
  testimonials: 'block.testimonials',
  logos: 'block.logos',
  cta: 'block.cta',
};

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

function toBlockComponents(blocks) {
  return (blocks || []).map((b) => {
    const { type, ...rest } = b;
    const component = BLOCK_COMPONENT[type];
    if (!component) throw new Error(`Unknown block type during migration: ${type}`);
    // richtext fields are a single string; the old schema stored body as an
    // array of paragraphs, joined here with blank lines as the separator.
    if (type === 'richText' && Array.isArray(rest.body)) {
      rest.body = rest.body.join('\n\n');
    }
    return { __component: component, ...rest };
  });
}

async function migrateSiteSettings(content) {
  const data = {
    contactEmail: content.contactEmail,
    phone: content.phone,
    address: content.address,
    whatsapp: content.whatsapp,
    socials: content.socials || {},
  };
  await api('/api/site-setting', { method: 'PUT', body: JSON.stringify({ data }) });
  console.log('Migrated site-setting.');
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

async function migratePages(content, programs) {
  const legacyApplications = content.pages || {};

  for (const p of programs) {
    if (p.generated) continue; // aistudio handled separately below, with full schema
    const app = legacyApplications[p.slug];
    const data = {
      navLabel: p.navLabel,
      slug: p.slug,
      order: p.order || 0,
      isHomepage: false,
      isGenerated: false, // hand-coded HTML is still the source of truth until Phase 2 converts it
      application: app
        ? { formUrl: app.formUrl, deadline: app.deadline, status: app.status }
        : undefined,
      blocks: [],
    };
    await upsertPage(p.slug, data);
  }

  const aistudio = programs.find((p) => p.generated);
  if (aistudio) {
    const data = {
      navLabel: aistudio.navLabel,
      slug: aistudio.slug,
      order: aistudio.order || 0,
      isHomepage: false,
      isGenerated: true,
      theme: aistudio.theme,
      hero: aistudio.hero,
      application: aistudio.application,
      blocks: toBlockComponents(aistudio.blocks),
    };
    await upsertPage(aistudio.slug, data);
  }
}

async function main() {
  const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'content.json'), 'utf8'));
  const programs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'programs.json'), 'utf8')).programs || [];

  await migrateSiteSettings(content);
  await migratePages(content, programs);

  console.log('Migration complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
