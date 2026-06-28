---
number: "0001"
slug: initial
title: Ondanse initial tasks
stage: tasks
status: in-progress
created: 2026-06-21
---

# Ondanse Tasks

Tasks are grouped to match the plan's structure and sequenced so dependencies
come first (data model → backend API → frontend discovery → auth & favorites →
ingestion → infra/cost). Each maps back to a plan in-scope item.

## 1. Data model & schema foundations

- [x] Define the shared `Festival` TypeScript type (descriptions map,
      primaryLanguage, GeoJSON location, UTC date-only range, style, lineup,
      accommodationFormat, source/facebook/booking URLs, sources[], updatedAtUtc)
  - Acceptance: a single exported type is used by both backend and frontend;
    matches the plan's festival model; replaces the inline interfaces.
  - Touches: `packages/backend/src`, `packages/frontend/src/App.tsx`
  - Done in PR #15 — new `@ondanse/shared` package; both packages import it.
- [x] Add Cosmos Mongo collections + indexes in Terraform: `festivals`
      (`2dsphere` on `location.geo`, secondary on `startDateUtc`, `style`),
      `artists`, `users`, `favorites`, `savedSearches`
  - Acceptance: `terraform validate` passes; new collections/indexes appear in
    the plan output.
  - Touches: `infra/main.tf`
  - Done in PR #16. NOTE: the azurerm provider's collection `index` block only
    supports `keys`/`unique`, so the `2dsphere` index cannot be declared in
    Terraform — it is created at runtime by the data-access layer (task 1.3).
    Terraform manages the collections + the `startDateUtc`/`style`/`_id`/lookup
    indexes; `terraform validate` and `fmt -check` pass.
- [x] Add a MongoDB data-access layer in the backend (connection from Key Vault
      secret / env, with local fallback)
  - Acceptance: backend connects to Cosmos Mongo API and reads the `festivals`
    collection; connection string is not hardcoded.
  - Touches: `packages/backend/src`
  - Done in PR #17 — `db.ts` (env/local-fallback connection, `2dsphere` index
    bootstrap, `toFestival` mapping); `/api/festivals` now reads the collection;
    `seed.ts` dev script (Q6). Verified end-to-end against an ephemeral MongoDB
    (connect, geo index, `$near` query, HTTP GET all pass).

## 2. Backend REST API

- [x] Implement `GET /api/festivals` with query params `lat,lng,radius,style,
      from,to,artist,format,upcomingOnly` (default upcomingOnly=true),
      proximity-sorted via `$near`/`2dsphere`
  - Acceptance: returns DB-backed, proximity-sorted, filtered results;
    upcoming-only by default; documented query params.
  - Touches: `packages/backend/src/index.ts`
  - Done in PR #18 — pure `festivalQuery.ts` builder (CSV styles, date-window
    overlap, case-insensitive artist, format validation, geo `$near` with
    km→m radius, limit clamping, 400 on bad params). Verified with 17 unit +
    16 live HTTP checks.
- [x] Implement `GET /api/festivals/:id` detail payload (multilingual
      descriptions, full lineup, all links)
  - Acceptance: returns a single festival with full detail or 404.
  - Done in PR #18 — ObjectId-or-string lookup; 404 when absent.
- [ ] Implement `GET /api/artists?q=` typeahead for the DJ/artist filter
  - Acceptance: prefix query returns matching normalized artist names.
- [x] Add `Cache-Control` headers on public GET endpoints for CDN/edge caching
  - Acceptance: public GET responses carry cache headers enabling edge caching
    (Q4 layer 2).
  - Touches: `packages/backend/src/index.ts`
  - Done in PR #18 — `public, max-age=300, s-maxage=600` on both festival GETs.
- [ ] Wire Key Vault references into Web App app settings for backend secrets
  - Acceptance: Cosmos connection string + Facebook secret resolve from Key
    Vault at runtime; none committed to the repo.
  - Touches: `infra/main.tf`, `packages/backend/src`

## 3. Frontend discovery (public, login-free)

- [ ] Implement geolocation permission flow with no-location fallback
      (region/manual picker)
  - Acceptance: on grant, location feeds the list/map; on deny/unavailable,
    discovery still works via fallback.
  - Touches: `packages/frontend/src`
- [ ] Implement proximity-ordered list view with festival cards showing name,
      dates, city/country, distance, format flag, style tags, lineup highlight,
      and source/Facebook/booking links (Q1)
  - Acceptance: cards render all Q1 fields from the API; default sort is by
    distance.
  - Touches: `packages/frontend/src/App.tsx`
- [ ] Implement map view with Leaflet + marker clustering (numbered bubbles that
      split on zoom) and selectable browse radius/area (Q10)
  - Acceptance: nearby pins cluster and de-cluster on zoom; map queries the API
    by bounding box/radius; clicking a marker shows a card popover.
  - Touches: `packages/frontend/src`
- [ ] Implement filter controls: dance style, date range, DJ/artist search,
      accommodation format — driving API query params
  - Acceptance: changing any filter updates results in both list and map.
  - Touches: `packages/frontend/src`

## 4. Internationalization

- [ ] Add i18next with English default UI bundle and a language switcher (EN/FR
      + festival-local) (Q5)
  - Acceptance: UI strings localize; switcher changes language; English is the
    default.
  - Touches: `packages/frontend/src`
- [ ] Add festival-content language resolution helper (preferred → English →
      local) (Q5)
  - Acceptance: a festival with multiple descriptions displays per the fallback
    order based on the selected language.
  - Touches: `packages/frontend/src`

## 5. PWA & client caching

- [ ] Add PWA shell: web manifest, service worker, install prompt
  - Acceptance: app is installable; Lighthouse PWA checks pass for manifest +
    service worker.
  - Touches: `packages/frontend`
- [ ] Add per-device client cache (IndexedDB/localStorage) for anonymous
      discovery results (Q4 layer 1)
  - Acceptance: repeat visits serve cached results without an immediate backend
    call; cache invalidates on a sensible TTL.
  - Touches: `packages/frontend/src`

## 6. Auth, favorites & social enrichment (Facebook)

- [ ] Implement Facebook OAuth login on the frontend (login optional; public
      browsing unaffected) (Q2)
  - Acceptance: user can log in/out via Facebook; logged-out experience
    unchanged.
  - Touches: `packages/frontend/src`
- [ ] Implement backend auth: `POST /api/auth/facebook` (token exchange →
      session) and `GET /api/me`; persist minimal claims to `users` (no
      passwords)
  - Acceptance: valid Facebook token yields a session; `/api/me` returns the
    profile; only minimal claims stored.
  - Touches: `packages/backend/src`
- [ ] Implement account-based favorites + saved searches: `GET/PUT
      /api/me/favorites`, `GET/POST/DELETE /api/me/saved-searches` (auth
      required) (Q3)
  - Acceptance: a logged-in user can save/retrieve favorite DJs/artists and
    saved searches; persists across sessions/devices; 401 when unauthenticated.
  - Touches: `packages/backend/src`, `packages/frontend/src`
- [ ] Implement friend-events enrichment: `GET /api/me/friend-events` via Graph
      API, merged into the feed with source attribution; degrade gracefully if
      permission is unavailable
  - Acceptance: when permitted, friends' events appear attributed; when not, the
    feed still works with no error.
  - Touches: `packages/backend/src`, `packages/frontend/src`
- [ ] Tighten CORS to a credentialed origin for auth/favorites routes (keep open
      GET for public endpoints)
  - Acceptance: authenticated routes reject disallowed origins; public GETs stay
    open.
  - Touches: `packages/backend/src/index.ts`

## 7. Ingestion & worker pipeline

- [ ] Scaffold a scheduled ingestion worker on consumption compute (timer-
      triggered Function / scheduled job), separate from the B1 API
  - Acceptance: worker runs on a schedule locally and has deploy config; does
    not run on the always-on Web App plan.
  - Touches: `packages`, `infra`
  - Partly done in PR #19 — `packages/worker` scaffolded with a runnable CLI
    (one-shot, plus cron-scheduled local runs via `INGEST_SCHEDULE`/node-cron).
    Remaining: Azure consumption deploy config (Terraform) — follow-on PR.
- [x] Implement a normalizer mapping provider fields → the `Festival` model with
      source attribution, upserting into Cosmos
  - Acceptance: given sample provider data, produces valid `Festival` documents
    with `sources[]` populated.
  - Touches: `packages` (worker)
  - Done in PR #19 — pure `normalizeFestival` (GeoJSON, date-only coercion,
    validation, `sources[]`) + `bulkWrite` upsert deduped by `sourceUrl`, and a
    `runIngestion` pipeline with per-source failure isolation. Verified with
    26 unit + 13 integration checks against an ephemeral MongoDB.
- [ ] Implement the first Playwright scraper (goandance.com) as the pattern;
      stub/follow-on for billetweb.fr and lasalsadelbaile.com (Q9)
  - Acceptance: goandance scraper extracts listings and feeds the normalizer;
    remaining scrapers tracked as follow-on tasks.
  - Touches: `packages` (worker)
- [ ] Implement Facebook Events Graph API ingestion (API-first source) (Q9)
  - Acceptance: permitted events are pulled via Graph API and normalized.
  - Touches: `packages` (worker)

## 8. Infrastructure & cost control

- [ ] Add `azurerm_consumption_budget` at €50/month with 50/80/100% alert
      thresholds (Q7)
  - Acceptance: `terraform validate`/plan shows a €50 budget with three alert
    thresholds notifying the subscription owner.
  - Touches: `infra/main.tf`, `infra/variables.tf`
- [ ] Document the ingestion-via-scripts / direct-Cosmos curation flow (no admin
      UI) and scraping/compliance notes (Q6)
  - Acceptance: a short doc explains how to run ingestion and edit data directly,
    plus ToS/compliance notes.
  - Touches: `docs/`, `specs/`
