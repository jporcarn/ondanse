# Ondanse Project Definition

## Vision

Ondanse is a global Progressive Web App (PWA) that helps dance festival fans discover events around the world and build a personal festival agenda.

## Primary goals

- Provide a fast public festival discovery experience.
- Show festivals near a user based on geolocation.
- Support filtering by dance style, date range, and region.
- Store festival data in a globally distributed NoSQL database.
- Use TypeScript across frontend and backend.
- Use Azure cloud-native services for global scale and low latency.

## Required product areas

### Public festival discovery

- Users open a URL and see nearby dance festivals.
- The PWA should prompt for geolocation permissions and use the location to surface events.
- A list view must show festivals ordered by proximity by default.
- A map view must allow users to browse festivals within a selectable geographic range.
- Each festival card must include the event source link, Facebook event URL, and booking provider links when available.
- Festival cards and map markers must clearly show whether the event is hosted in a single hotel/all-in-one accommodation format.
- The public part must be fast and cacheable.
- Support Facebook login and permission consent so users can optionally import festivals attended or followed by their Facebook friends.

### Festival filters

- Dance style filter: Kizomba, Salsa, Bachata, etc.
- DJ/artist filter: allow users to search and filter by DJs, instructors, workshop artists, and performers.
- Date range filter with configurable hiding of past festivals.
- Ability to show upcoming festivals only by default.
- Optional setting to reveal past or future festival planning information.
- Multiple-language support and user-preferred language selection, with English as the default display language when available.
- Support English, French, and the festival's local language when available (e.g. Spanish, Turkish, Romanian).

### Backend responsibilities

- Serve festival search and listing APIs.
- Store festival metadata in a NoSQL store optimized for global reads.
- Provide world-wide performance and availability.
- Handle ingestion from multiple sources: Facebook events, Instagram, promoter websites, and booking platforms.
- Run background workers that scrape sites or integrate with provider APIs.
- Store all date/time fields in UTC to support users in every timezone.
- Extract lineup details from event descriptions, including DJs, instructors, artists, workshops, and program sections.
- Capture the festival's primary language metadata and provide localized user interface support.
- Support authenticated Facebook graph access to read the current user's friends and their festival/event interests, with privacy consent.
- Merge friend event suggestions into the festival discovery feed with clear attribution to the social source.

### Worker / ingestion pipelines

- Dedicated workers to gather festivals from multiple providers.
- Prefer API integrations when available.
- Use web scraping for sources without official APIs, respecting terms of service.
- Scrape booking provider search pages when no API exists, including sites such as billetweb.fr, goandance.com, and lasalsadelbaile.com.
- Normalize event data into a global festival catalog.
- Normalize festival dates as date-only values for current listings, with UTC-aware timestamps for future schedule support.

## MVP feature set

- PWA landing page with festival discovery around the user.
- Geolocation permission request and location-based event list.
- Filters for dance style and date range.
- Global data storage and public API access.
- Initial backend ingestion pipeline stub for provider data.
- Basic map visualization of nearby events.

## Non-functional requirements

- Global availability with low latency.
- Mobile-first responsive design.
- TypeScript for frontend and backend.
- Cloud-native Azure deployment.
- Automated Terraform backend bootstrap so local deployment requires only subscription selection.
- GitHub Actions workflow that can create backend resource group, storage account, and state container before `terraform init`.
- A repository helper or AI command that prompts for subscription and runs pre-initialization for local Azure deployment.
- Scalable ingestion and search architecture.
- Cost-effective architecture optimized for a personal Pay-As-You-Go Azure subscription.
- Azure budget limit and alerting setup to avoid unexpected charges.
- Minimize backend resource usage and calls for anonymous users by caching first-time requests per unique user.
- Use OAuth login only when the user opts in; avoid storing passwords or sensitive credentials on Azure servers.
- Prefer low-cost serverless and CDN services over always-on infrastructure.
