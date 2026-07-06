# Innovatrium CMS

A tiny password-protected backend that lets a non-technical admin edit the
website's **application form links**, **deadlines**, and **open / closed status**
per program — with changes going live instantly.

## How it works

- `data/content.json` — the canonical data (what the admin edits).
- `assets/js/site-config.js` — a **generated** file the public pages read on load.
  The server rewrites it every time the admin saves.
- The public site is fully static and never calls this server, so visitors keep
  seeing the last-saved values even if the CMS process is stopped.

Only the admin editor (`/admin.html`) talks to the server, through four routes:

| Method | Route           | Auth | Purpose                                   |
|--------|-----------------|------|-------------------------------------------|
| POST   | `/api/login`    | —    | password → httpOnly session cookie        |
| POST   | `/api/logout`   | ✓    | end the session                           |
| GET    | `/api/content`  | ✓    | load current values into the editor       |
| POST   | `/api/content`  | ✓    | validate → save → regenerate site-config  |

## Run locally

```bash
cd server
cp .env.example .env         # then edit .env and set ADMIN_PASSWORD + SESSION_SECRET
npm install
npm start
```

Then open:

- Site:  http://localhost:3000
- Admin: http://localhost:3000/admin.html

Generate a good `SESSION_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy on the VPS (PM2 + Nginx)

```bash
# on the server, from the repo root
cd server
cp .env.example .env         # set a strong ADMIN_PASSWORD, a random SESSION_SECRET, NODE_ENV=production
npm ci --omit=dev
pm2 start server.js --name innovatrium-cms
pm2 save
```

Point Nginx at the app and terminate HTTPS in front of it:

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
```

Because `NODE_ENV=production` marks the session cookie `secure`, the admin login
only works over HTTPS in production — set up a certificate (e.g. Certbot).

## Notes

- Sessions are stored **in memory**. That is fine for a single PM2 instance
  (which is all this needs). Restarting the process signs admins out, and it does
  not support running multiple clustered instances. Swap in a session store
  (e.g. `connect-sqlite3`) only if you ever need those.
- The admin page has no secrets in it; it is inert without the password, so it is
  safe to leave at `/admin.html`.
- To rotate the password, change `ADMIN_PASSWORD` in `.env` and restart:
  `pm2 restart innovatrium-cms`.
