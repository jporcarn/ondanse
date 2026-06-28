import type { IngestionSource, ScrapedFestival } from '../types';
import { verifyStyle } from '../styleVerification';

/**
 * goandance.com ingestion source (request 0001 tasks 7.3 + Q11).
 *
 * goandance's pages are server-rendered and expose schema.org JSON-LD plus a
 * Google-Maps link with coordinates, so extraction is done by parsing that
 * structured data (robust) rather than brittle DOM selectors. The page fetcher
 * is injectable: production uses Playwright (handles any JS / pagination);
 * tests inject a fixture-backed fetcher.
 *
 * Because the provider's `?styles=` filter is leaky, every event's detail page
 * is re-checked with {@link verifyStyle}: confident matches are `approved`,
 * doubtful ones become `pending-review` (Q11).
 */

const BASE_URL = 'https://www.goandance.com';
const PROVIDER = 'goandance';
const DEFAULT_MAX_PAGES = 10;

export type PageFetcher = (url: string) => Promise<string>;

/** Absolute listing URL for a style filter and page number. */
export function listingUrl(style: string, page = 1): string {
  const params = new URLSearchParams({ styles: style, page: String(page) });
  return `${BASE_URL}/en/events?${params.toString()}`;
}

/** Extract unique absolute event-detail URLs from a listing page. */
export function parseListingEventUrls(html: string): string[] {
  const matches = html.match(/\/en\/event\/\d+\/[a-z0-9-]+/gi) ?? [];
  const unique = Array.from(new Set(matches));
  return unique.map((path) => `${BASE_URL}${path}`);
}

/** Whether the listing has a further page (rel="next" present). */
export function hasNextPage(html: string): boolean {
  return /rel=["']next["']/i.test(html);
}

export interface ParsedEvent {
  name: string;
  description?: string;
  language: string;
  startDate?: string;
  endDate?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  lineup: string[];
  bookingUrls: string[];
  facebookEventUrl?: string;
}

interface LangValue {
  '@value'?: string;
  '@language'?: string;
}

/** Pick a usable string from a JSON-LD field that may be multilingual. */
function pickLang(value: unknown, preferred = 'en'): { text?: string; language: string } {
  if (typeof value === 'string') return { text: value, language: preferred };
  if (Array.isArray(value)) {
    const items = value as LangValue[];
    const match = items.find((i) => i['@language'] === preferred) ?? items[0];
    return { text: match?.['@value'], language: match?.['@language'] ?? preferred };
  }
  return { language: preferred };
}

/** Collect all JSON-LD objects embedded in a page (tolerant of parse errors). */
function extractJsonLd(html: string): Record<string, unknown>[] {
  const blocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!blocks) return [];
  const objects: Record<string, unknown>[] = [];
  for (const block of blocks) {
    const json = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) objects.push(...parsed);
      else objects.push(parsed);
    } catch {
      /* skip malformed block */
    }
  }
  return objects;
}

/** Pull [lat, lng] from the Google-Maps link goandance embeds, if present. */
function parseCoordinates(html: string): { latitude?: number; longitude?: number } {
  const match = html.match(
    /google\.com\/maps\/search\/\?api=1&(?:amp;)?query=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i
  );
  if (!match) return {};
  return { latitude: Number(match[1]), longitude: Number(match[2]) };
}

function performerNames(performer: unknown): string[] {
  const list = Array.isArray(performer) ? performer : performer ? [performer] : [];
  return list
    .map((p) => pickLang((p as { name?: unknown }).name).text?.trim())
    .filter((n): n is string => Boolean(n));
}

/** Parse a goandance event detail page into a provider-neutral shape. */
export function parseEventDetail(html: string): ParsedEvent | null {
  const event = extractJsonLd(html).find((o) => o['@type'] === 'Event');
  if (!event) return null;

  const name = pickLang(event.name);
  const description = pickLang(event.description);
  const address =
    ((event.location as { address?: Record<string, unknown> })?.address ?? {}) as Record<
      string,
      unknown
    >;
  const { latitude, longitude } = parseCoordinates(html);

  const fbMatch = html.match(/facebook\.com\/events\/\d+/i);

  return {
    name: name.text ?? '',
    description: description.text,
    language: name.language || 'en',
    startDate: typeof event.startDate === 'string' ? event.startDate : undefined,
    endDate: typeof event.endDate === 'string' ? event.endDate : undefined,
    // goandance's address fields are inconsistent (locality sometimes holds the
    // country); coordinates drive proximity, these strings are display-only.
    city: typeof address.addressLocality === 'string' ? address.addressLocality : '',
    country: typeof address.addressCountry === 'string' ? address.addressCountry : '',
    latitude,
    longitude,
    lineup: performerNames(event.performer),
    bookingUrls: typeof event.url === 'string' ? [event.url] : [],
    facebookEventUrl: fbMatch ? `https://${fbMatch[0]}` : undefined,
  };
}

/**
 * Build a goandance ingestion source for the given style filters. Each event is
 * style-verified (Q11): the result's `moderationStatus`/`moderationReason` come
 * from {@link verifyStyle}. Events missing coordinates are dropped (the
 * normalizer requires them); this is logged.
 */
export function createGoandanceSource(opts: {
  styles: string[];
  fetchPage: PageFetcher;
  maxPagesPerStyle?: number;
}): IngestionSource {
  const { styles, fetchPage, maxPagesPerStyle = DEFAULT_MAX_PAGES } = opts;

  return {
    key: PROVIDER,
    async fetch(): Promise<ScrapedFestival[]> {
      const seen = new Set<string>();
      const results: ScrapedFestival[] = [];

      for (const style of styles) {
        for (let page = 1; page <= maxPagesPerStyle; page++) {
          const listingHtml = await fetchPage(listingUrl(style, page));
          const urls = parseListingEventUrls(listingHtml).filter((u) => !seen.has(u));
          urls.forEach((u) => seen.add(u));

          for (const url of urls) {
            const detail = parseEventDetail(await fetchPage(url));
            if (!detail || !detail.name) continue;
            if (detail.latitude === undefined || detail.longitude === undefined) {
              console.warn(`[goandance] no coordinates for ${url} — skipping`);
              continue;
            }

            const verdict = verifyStyle({
              requestedStyle: style,
              title: detail.name,
              description: detail.description,
            });

            results.push({
              provider: PROVIDER,
              sourceUrl: url,
              name: detail.name,
              description: detail.description,
              language: detail.language,
              city: detail.city,
              country: detail.country,
              latitude: detail.latitude,
              longitude: detail.longitude,
              startDate: detail.startDate ?? '',
              endDate: detail.endDate ?? '',
              styles: [style],
              lineup: detail.lineup,
              facebookEventUrl: detail.facebookEventUrl,
              bookingUrls: detail.bookingUrls,
              moderationStatus: verdict.status,
              moderationReason: verdict.reason,
            });
          }

          if (!hasNextPage(listingHtml) || urls.length === 0) break;
        }
      }

      return results;
    },
  };
}
