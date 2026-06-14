# Ondanse Technology Stack and Azure Architecture

## Overview

Ondanse is a global PWA with a TypeScript frontend and TypeScript backend. The architecture should use Azure cloud-native services for scalability, availability, and global performance.

## Frontend

- Framework: React + Vite or Next.js (PWA-ready)
- Language: TypeScript
- PWA capabilities: service worker, web manifest, install prompt- List & map views: support list-first discovery by default and a map exploration mode with selectable radius/area filters- Map rendering: Leaflet or Mapbox GL JS
- UI library: Tailwind CSS or Chakra UI for responsive design
- Internationalization: i18next or React Intl for multi-language UI and user preference selection, with English as the default language when festival data is available in multiple languages
- Support English, French, and the festival's local language when available.
- Hosting: Azure Static Web Apps (preferred for the Vite PWA) or Azure Blob Storage + CDN
- Current choice: Vite for a lightweight, fast PWA starter with a separate backend. Vite is ideal for early-stage development, quick iteration, and a static-first delivery model.
- Azure infra: Azure Static Web App for the frontend, Azure Linux Web App with Node runtime for the backend, Azure Cosmos DB with MongoDB API for data, and Azure Storage backend for Terraform state.
- The architecture avoids containers and containerized solutions in favor of Azure native managed services.
- Migration path: if the app later needs full-stack rendering, advanced routing, or richer server-side capabilities, migrate to Next.js. The migration is manageable if the frontend is componentized and API boundaries are clean, but it requires dedicated effort for routing, data fetching, and build configuration.

## Backend

- Runtime: Node.js / Deno with TypeScript
- API layer: Azure Functions or Azure App Service (Node.js)
- API style: REST or GraphQL
- Authentication (optional later): Azure AD B2C or Web Authn

## Database

- Primary storage: Azure Cosmos DB with MongoDB API or Core (SQL) API for NoSQL document storage
- Global distribution: Cosmos DB geo-replication for low-latency reads worldwide

## Search and fast queries

- Cosmos DB supporting geospatial queries for location-based festival discovery
- Optional: Azure Cognitive Search for richer text search and filtering across festival metadata, including DJs/artists and lineup content

## Ingestion / worker pipeline

- Worker compute: Azure Functions with Durable Functions or Azure Container Apps jobs
- Trigger: scheduled timer trigger for periodic scraping / ingestion
- Alternative: Azure Logic Apps or Azure Data Factory for orchestration
- Storage for raw ingestion state: Azure Blob Storage or Azure Table Storage

## Integration and scraping

- Preferred API integration: Facebook Graph API, Instagram API, booking platform APIs
- Scraping: headless browser on Azure Functions or Azure Container Apps if provider APIs are unavailable
- Use Playwright in a backend worker/automation client to scrape booking provider search pages and extract festival listings from HTML content.
- Data normalization: map provider-specific fields into a common festival event model
- Event parsing: extract DJs, instructors, artist lineups, and program sections from description text
- Language metadata: store event language tags and support user-selected UI language, with English as the fallback display language
- Social import: support Facebook OAuth login to read the user’s friends and their public events/attendances, when the user grants permission

## Global performance and delivery

- Frontend CDN: Azure Static Web Apps / Azure CDN for static assets
- API edge: Azure Front Door or Azure API Management for global endpoint and caching
- Database geo-replication: Cosmos DB multi-region writes/reads
- Monitoring: Azure Monitor, App Insights, Log Analytics

## Recommended Azure services

- Azure Static Web Apps: host the PWA and manage deployments
- Azure Functions: backend API and ingestion workers
- Azure Cosmos DB: global NoSQL data store with geospatial queries
- Azure Front Door: global traffic routing and DDoS protection
- Azure API Management: API gateway, rate limiting, versioning (optional later)
- Azure Monitor / Application Insights: telemetry, performance, and errors
- Azure Key Vault: secrets management for provider API keys
- Azure Cost Management and Billing: budget alerts, spending limits, and consumption monitoring

## Cost and privacy strategy

- Prefer Azure Static Web Apps and serverless Azure Functions for low-cost, consumption-based pricing.
- Use Azure CDN for static asset delivery and caching to reduce backend traffic.
- Keep anonymous frontend requests cached locally and/or at the edge; only call backend APIs when needed.
- Limit backend API calls to the first time per unique user session, then serve cached results for subsequent views.
- Use OAuth providers such as Facebook, Google, or other supported identity providers so the app does not manage passwords.
- Avoid storing user credentials or passwords in Azure; store only the minimum tokens or identity claims required for session management.
- Use Azure Budget alerts and threshold notifications to warn before reaching a spend limit.

## Why this stack fits Ondanse

- Single-language development in TypeScript end-to-end
- Cloud-native architecture for global users
- Fast static PWA frontend with globally distributed hosting
- Serverless backend reduces operational overhead
- Cosmos DB is a strong Azure-native choice for global NoSQL storage and geospatial queries

## Future expansion

- Add user accounts and personalized saved agendas
- Add notifications via Web Push / Azure Notification Hubs
- Add offline support and local storage for saved favorites
- Add provider integrations for ticket purchase and promoter feeds
- Add advanced search and recommendations based on dance style and travel radius
