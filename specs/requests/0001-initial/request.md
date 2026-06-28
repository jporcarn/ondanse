---
number: "0001"
slug: initial
title: Ondanse initial discovery request
stage: request
status: planned
created: 2026-06-21
---

# Ondanse Request

## Summary

Ondanse is a global Progressive Web App (PWA) for discovering and planning dance festivals around the world. It must support fast public discovery, geolocation-based listing and map exploration, DJ/artist filtering, multilingual content, and booking provider links. The backend must be TypeScript-based, Azure-native, and cost-optimized for a personal Pay-As-You-Go subscription.

## Key goals

- Public festival discovery experience that works without login.
- List view sorted by proximity and an interactive map view with selectable browse area.
- Festival cards include source links, Facebook event URL, and booking provider links.
- Support filtering by dance style, date range, DJs/artists, and festival format (hotel/all-in-one).
- Use English as default language, with French and local festival languages available when present.
- Store all date/time values in UTC and preserve date-only ranges for festivals.
- Use Azure cloud-native services with budget alerts and cost-control measures.
- Support Facebook login for optional friend-event discovery and social enrichment.
- Scrape booking provider search pages if APIs are unavailable, with Playwright-based backend workers.
- Avoid storing user passwords or sensitive credential data in Azure.

## Constraints & assumptions

- Public discovery (list + map) works fully anonymously; no login required for browsing.
- Authentication is Facebook OAuth only for the MVP; it powers both optional login and friend-event social enrichment. No Google/Apple at this stage.
- MVP includes account-based persistence for saved favorite DJs/artists and saved festival searches — this requires user accounts and backend storage for logged-in users (the public experience remains login-free).
- Festival cards (list and map) display: name, date range (date-only), city/country, distance from the user, hotel/all-in-one format flag, dance-style tags, a short DJ/artist lineup highlight, and event source / Facebook event / booking provider links.
- Multilingual display resolves as preferred UI language → English → festival's local language, with a user-facing language switcher.
- The map uses marker clustering (nearby pins grouped into a numbered bubble that splits on zoom) from the MVP.
- Anonymous discovery is cached at two layers: per-device client cache (localStorage/IndexedDB) plus Azure CDN/edge caching, to minimize backend calls.
- No dedicated admin/curation UI in the MVP; ingestion and provider mapping are managed via scripts and direct Cosmos DB access.
- Priority booking sources: goandance.com, billetweb.fr, and lasalsadelbaile.com via Playwright scraping; Facebook Events via Graph API where permitted (API-first when available).
- Azure budget alert set at €50/month with notifications at 50% / 80% / 100% thresholds.
- No explicit API rate limiting in the MVP — deferred to a later iteration; first-time caching + edge caching are the only call-reduction measures for now.
- Provider style filters are unreliable: goandance.com's `?styles=kizomba` listing also returns unrelated events (bachata/salsa/latin festivals). Scraped festivals must be style-verified before they are shown, so a wrong festival never reaches an Ondanse user.

## Open questions

_None — all refinement questions resolved (see Decisions)._

## Decisions

- Q1 (card attributes) → Cards show **name, dates, location, distance, format flag, dance styles + lineup highlight, and source/Facebook/booking links** (rationale: covers every discovery, filter, and linking goal in the project definition with one core card layout).
- Q2 (OAuth providers) → **Facebook only** for the MVP (rationale: Facebook is the sole provider that unlocks the friends'-events social enrichment feature; Google/Apple add login surface without social value and can be added later).
- Q3 (saved favorites) → **Account-based** saved favorite DJs/artists and saved searches (rationale: user chose durable, cross-device persistence; introduces logged-in user accounts + backend storage while keeping public browsing anonymous).
- Q4 (anonymous caching) → **Per-device client cache (localStorage/IndexedDB) + Azure CDN/edge** (rationale: maximizes backend-call reduction and survives reloads, directly serving the personal-budget cost goal).
- Q5 (multi-language display) → **Preferred → English → local-language fallback** with a language switcher (rationale: matches the specs' English-default rule while personalizing for the user's chosen language).
- Q6 (admin/curation interface) → **Defer; manage via scripts and direct Cosmos DB** (rationale: lowest cost and fastest MVP; a curation UI is a post-MVP concern).
- Q7 (budget threshold) → **€50/month** with alerts at 50/80/100% (rationale: headroom for serverless + low-tier Cosmos while still catching runaway spend on a personal PAYG subscription).
- Q8 (rate limiting) → **Skip for the MVP**, revisit in a later iteration (rationale: user judged it a premature optimization; caching + edge caching suffice initially).
- Q9 (booking providers) → **Scrape goandance.com, billetweb.fr, lasalsadelbaile.com; use Facebook Events Graph API where available** (rationale: these are the named on-target sources without public APIs; prefer API over scraping when one exists).
- Q10 (map clustering) → **Clustering from the MVP** (rationale: keeps a global map readable as the catalog grows, despite slightly more upfront work).
- Q11 (scraped-style verification) → **Verify each scraped festival against the requested style's keyword set on its detail page, and gate visibility with a `moderationStatus` field** (rationale: provider listing filters are leaky, so trust must be re-established per festival). Specifics:
  - After collecting festival links from a style-filtered listing, fetch each festival's **detail page** and check its **description + title + style tags** for the requested style's keywords and related sub-styles (e.g. kizomba → urbankiz/urban kiz, tarraxo/tarraxinha, konpa/kompa, ghetto zouk).
  - **Confident match → `approved`** (shown to users immediately). **No match / doubt → `pending-review`** (stored but hidden, awaiting manual approval). A reviewer can also set `rejected`.
  - The public API returns **only `approved`** festivals. Manual review of the `pending-review` queue is done via scripts / direct Cosmos access, consistent with **Q6** (no admin UI).
  - The per-style keyword/synonym map is maintained in the worker code and is extensible as new styles are scraped.
