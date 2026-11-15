# Trojan Radar

**Right events. Right people.**

A USC event discovery prototype with editable preferences, career and campus-life recommendations, eligibility checks, an Ask USC assistant, a campus map, and organizer submissions held for review.

## Run locally

Use Node.js 22.13 or later. No npm dependencies are required for local operation. Netlify deployment installs the pinned `@netlify/blobs` dependency for submission storage.

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
- Interest-matched recommendations and Ask USC search grounded in the event pool. Netlify AI Gateway adds model-based ranking when runtime credentials are available.
- Date ranges, eligibility filtering, event-series grouping and calendar conflict checks.
- Calendar file import and an interactive Leaflet map. Google Maps and Google Calendar need separate configuration.
- Poster and pasted-email submissions saved for review, plus pending organization verification requests.

## Public release and privacy

The public demo starts with an explicitly labeled Jacqueline sample profile and avatar, restored with the owner’s permission. Visitors can change preferences, which are stored in their browser.

This repository omits private Gmail and Handshake account imports, raw account audit exports, private profile documents, environment secrets, and local databases. Public event facts and source links remain. The original local prototype is separate and is not modified by this release.

The dated fallback covers event records collected during the November 2026 hackathon. Live sources may change or become unavailable. Event eligibility, registration, capacity and final admission remain with organizers. Public-source badges indicate provenance, not uploader verification.

## Integrations and limits

- Netlify Functions use the OpenAI SDK with Netlify AI Gateway runtime credentials when available. The default model is `gpt-4.1-mini`, configurable with `RADAR_OPENAI_MODEL`. Model calls consume included Netlify credits. AI ranking is cached for ten minutes per profile and event set. The API function limits requests to 30 per minute per IP/domain. The interface labels a rule fallback explicitly when AI is unavailable. Model output is restricted to real eligible event IDs.
- USC app sign-in is not connected. Opening the university portal does not create an app session.
- Google Calendar OAuth requires your own registered client, redirect URI and server encryption key.
- The proposed CC inbox is not active. Email delivery requires an authorized service, webhook secret and sender verification.
- Organization verification requests remain pending. This release does not implement a staffed approval operation or automatic public publishing.
- No public website deployment is implied by this GitHub repository.

Copy `.env.example` to `.env` only when configuring optional local integrations. Keep all real secrets on the server. The optional external AI gateway contract accepts `{task,instructions,input}`. Search returns `{ids,answer}` restricted to provided event IDs. Extraction returns `{events}` and requires review.

## Netlify deployment

Import this repository into Netlify. The included `netlify.toml` sets the build command, static publish directory and API functions directory. It uses Node.js 22. The build produces the interface in `dist/public` and a serverless function for `/api/*` in `dist/functions`. Activity retrieval, matching and Ask USC run on the server. Private account imports and AI credentials are not bundled. The model receives interest text, extracted topic labels and public event facts. It does not receive the resume file, full resume text, name or email through the recommendation endpoint.

The Netlify adapter saves poster uploads, pasted event emails and organizer requests as private pending-review objects in Netlify Blobs. There is no public read endpoint or automatic publishing. Production and preview storage use separate names. This intake adapter is not a general SQL database or an authenticated organizer account system. Google Calendar OAuth and inbound email remain separate integrations. Publishing this prototype does not activate those integrations automatically.

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
