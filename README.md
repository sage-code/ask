# Ask Cloudflare Svelte

This project is a Cloudflare-ready quiz app built with Svelte and Cloudflare Workers.

## Features

* Mentor / Student registration
* Shared quiz URLs by slug
* Quiz content stored in JSON files
* D1 database stores users and quiz results only
* Cloudflare Worker API for registration and result persistence

## Project layout

* `index.html` - Svelte app entry file
* `src/` - Svelte application source code
* `public/quizzes/` - quiz content JSON files
* `worker/index.js` - Cloudflare Worker API
* `scripts/schema.sql` - D1 database schema
* `wrangler.toml` - Cloudflare Worker configuration
* `doc/architecture.html` - Cloudflare runway architecture
* `doc/database.html` - database structure and D1 setup

## Prerequisites

* Node.js 18 or newer
* npm (bundled with Node.js)
* Optional: `wrangler` CLI for Cloudflare Worker deployment

## Local testing

1. Install dependencies:

```bash
npm install
```

2. Run the Svelte dev server:

```bash
npm run dev
```

3. Open the app in your browser at the local URL shown by Vite, typically:

```text
http://localhost:5173
```

4. If you want to run the Cloudflare Worker locally, install Wrangler globally:

```bash
npm install -g wrangler
```

Then start the worker dev environment with:

```bash
wrangler dev
```

## Cloudflare deployment

1. Create a Cloudflare account and install Wrangler.
2. Create a D1 database in the Cloudflare dashboard.
3. Update `wrangler.toml`:

* Remove any empty `account_id` field.
* Set the D1 binding using `database_id`.

Example:

```toml
name = "ask-cloudflare-svelte"
main = "./worker/index.js"
workers_dev = true
compatibility_date = "2026-01-01"

[[d1_databases]]
binding = "DATABASE"
database_id = "YOUR_D1_DATABASE_ID"

[build]
command = "npm install && npm run build"

[vars]
DATABASE_URL = ""
```

4. Deploy with:

```bash
npx wrangler deploy
```

## Notes

* `public/quizzes/` contains JSON quiz files loaded by the front-end.
* The Worker stores only `users` and `results` in D1.
* Quiz URLs use a slug query parameter, for example:
  `?quiz=programming-basics`
* If Cloudflare detects Bun or Node, it may run `bun install` by default. The project works with npm and Wrangler 3/4.

## Troubleshooting

* If import fails because `wrangler.toml` has an empty `account_id`, remove that line.
* If D1 deployment fails, ensure `database_id` is set in `wrangler.toml`.
* If local build fails because of accessibility warnings, update the component markup or disable A11y warnings in Vite if needed.
