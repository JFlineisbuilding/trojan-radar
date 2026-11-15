# Trojan Radar

**Right events. Right people.**

A USC event discovery prototype with editable preferences, career and campus-life recommendations, eligibility checks, an Ask USC assistant, a campus map, and organizer submissions held for review.

## Run locally

Use Node.js 22.13 or later. No npm dependencies are required for local operation.

```sh
npm run build
npm start
```

Open http://localhost:4317. Local submissions are stored in `.data/radar.sqlite`, which is ignored by Git.

```sh
npm test
```

## What works

- Public USC Calendar and EngageSC feed retrieval, cached results and a dated fallback snapshot.
- My Preferences with selectable interests and free-text goals for career and social discovery.
- Rules-based recommendations and Ask USC search grounded in the event pool.
- Date ranges, eligibility filtering, event-series grouping and calendar conflict checks.
- Calendar file import and an interactive Leaflet map. Google Maps and Google Calendar need separate configuration.
- Poster and pasted-email submissions saved for review, plus pending organization verification requests.

## Public release and privacy

This repository omits private Gmail and Handshake account imports, raw account audit exports, the original personalized profile/photo, environment secrets, and local databases. Public event facts and source links remain. The original local prototype is separate and is not modified by this release.

The dated fallback covers event records collected during the November 2026 hackathon. Live sources may change or become unavailable. Event eligibility, registration, capacity and final admission remain with organizers. Public-source badges indicate provenance, not uploader verification.

## Integrations and limits

- Current matching uses rules. An optional server-side AI gateway is implemented but no external model is configured by default.
- USC app sign-in is not connected. Opening the university portal does not create an app session.
- Google Calendar OAuth requires your own registered client, redirect URI and server encryption key.
- The proposed CC inbox is not active. Email delivery requires an authorized service, webhook secret and sender verification.
- Organization verification requests remain pending. This release does not implement a staffed approval operation or automatic public publishing.
- No public website deployment is implied by this GitHub repository.

Copy `.env.example` to `.env` only when configuring optional local integrations. Keep all real secrets on the server. The AI gateway contract accepts `{task,instructions,input}`. Search returns `{ids,answer}` restricted to provided event IDs. Extraction returns `{events}` and requires review.

## Netlify deployment

Import this repository into Netlify. The included `netlify.toml` sets the build command, static publish directory and API functions directory. It uses Node.js 22. The build produces the interface in `dist/public` and a serverless function for `/api/*` in `dist/functions`. Activity retrieval, matching and Ask USC run on the server. Private account imports and external AI credentials are not bundled.

The Netlify adapter does not provide a database binding. Organizer submissions and organization claims return an explicit storage-unavailable response until durable storage is configured. Google Calendar OAuth and inbound email remain separate integrations. Publishing this prototype does not activate those integrations automatically.

## Cloudflare deployment

`node scripts/cloudflare-build.mjs` produces `dist/server/cloudflare.js` and separates static assets into `dist/public`. `wrangler.jsonc` configures both. Use the official Wrangler tooling or connect the repository to Cloudflare Workers Builds. A deployment account is required. For durable submissions, create a D1 database and bind it as `DB` in the deployment configuration. Without this binding, write endpoints return a storage-unavailable error rather than pretending to save data. Configure optional credentials as server secrets. This source release has not been deployed to a public URL.

Before opening a deployment to public submissions, establish app authentication, ownership checks, abuse controls, storage limits and a moderation process. The local prototype is intended for review and supervised testing.

## Project structure

- `public/` interface, shared matching and eligibility code, map adapters and browser document parsing.
- `worker/` backend, reviewed public imports and optional integration handlers.
- `scripts/` build and local SQLite server.
- `data/` minimized public fallback records and parser fixtures.
- `tests/` checks for eligibility, dates, recommendations, intake, calendar authorization and trust boundaries.

## Attribution

USC is a visual and campus context reference. This is an independent student project, not an official USC service. Campus imagery and event artwork remain attributable to their linked sources and are not offered under a new license. Leaflet and PDF.js license notices are included in `public/vendor/`. No license is granted for third-party assets by this repository.
