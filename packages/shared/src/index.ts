/**
 * Shared domain types for Ondanse, consumed by both the backend API and the
 * frontend PWA. This package is the single source of truth for the data model
 * described in specs/requests/0001-initial/plan.md ("Data model changes").
 *
 * The types here are runtime-free: consumers import them with `import type`, so
 * nothing from this module is emitted into their bundles.
 */

/**
 * BCP-47 language tag, e.g. "en", "fr", "es". Used as keys in localized maps and
 * for a festival's primary language.
 */
export type LanguageCode = string;

/**
 * Date-only value with UTC semantics, formatted "YYYY-MM-DD" (e.g.
 * "2026-06-30"). Festival ranges are intentionally date-only — they carry no
 * time-of-day — per the project rule to preserve date-only festival ranges.
 */
export type DateOnly = string;

/**
 * ISO 8601 timestamp in UTC, e.g. "2026-06-21T12:00:00Z". Used for bookkeeping
 * fields (when a record was last updated / retrieved), never for the festival
 * date range itself.
 */
export type UtcTimestamp = string;

/**
 * GeoJSON Point. NOTE the GeoJSON coordinate order is [longitude, latitude],
 * which is the order Cosmos DB's Mongo API `2dsphere` index expects.
 */
export interface GeoPoint {
  type: 'Point';
  /** [longitude, latitude] */
  coordinates: [number, number];
}

/** Where a festival is held. */
export interface FestivalLocation {
  city: string;
  country: string;
  geo: GeoPoint;
}

/**
 * How attendees are accommodated: a single all-in-one venue/hotel package, or a
 * festival spread across multiple separate venues.
 */
export type AccommodationFormat = 'all-in-one' | 'multi-venue';

/**
 * Provenance for a festival record (or an enrichment of it). A festival may be
 * assembled from more than one source, so this is a list on the festival.
 */
export interface FestivalSource {
  /** Short provider key, e.g. "goandance", "billetweb", "lasalsadelbaile", "facebook". */
  provider: string;
  /** The exact URL the data was read from. */
  url: string;
  /** When this source was last retrieved. */
  retrievedAtUtc: UtcTimestamp;
}

/**
 * A discoverable dance festival — the core entity of Ondanse. Mirrors the
 * `festivals` collection in Cosmos (Mongo API).
 */
export interface Festival {
  /** Stable identifier (Cosmos document id). */
  id: string;
  name: string;
  /**
   * Localized descriptions keyed by language code. Resolution at render time is
   * preferred-language → English → festival's `primaryLanguage`.
   */
  descriptions: Partial<Record<LanguageCode, string>>;
  /** The festival's own language, used as the final description fallback. */
  primaryLanguage: LanguageCode;
  location: FestivalLocation;
  /** Date-only start of the festival (UTC semantics). */
  startDateUtc: DateOnly;
  /** Date-only end of the festival (UTC semantics), inclusive. */
  endDateUtc: DateOnly;
  /** Dance styles, e.g. ["Kizomba", "Bachata"]. */
  style: string[];
  /** DJs, instructors, and artists performing — display highlight + filtering. */
  lineup: string[];
  accommodationFormat: AccommodationFormat;
  /** Canonical "more info" link for the festival. */
  sourceUrl: string;
  /** Facebook event URL, when one is known. */
  facebookEventUrl?: string;
  /** Booking/ticket provider links. */
  bookingUrls: string[];
  /** Source attribution; populated by the ingestion pipeline. */
  sources: FestivalSource[];
  /** When this record was last updated by ingestion. */
  updatedAtUtc: UtcTimestamp;
}
