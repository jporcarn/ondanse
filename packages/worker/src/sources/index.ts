import type { IngestionSource } from '../types';
import { createGoandanceSource } from './goandance';
import { createLasalsadelbaileSource } from './lasalsadelbaile';
import { createPlaywrightFetcher } from '../playwrightFetcher';

/**
 * Build the active ingestion sources plus a cleanup for the shared Playwright
 * browser. Configured via env:
 *   - GOANDANCE_STYLES: comma-separated styles to scrape (default "kizomba").
 *     Set empty to disable goandance.
 *   - LASALSADELBAILE_ENABLED: set "false" to disable lasalsadelbaile.
 *
 * Follow-on sources: billetweb.fr (task 7.3) and the Facebook Events Graph API
 * (task 7.4) register here as they land.
 */
export interface ConfiguredSources {
  sources: IngestionSource[];
  cleanup: () => Promise<void>;
}

export async function buildSources(): Promise<ConfiguredSources> {
  const sources: IngestionSource[] = [];

  const goandanceStyles = (process.env.GOANDANCE_STYLES ?? 'kizomba')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const lasalsadelbaileEnabled = process.env.LASALSADELBAILE_ENABLED !== 'false';

  // All current sources are Playwright scrapers — share one browser.
  const { fetchPage, close } = await createPlaywrightFetcher();

  if (goandanceStyles.length > 0) {
    sources.push(createGoandanceSource({ styles: goandanceStyles, fetchPage }));
  }
  if (lasalsadelbaileEnabled) {
    sources.push(createLasalsadelbaileSource({ fetchPage }));
  }

  return {
    sources,
    cleanup: async () => {
      await close().catch(() => {
        /* ignore teardown errors */
      });
    },
  };
}
