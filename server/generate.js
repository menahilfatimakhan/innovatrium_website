/* ==========================================================================
   generate.js — builds static <slug>.html pages from Strapi's Page
   collection. Run standalone (`node generate.js`) or call generateAll()
   from the server's webhook endpoint after a Strapi publish. Only pages
   flagged "isGenerated": true are (re)written, so the hand-built pages are
   never touched until they are migrated into blocks.
   ========================================================================== */
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { renderProgramPage } = require('./render');

const ROOT = path.join(__dirname, '..');
const CONFIG_FILE = path.join(ROOT, 'assets', 'js', 'site-config.js');
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Media fields nested inside a dynamic-zone component's own repeatable
// sub-components (e.g. gallery items' images, logo items' src) aren't
// reached by a blanket populate[blocks][populate]=* — Strapi only follows
// that one level deep. Each block type needing deeper population is spelled
// out explicitly via the dynamic-zone "on" morph-populate syntax instead.
const POPULATE_QUERY = [
  'populate[blocks][on][block.rich-text][populate]=*',
  'populate[blocks][on][block.card-grid][populate][cards]=true',
  'populate[blocks][on][block.steps][populate][steps]=true',
  'populate[blocks][on][block.testimonials][populate][items]=true',
  'populate[blocks][on][block.logos][populate][logos][populate]=src',
  'populate[blocks][on][block.logos][populate][logos2][populate]=src',
  'populate[blocks][on][block.cta][populate]=*',
  'populate[blocks][on][block.stats][populate][items]=true',
  'populate[blocks][on][block.gallery][populate][items][populate]=image',
  'populate[blocks][on][block.custom-html][populate][items]=true',
  'populate[blocks][on][block.highlight][populate]=*',
  'populate[hero]=true',
  'populate[theme]=true',
  'populate[application]=true',
].join('&');

async function fetchPages() {
  const res = await fetch(`${STRAPI_URL}/api/pages?${POPULATE_QUERY}&pagination[pageSize]=100`, {
    headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`GET /api/pages -> ${res.status}`);
  const body = await res.json();
  return body.data || [];
}

async function fetchSiteSettings() {
  const res = await fetch(`${STRAPI_URL}/api/site-setting?populate=*`, {
    headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
  });
  if (res.status === 404) return null; // no entry saved yet
  if (!res.ok) throw new Error(`GET /api/site-setting -> ${res.status}`);
  const body = await res.json();
  return body.data || null;
}

function generateConfigJs(settings) {
  const data = {
    contactEmail: settings.contactEmail,
    phone: settings.phone,
    address: settings.address,
    whatsapp: settings.whatsapp,
    socials: {
      instagram: settings.socials && settings.socials.instagram,
      facebook: settings.socials && settings.socials.facebook,
      linkedin: settings.socials && settings.socials.linkedin,
    },
  };
  return '/* ==========================================================================\n' +
         '   Innovatrium — Site Configuration (GENERATED from the Strapi CMS).\n' +
         '   Do not edit by hand; changes are overwritten on the next regenerate.\n' +
         '   ========================================================================== */\n' +
         'window.SITE_CONFIG = ' + JSON.stringify(data, null, 2) + ';\n';
}

async function generateAll() {
  const [pages, settings] = await Promise.all([fetchPages(), fetchSiteSettings()]);
  const written = [];

  if (settings) {
    fs.writeFileSync(CONFIG_FILE, generateConfigJs(settings));
    written.push('assets/js/site-config.js');
  }

  pages.forEach(p => {
    if (!p.isGenerated) return;
    const html = renderProgramPage(p, pages, STRAPI_URL);
    const filename = p.isHomepage ? 'index.html' : `${p.slug}.html`;
    fs.writeFileSync(path.join(ROOT, filename), html);
    written.push(filename);
  });
  return written;
}

if (require.main === module) {
  generateAll()
    .then(done => {
      console.log(done.length ? 'Generated: ' + done.join(', ') : 'No pages flagged "isGenerated": true');
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { generateAll, fetchPages };
