import { normalizeFestival, type NormalizedFestival } from './normalize';
import { upsertFestivals } from './db';
import type { IngestionSource } from './types';

export interface SourceStat {
  scraped: number;
  normalized: number;
  failed: number;
}

export interface IngestionReport {
  bySource: Record<string, SourceStat>;
  upserted: number;
  modified: number;
}

/**
 * Run all sources, normalize their records, and upsert the results. Failures are
 * isolated: a source that throws while fetching, or a single record that fails
 * to normalize, is logged and skipped without aborting the rest (per the plan's
 * "fail per-source without breaking ingestion").
 *
 * `now` is injected for deterministic timestamps/tests.
 */
export async function runIngestion(
  sources: IngestionSource[],
  now: Date = new Date()
): Promise<IngestionReport> {
  const report: IngestionReport = { bySource: {}, upserted: 0, modified: 0 };
  const normalized: NormalizedFestival[] = [];

  for (const source of sources) {
    const stat: SourceStat = { scraped: 0, normalized: 0, failed: 0 };
    try {
      const raws = await source.fetch();
      stat.scraped = raws.length;
      for (const raw of raws) {
        try {
          normalized.push(normalizeFestival(raw, now));
          stat.normalized++;
        } catch (err) {
          stat.failed++;
          console.error(`[${source.key}] skipped a record:`, (err as Error).message);
        }
      }
    } catch (err) {
      console.error(`[${source.key}] fetch failed:`, (err as Error).message);
    }
    report.bySource[source.key] = stat;
  }

  if (normalized.length > 0) {
    const result = await upsertFestivals(normalized);
    report.upserted = result.upserted;
    report.modified = result.modified;
  }

  return report;
}
