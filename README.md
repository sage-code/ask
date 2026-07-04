# Ask Cloudflare Svelte

This project is a Cloudflare-ready quiz app built with Svelte and Cloudflare Workers.

## Features

* Mentor / student registration
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

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Build the front-end:

```bash
npm run build
```

## Cloudflare deployment

1. Create a Cloudflare account, install Wrangler, and log in.
2. Create a D1 database in Cloudflare.
3. Update `wrangler.toml` with your `account_id` and D1 binding settings.
4. Publish the API worker:

```bash
wrangler publish
```

## Notes

* Quiz questions are loaded from JSON files under `public/quizzes/`.
* The database stores only `users` and `results`.
* Each quiz is identified by a shareable slug, for example: `programming-basics`.
