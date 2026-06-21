---
number: "0001"
slug: initial
title: Ondanse initial discovery request
stage: request
status: planned
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

## Questions for refinement

1. What are the most important festival attributes to display in the list and map cards?
2. Which OAuth providers should be supported besides Facebook (e.g. Google, Apple)?
3. Should users be able to save favorite DJs/artists or festival searches?
4. Should the public experience support anonymous caching by device or by browser session?
5. How should the app show a festival that has multiple language descriptions?
6. Do we need a separate admin/curation interface for ingestion or provider mapping?
7. What budget threshold should trigger alerts for the Azure subscription?
8. Should there be a rate limit for unauthenticated users beyond first-time backend call caching?
9. Which booking providers are priority for scraping versus API integration?
10. Is the initial MVP expected to support map clustering or only individual festival markers?
