# Ondanse Tasks

## 1. Project scaffolding

- [ ] Create `src/frontend` with React + Vite or Next.js PWA starter
- [ ] Create `src/backend` with TypeScript API starter
- [ ] Add `specs/` documents and update `README.md`
- [ ] Add `.github/workflows` for CI and deployment

## 2. Data model and API design

- [ ] Define festival event model with location, dates, lineup, language fields, and URLs
- [ ] Design backend API endpoints for festival discovery and filters
- [ ] Add search schema for DJs/artists and accommodation type
- [ ] Define Cosmos DB collections and partition strategy

## 3. Frontend discovery UI

- [ ] Implement public list view ordered by distance
- [ ] Implement map view with selectable radius/area browsing
- [ ] Add filtering UI for dance style, date range, DJs/artists, and hotel format
- [ ] Add festival cards with event source, Facebook event link, and provider links
- [ ] Add language selection and UI localization support

## 4. Backend implementation

- [ ] Implement festival listing API with location-based sorting and filters
- [ ] Add event detail payload with multilingual descriptions and lineup
- [ ] Add support for external source links and booking providers
- [ ] Integrate Azure Cosmos DB for event storage
- [ ] Add backend caching or rate limiting for first-time anonymous user calls

## 5. Ingestion and scraping

- [ ] Create ingestion worker pipeline stub
- [ ] Add provider scraping design for booking sites using Playwright
- [ ] Add Facebook/Instagram event source integration plan
- [ ] Normalize scraped data into the festival model

## 6. Authentication and social enrichment

- [ ] Add Facebook OAuth login flow to frontend
- [ ] Add backend support for social login tokens and friend event import
- [ ] Add UI option for users to import friends’ festival events
- [ ] Add privacy notes to avoid password storage and minimize sensitive data

## 7. Azure deployment and cost control

- [ ] Add Azure Static Web Apps deployment config
- [ ] Add Azure Functions or Container Apps deployment config
- [ ] Configure Azure Cosmos DB deployment and geo-replication plan
- [ ] Add Azure Cost Management and budget alert guidance
- [ ] Add documentation for cost-control strategy

## 8. Testing and validation

- [ ] Add frontend unit tests for list and map views
- [ ] Add backend API tests for festival queries and filtering
- [ ] Add integration tests for OAuth login flow and social import
- [ ] Add validation for multilingual content fallback behavior

## 9. Documentation and handoff

- [ ] Document feature behavior in `specs/` and `README.md`
- [ ] Document Azure budget alert setup
- [ ] Document scraping and compliance notes
- [ ] Document next steps for MVP refinement and build-plan execution
