import type { IngestionSource, PageFetcher, ScrapedFestival } from '../types';
import { extractJsonLd, pickLang } from './jsonLd';
import { detectStyles } from '../styleVerification';

/**
 * lasalsadelbaile.com ingestion source (request 0001 task 7.3 follow-on).
 *
 * Unlike goandance, this is a dance-specific listing (not a leaky per-style
 * filter), and it embeds full schema.org Event JSON-LD — including
 * GeoCoordinates — directly on the listing page. So a single listing fetch
 * yields everything; no per-event detail fetch or Q11 style-gating is needed
 * (events are trusted → the normalizer defaults them to `approved`). Styles are
 * inferred from each event's name/description via {@link detectStyles}.
 */

const LISTING_URL = 'https://lasalsadelbaile.com/congresos';
const PROVIDER = 'lasalsadelbaile';

function toNumber(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface LsdbEvent {
  name: string;
  url: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  venue?: string;
}

/** Parse the Event JSON-LD blocks embedded in a lasalsadelbaile listing page. */
export function parseEvents(html: string): LsdbEvent[] {
  return extractJsonLd(html)
    .filter((object) => object['@type'] === 'Event')
    .map((event) => {
      const name = pickLang(event.name);
      const description = pickLang(event.description);
      const place = (event.location ?? {}) as Record<string, unknown>;
      const geo = (place.geo ?? {}) as Record<string, unknown>;
      return {
        name: name.text ?? '',
        url: typeof event.url === 'string' ? event.url : '',
        description: description.text,
        startDate: typeof event.startDate === 'string' ? event.startDate : undefined,
        endDate: typeof event.endDate === 'string' ? event.endDate : undefined,
        latitude: toNumber(geo.latitude),
        longitude: toNumber(geo.longitude),
        venue: typeof place.name === 'string' ? place.name : undefined,
      };
    });
}

export function createLasalsadelbaileSource(opts: {
  fetchPage: PageFetcher;
  listingUrl?: string;
}): IngestionSource {
  const listingUrl = opts.listingUrl ?? LISTING_URL;

  return {
    key: PROVIDER,
    async fetch(): Promise<ScrapedFestival[]> {
      const events = parseEvents(await opts.fetchPage(listingUrl));
      const results: ScrapedFestival[] = [];

      for (const event of events) {
        if (!event.name || !event.url) continue;
        if (event.latitude === undefined || event.longitude === undefined) {
          console.warn(`[lasalsadelbaile] no coordinates for ${event.url} — skipping`);
          continue;
        }
        if (!event.startDate || !event.endDate) {
          console.warn(`[lasalsadelbaile] missing dates for ${event.url} — skipping`);
          continue;
        }

        const styles = detectStyles(`${event.name} ${event.description ?? ''}`).map(titleCase);

        results.push({
          provider: PROVIDER,
          sourceUrl: event.url,
          name: event.name,
          description: event.description,
          language: 'es', // the site is Spanish
          // Only the venue name is exposed (no structured city/country); coordinates
          // drive proximity. Reverse-geocoding for labels is a possible follow-on.
          city: '',
          country: '',
          latitude: event.latitude,
          longitude: event.longitude,
          startDate: event.startDate,
          endDate: event.endDate,
          styles,
          lineup: [],
          bookingUrls: [event.url],
          // Trusted dance-specific source → normalizer defaults to `approved`.
        });
      }

      return results;
    },
  };
}
