import type { IngestionSource } from '../types';

/**
 * The active ingestion sources. Real scrapers/clients are registered here as
 * they land:
 *   - goandance.com Playwright scraper (request 0001 task 7.3)
 *   - billetweb.fr, lasalsadelbaile.com (follow-on, task 7.3)
 *   - Facebook Events Graph API (task 7.4)
 *
 * Until then the registry is empty and a real run reports "0 sources". The
 * pipeline itself is exercised in tests with fixture sources.
 */
export const sources: IngestionSource[] = [];
