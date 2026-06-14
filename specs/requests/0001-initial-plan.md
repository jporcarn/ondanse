# Ondanse Plan

## Overview

The Ondanse plan defines the architecture, tech stack, MVP scope, and implementation approach for a cost-effective global dance festival discovery PWA.

## Architecture

### Frontend

- React + Vite or Next.js PWA in TypeScript
- Responsive mobile-first UI
- List view and map view
- Internationalization with English default and support for French + local festival languages
- Local caching to reduce repeated backend calls
- OAuth login via Facebook (and optionally Google) for social enrichment

### Backend

- TypeScript backend on Azure Functions or Azure App Service
- REST API endpoints for festival discovery, filters, and social imports
- Data stored in Azure Cosmos DB with geo-capabilities
- Worker pipeline for ingestion, scraping, and data normalization
- Playwright-based scraping workers for booking provider search pages when APIs are unavailable
- Facebook Graph API integration for friend-event enrichment

### Infrastructure

- Azure Static Web Apps for frontend hosting
- Azure Functions or Container Apps for backend and worker jobs
- Azure Cosmos DB for NoSQL storage
- Azure CDN / Static Web Apps edge caching
- Azure Cost Management with budget alerts
- Azure Key Vault for secrets

## MVP Scope

- Public landing page and festival discovery list
- Geolocation permissions and default proximity-based ordering
- Map view with area/radius browsing
- Filtering: dance style, date range, DJs/artists, hotel/all-in-one festivals
- Festival cards with source links, Facebook event URL, and booking provider links
- Initial backend API and Cosmos DB storage
- Minimal social login support for Facebook

## Cost control

- Prefer consumption-based Azure services
- Use local and edge caching in the frontend
- Limit backend calls for anonymous users to first-time per unique user session
- Track and alert on Azure spending thresholds
- Avoid storing user passwords; use OAuth providers

## Data model outline

- Festival metadata
- Location and geospatial fields
- Venue/accommodation format flag
- DJs/artists and lineup details
- External source URLs and booking provider URLs
- Multilingual description fields
- UTC date range fields for festival start/end

## Next implementation steps

1. Define festival event data model in detail.
2. Scaffold frontend PWA structure.
3. Scaffold backend API and Cosmos DB schema.
4. Implement list and map views with filtering.
5. Add basic ingestion stub for provider sources.
6. Add Facebook OAuth login stub.
7. Add Azure deployment config and budget alert guidance.
