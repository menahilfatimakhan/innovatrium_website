/* ==========================================================================
   Innovatrium site server
   --------------------------------------------------------------------------
   Serves the static site and one webhook endpoint that Strapi calls on
   publish/update to regenerate the affected static pages.

   Content lives in Strapi now (see ../cms). This process never edits
   content itself — it only serves files and reacts to Strapi's webhook.
   Visitors read plain static HTML/CSS/JS, so the site keeps working even if
   Strapi itself is down; only editing requires Strapi to be up.
   ========================================================================== */
'use strict';

const path = require('path');
const express = require('express');
const { generateAll } = require('./generate');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const ROOT = path.join(__dirname, '..');

const app = express();
app.disable('x-powered-by');

/* --- Never expose server internals over HTTP ------------------------------ */
app.use((req, res, next) => {
  if (req.path.startsWith('/server') || req.path.startsWith('/node_modules')) {
    return res.status(404).send('Not found');
  }
  next();
});

/* --- Strapi webhook: regenerate static pages on publish/update/delete ----- */
app.post('/api/webhooks/strapi-publish', express.json(), async (req, res) => {
  const secret = req.get('x-webhook-secret');
  if (!process.env.STRAPI_WEBHOOK_SECRET || secret !== process.env.STRAPI_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }
  try {
    const generated = await generateAll();
    res.json({ ok: true, generated });
  } catch (e) {
    res.status(500).json({ error: 'Could not generate: ' + e.message });
  }
});

/* --- Static site (served last so /api and guards win) --------------------- */
app.use(express.static(ROOT, { dotfiles: 'ignore', extensions: ['html'] }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Innovatrium site running on http://localhost:${PORT}`);
});
