---
number: "0001"
slug: initial
title: Ondanse initial plan
stage: plan
status: tasks-generated
created: 2026-06-21
---

# Ondanse Plan

## Overview

This plan turns the refined request into a concrete MVP for Ondanse: a global,
mobile-first PWA where anyone can discover dance festivals by proximity (list +
clustered map), filter them, and follow source/booking links — with an optional
Facebook login that unlocks friend-event enrichment and account-based saved
favorites. It builds directly on the existing pnpm monorepo scaffold
([packages/backend](../../../packages/backend) Express API,
[packages/frontend](../../../packages/frontend) React+Vite PWA) and the
Terraform infra ([infra/main.tf](../../../infra/main.tf): Linux Web App, Static
Web App, Cosmos DB Mongo API, Key Vault, App Insights). It stays grounded in
[project-definition.md](../../../specs/project-definition.md) and
[tech-stack.md](../../../specs/tech-stack.md); the one notable architecture
deviation (Express on App Service vs. serverless Functions) is already realized
in infra and is justified below.

## Scope

- **In:**
  - Public, login-free discovery: proximity-ordered **list view** and a
    **map view with marker clustering** (Q10), selectable browse radius/area.
  - Festival cards (list + map popovers) showing name, date range (date-only),
    city/country, distance, hotel/all-in-one format flag, dance-style tags,
    short lineup highlight, and source/Facebook/booking links (Q1).
  - Filters: dance style, date range (upcoming-only default), DJ/artist search,
    accommodation format.
  - Geolocation permission flow with a graceful no-location fallback.
  - i18n: preferred → English → festival-local language, with a switcher (Q5).
  - Festival REST API over Cosmos DB (Mongo API) with geospatial proximity
    sort, filtering, and detail payloads; UTC-stored, date-only-preserving dates.
  - Two-layer anonymous caching: per-device client cache + CDN/edge (Q4).
  - **Facebook OAuth** login (Q2) enabling: friend-event enrichment in the feed,
    and **account-based saved favorites** (favorite DJs/artists + saved
    searches) for logged-in users (Q3).
  - Ingestion worker pipeline: Playwright scrapers for goandance.com,
    billetweb.fr, lasalsadelbaile.com, plus Facebook Events via Graph API where
    permitted; normalization into the festival model (Q9).
  - **Per-festival style verification** of scraped events (detail-page keyword
    check) with a `moderationStatus` gate — approved festivals are public,
    doubtful ones wait for manual review (Q11).
  - Azure **€50/month budget alert** at 50/80/100% (Q7), Key Vault for secrets.
- **Out:**
  - Admin/curation UI — managed via scripts + direct Cosmos access (Q6).
  - API rate limiting — deferred to a later iteration (Q8).
  - Google/Apple login; ticket-purchase/checkout flows; push notifications;
    offline mode; multi-region Cosmos writes; Azure Cognitive Search.

## Architecture & approach

### Frontend (`packages/frontend` — React 19 + Vite 8, TypeScript PWA)

- **Views:** a list-first home (proximity-sorted) and a map view. Map uses
  **Leaflet** + a marker-clustering plugin (per tech-stack, Leaflet/Mapbox;
  Leaflet chosen for zero-cost, no-token usage). Clusters render as numbered
  bubbles that split on zoom.
- **Filtering & state:** filter controls (style, date range, DJ/artist search,
  format) drive query params to the API; lightweight client state (React state
  / a small store) — no heavy state lib for MVP.
- **Geolocation:** request permission on first discovery; on deny/unavailable,
  fall back to an IP/region default or a manual location picker.
- **i18n:** i18next (per tech-stack) with English as default bundle; festival
  content resolves preferred → English → local at render time via a helper.
- **PWA:** service worker + web manifest + install prompt; the service worker
  plus IndexedDB/localStorage provide the per-device cache layer (Q4).
- **Auth:** Facebook OAuth via Graph SDK; on login, call backend to mint a
  session and enable favorites/friend-events. Public browsing never requires it.
- **Config:** API base via `VITE_API_BASE_URL` (already wired in
  [App.tsx](../../../packages/frontend/src/App.tsx)); dev proxy forwards `/api`.

### Backend (`packages/backend` — Express on Node 20, TypeScript)

- **API style:** REST (per tech-stack), extending the existing
  `/api/health` + `/api/festivals` stubs in
  [index.ts](../../../packages/backend/src/index.ts):
  - `GET /api/festivals` — list with `lat/lng/radius`, `style`, `from/to`,
    `artist`, `format`, `upcomingOnly` (default true); proximity-sorted.
    **Returns only `moderationStatus: approved` festivals** (Q11).
  - `GET /api/festivals/:id` — detail payload (multilingual descriptions, full
    lineup, all links). Also approved-only for the public.
  - `GET /api/artists?q=` — DJ/artist typeahead for the filter.
  - Auth: `POST /api/auth/facebook` (exchange token → session), `GET /api/me`.
  - Favorites (auth required): `GET/PUT /api/me/favorites`,
    `GET/POST/DELETE /api/me/saved-searches`.
  - Friend events (auth required): `GET /api/me/friend-events`.
- **Data access:** MongoDB driver against Cosmos Mongo API; geospatial proximity
  via `2dsphere` index + `$near`/`$geoNear`.
- **Caching headers:** set `Cache-Control` on public GETs so the CDN/edge layer
  (Q4) can cache; client cache complements it.
- **CORS:** existing open GET CORS stays for public endpoints; tighten to
  credentialed origin for auth/favorites routes.
- **Secrets:** Facebook app secret, Cosmos connection string, etc. read from
  Key Vault ([infra/main.tf](../../../infra/main.tf) already provisions it).

### Ingestion / workers

- Scheduled worker(s) run Playwright against goandance.com, billetweb.fr,
  lasalsadelbaile.com search pages; a Graph API client pulls Facebook Events
  where permitted (API-first). A normalizer maps provider fields → the festival
  model and upserts into Cosmos with source attribution. Initial delivery is a
  runnable worker + one real scraper as the pattern; remaining providers follow.
- **Style verification (Q11):** provider style filters are leaky, so after a
  scraper collects festival links from a style-filtered listing it fetches each
  festival's detail page and checks its description + title + style tags against
  a per-style keyword/synonym map. A confident match sets
  `moderationStatus: approved`; no match / doubt sets `pending-review` (stored
  but hidden). Generic sources without a verification step default to `approved`.
  The verification result records which keywords matched, to aid manual review.
- Hosting: timer-triggered Azure Functions or a scheduled job (consumption-based)
  separate from the always-on API Web App, to keep scraping cost off the B1 plan.

### Infrastructure (`infra/`, Terraform)

- Reuse existing resources. **Add** an `azurerm_consumption_budget_subscription`
  (or resource-group budget) at €50/month with 50/80/100% alert thresholds (Q7).
- Add a `2dsphere` index definition for the festivals collection and the new
  `users`/`favorites` collections.
- Wire Key Vault references into the Web App app settings for secrets.

### Deviations from existing specs (flagged)

1. **Express on Azure Linux Web App (B1), not serverless Functions.** The
   tech-stack's cost section *prefers* serverless, but it also explicitly
   selects "Azure Linux Web App with Node runtime for the backend" (line 17),
   and infra already implements this. B1 is always-on (a standing cost), which
   tensions the personal-PAYG cost goal — mitigated by keeping the API small,
   pushing reads to cache/CDN, and isolating bursty scraping onto consumption
   compute. Kept as-is to match the realized architecture; revisit if the budget
   alert (Q7) fires.
2. **Account-based favorites (Q3)** add a persistence + auth surface beyond the
   original "login stub" in the prior plan — an intentional refinement outcome,
   not a silent change.

## Data model changes

- **`festivals`** (exists; extend): `name`, `descriptions` (map of lang→text),
  `primaryLanguage`, `location { city, country, geo: GeoJSON Point }`,
  `startDateUtc`/`endDateUtc` (UTC, date-only semantics preserved),
  `style[]`, `lineup[]` (DJs/instructors/artists), `accommodationFormat`
  (`all-in-one` | `multi-venue`), `sourceUrl`, `facebookEventUrl`,
  `bookingUrls[]`, `sources[]` (provider attribution), `updatedAtUtc`,
  and **`moderationStatus`** (`approved` | `pending-review` | `rejected`) with an
  optional **`moderationReason`** / matched-keywords note for reviewers (Q11).
  Index: `2dsphere` on `location.geo`; secondary on `startDateUtc`, `style`.
  The public API filters to `moderationStatus: approved`; documents missing the
  field are treated as approved for backward compatibility.
- **`artists`** (new): normalized DJ/artist names for typeahead + filtering;
  referenced from festival `lineup`.
- **`users`** (new): minimal identity from Facebook (provider id, display name,
  locale, session token/claims). **No passwords**; store only minimum claims
  (per project-definition non-functional reqs).
- **`favorites` / `savedSearches`** (new): keyed by user id; favorite artist ids
  and serialized search filter sets.
- Date handling: all timestamps stored UTC; date-only festival ranges retained
  as date-only values per project-definition; client formats per locale.

## Risks & mitigations

- **Scraping fragility / ToS** → prefer APIs (Facebook), isolate scrapers,
  normalize defensively, fail per-source without breaking ingestion; respect ToS.
- **Leaky provider style filters polluting results** (Q11) → re-verify each
  scraped festival against the requested style's keyword set on its detail page;
  only confident matches are auto-`approved` and shown, doubtful ones go to a
  `pending-review` queue for manual approval, so a wrong festival never surfaces.
- **Always-on B1 cost** → budget alert at €50 (Q7), aggressive caching, keep
  scraping on consumption compute, downsize/scale-to-zero path noted for later.
- **Facebook Graph permission/review friction** (friends' events need app
  review) → ship public discovery + favorites first; treat friend-events as a
  best-effort enrichment that degrades gracefully if permissions are unavailable.
- **Geolocation denied** → manual/region fallback so discovery still works.
- **Cosmos Mongo geospatial limits** → validate `$near`/`2dsphere` support early;
  fall back to bounding-box query if needed.
- **Cluster/marker performance at scale** → clustering plugin + server-side
  bbox/limit so the map payload stays bounded.

## Alternatives considered

- **Azure Functions for the API** instead of App Service → better idle cost, but
  diverges from the realized infra and tech-stack's stated Web App choice; not
  adopted now, flagged as a fallback if the budget alert fires.
- **Mapbox GL JS** instead of Leaflet → richer vector maps but requires a token
  and has usage-based cost; Leaflet keeps the MVP zero-cost.
- **Local-only favorites (no account)** → cheaper/simpler, but the user chose
  account-based for cross-device durability (Q3).
- **Azure Cognitive Search** for artist/text search → stronger search, added
  cost; deferred — Cosmos queries + an `artists` collection suffice for MVP.
- **Building a curation admin UI now** → rejected for MVP (Q6); scripts + direct
  Cosmos access keep scope and cost down.
