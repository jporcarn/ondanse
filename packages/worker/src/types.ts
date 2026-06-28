import type { AccommodationFormat, ModerationStatus } from '@ondanse/shared';

/**
 * The provider-agnostic shape a scraper/source produces for a single festival,
 * before normalization into the canonical {@link Festival} model. Fields are
 * loose (raw strings, separate lat/lng) so each source can fill what it can;
 * the normalizer validates and maps them.
 */
export interface ScrapedFestival {
  /** Provider key, e.g. "goandance", "billetweb", "facebook". */
  provider: string;
  /** Canonical URL this festival was read from — also the upsert dedup key. */
  sourceUrl: string;
  name: string;
  /** Free-text description in `language` (defaults to English if omitted). */
  description?: string;
  /** BCP-47 language of `description`. */
  language?: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  /** Start date — "YYYY-MM-DD" or any Date-parseable string. */
  startDate: string;
  /** End date — "YYYY-MM-DD" or any Date-parseable string. */
  endDate: string;
  styles?: string[];
  lineup?: string[];
  accommodationFormat?: AccommodationFormat;
  facebookEventUrl?: string;
  bookingUrls?: string[];
  /**
   * Visibility gate set by a source that verifies relevance (Q11). Omit to let
   * the normalizer default to `approved` (trusted sources).
   */
  moderationStatus?: ModerationStatus;
  /** Context for reviewers, e.g. which style keywords matched. */
  moderationReason?: string;
}

/**
 * A single ingestion source. Each scraper (Playwright) or API client (Facebook
 * Graph) implements this so the pipeline can run them uniformly and isolate
 * per-source failures.
 */
export interface IngestionSource {
  /** Stable provider key, recorded in source attribution. */
  readonly key: string;
  /** Fetch the current set of festivals from this source. */
  fetch(): Promise<ScrapedFestival[]>;
}
