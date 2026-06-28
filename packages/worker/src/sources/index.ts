import type { IngestionSource } from '../types';
import { createGoandanceSource } from './goandance';
import { createPlaywrightFetcher } from '../playwrightFetcher';

/**
 * Build the active ingestion sources plus a cleanup for any resources they hold
 * (e.g. the Playwright browser). Configured via env:
 *   - GOANDANCE_STYLES: comma-separated styles to scrape (default "kizomba").
 *
 * Follow-on sources: billetweb.fr, lasalsadelbaile.com (task 7.3) and the
 * Facebook Events Graph API (task 7.4) register here as they land.
 */
export interface ConfiguredSources {
  sources: IngestionSource[];
  cleanup: () => Promise<void>;
}

export async function buildSources(): Promise<ConfiguredSources> {
  const sources: IngestionSource[] = [];
  const cleanups: Array<() => Promise<void>> = [];

  const goandanceStyles = (process.env.GOANDANCE_STYLES ?? 'kizomba')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (goandanceStyles.length > 0) {
    const { fetchPage, close } = await createPlaywrightFetcher();
    sources.push(createGoandanceSource({ styles: goandanceStyles, fetchPage }));
    cleanups.push(close);
  }

  return {
    sources,
    cleanup: async () => {
      for (const close of cleanups) {
        await close().catch(() => {
          /* ignore teardown errors */
        });
      }
    },
  };
}
