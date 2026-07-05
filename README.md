# Sage Quiz

Sage Quiz is a dark, responsive quiz application built with Svelte and Cloudflare Workers. It is designed for the SageCode community and is ready to be hosted on a subdomain such as quiz.sagecode.org.

## What this app does

* Presents a polished landing experience with Login, Register, Quizzes, and Results navigation.
* Supports a responsive hamburger menu for mobile screens.
* Lets users create an account with email, password, Discord username, and profile URL.
* Allows users to sign in with email and password and save quiz results.
* Shows a public results leaderboard ordered by most recent submission.
* Lists available quizzes with quiz code, short title, and the number of takers.
* Serves quiz content from JSON files and stores results in Cloudflare D1.

## Project layout

* `index.html` - Vite entry page and site metadata.
* `src/` - Svelte application source code.
* `public/quizzes/` - quiz content JSON files and branding assets.
* `worker/index.js` - Cloudflare Worker API and routing.
* `scripts/schema.sql` - D1 database schema.
* `wrangler.toml` - Cloudflare Worker configuration.
* `doc/architecture.html` - implementation overview and deployment plan.
* `doc/database.html` - data model and D1 guidance.
* `doc/runway.html` - product roadmap and subdomain rollout notes.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start the frontend:

```bash
npm run dev
```

3. Open the local Vite URL shown in the terminal.

## Deployment notes

The app is prepared for Cloudflare Workers and can be served from a subdomain such as quiz.sagecode.org. The DNS record should point that subdomain to the Cloudflare Worker and the Worker should be deployed from this project.

## Documentation

See the HTML docs in the doc folder for architecture, database, and runway planning details.
