# Innovatrium site server

A small Express process with two jobs:

1. Serve the static site (plain HTML/CSS/JS at the repo root).
2. Receive a webhook from Strapi and regenerate the affected static pages.

All content editing happens in **Strapi** (`../cms`), not here. This process
never talks to an editor directly — it only serves files and reacts to
Strapi's webhook. The public site is fully static, so visitors keep seeing
the last-generated pages even if Strapi itself is down; only editing
requires Strapi to be up.

## How it works

- `../cms` — the Strapi CMS. Editors log into its admin panel and edit
  Pages (block-based content) and Site Settings (contact/social info).
- `generate.js` — fetches published content from Strapi's REST API and
  writes `<slug>.html` at the repo root (`index.html` for the page flagged
  `isHomepage`), using `render.js`'s block renderers. Also regenerates
  `assets/js/site-config.js` from Site Settings — a small generated file the
  public pages read at runtime via `data-cms="..."` attributes
  (`assets/js/main.js`) for instant, no-rebuild updates to contact info.
- `server.js` — serves the static site, and exposes
  `POST /api/webhooks/strapi-publish`, which Strapi calls on publish/update
  so pages regenerate automatically.

## Run locally

```bash
# 1) Start Strapi (separate process, separate port)
cd cms
npm install
npm run develop
# first run: register an admin user at http://localhost:1337/admin

# 2) Start the site server
cd server
cp .env.example .env    # set STRAPI_URL, STRAPI_API_TOKEN, STRAPI_WEBHOOK_SECRET
npm install
npm start
```

Then open:

- Site: http://localhost:3000
- Strapi admin: http://localhost:1337/admin

`STRAPI_API_TOKEN` is a full-access API token, created in Strapi under
Settings > API Tokens. `STRAPI_WEBHOOK_SECRET` is a random string you choose;
configure the same value as a custom header (e.g. `X-Webhook-Secret`) on the
webhook you set up in Strapi's admin (Settings > Webhooks), pointed at
`http://<site-server-host>/api/webhooks/strapi-publish`, firing on the
`entry.publish`/`entry.update`/`entry.unpublish` events for the Page and
Site Setting content types.

To regenerate manually without waiting for a webhook:

```bash
cd server
node generate.js
```

## Deploy on the VPS (PM2 + Nginx)

Run Strapi and the site server as two separate PM2 processes:

```bash
# Strapi
cd cms
npm ci
npm run build
pm2 start npm --name innovatrium-cms -- run start

# Site server
cd ../server
cp .env.example .env    # set STRAPI_URL to Strapi's public URL, real API token/webhook secret, NODE_ENV=production
npm ci --omit=dev
pm2 start server.js --name innovatrium-site
pm2 save
```

Point Nginx at both — the main domain at the site server, and a subdomain
(recommended over a path prefix, to avoid Strapi's admin SPA routing issues)
at Strapi:

```nginx
server {
    server_name innovatrium.example.pk;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}

server {
    server_name cms.innovatrium.example.pk;

    location / {
        proxy_pass         http://127.0.0.1:1337;
        proxy_set_header   Host $host;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Set up HTTPS for both hosts (e.g. Certbot), and set `STRAPI_URL` in the site
server's `.env` to Strapi's public HTTPS URL — that value gets baked
directly into generated pages' image `src` attributes, so it must be
reachable by visitors' browsers, not just by the site server.

## Notes

- Uploaded media (images) live in Strapi's media library and are served
  from Strapi itself — the static pages only store the resulting URL. Keep
  Strapi's `.tmp`/uploads storage (or configure a remote provider like S3)
  backed up.
- Strapi's own admin users/roles replace the old single shared password —
  create one account per real editor rather than sharing credentials.
