import type { Festival } from '@ondanse/shared';
import type { ScrapedFestival } from './types';

/** A festival ready to upsert: the canonical model minus the DB-assigned id. */
export type NormalizedFestival = Omit<Festival, 'id'>;

export class NormalizationError extends Error {}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Coerce a raw date string to a date-only "YYYY-MM-DD" value. Festival dates are
 * calendar dates, so we preserve the parsed calendar day rather than converting
 * through UTC (which would shift the day for inputs parsed as local midnight,
 * e.g. "June 30, 2026"). Already-date-only inputs pass through untouched.
 */
function toDateOnly(input: string, field: string): string {
  const trimmed = input?.trim();
  if (!trimmed) throw new NormalizationError(`${field} is required`);
  if (DATE_ONLY.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new NormalizationError(`${field} is not a valid date: ${input}`);
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Map a scraped festival to the canonical model with source attribution.
 * Validates required fields and coordinates; throws {@link NormalizationError}
 * so the pipeline can skip a bad record without failing the whole source.
 *
 * `now` is injected for deterministic timestamps/tests.
 */
export function normalizeFestival(raw: ScrapedFestival, now: Date): NormalizedFestival {
  if (!raw.name?.trim()) throw new NormalizationError('name is required');
  if (!raw.sourceUrl?.trim()) throw new NormalizationError('sourceUrl is required');
  if (!raw.provider?.trim()) throw new NormalizationError('provider is required');
  if (!Number.isFinite(raw.latitude) || raw.latitude < -90 || raw.latitude > 90) {
    throw new NormalizationError(`invalid latitude: ${raw.latitude}`);
  }
  if (!Number.isFinite(raw.longitude) || raw.longitude < -180 || raw.longitude > 180) {
    throw new NormalizationError(`invalid longitude: ${raw.longitude}`);
  }

  const startDateUtc = toDateOnly(raw.startDate, 'startDate');
  const endDateUtc = toDateOnly(raw.endDate, 'endDate');
  if (endDateUtc < startDateUtc) {
    throw new NormalizationError(`endDate ${endDateUtc} precedes startDate ${startDateUtc}`);
  }

  const language = raw.language?.trim() || 'en';
  const description = raw.description?.trim();
  const retrievedAtUtc = now.toISOString();

  return {
    name: raw.name.trim(),
    descriptions: description ? { [language]: description } : {},
    primaryLanguage: language,
    location: {
      city: raw.city?.trim() ?? '',
      country: raw.country?.trim() ?? '',
      // GeoJSON order: [longitude, latitude]
      geo: { type: 'Point', coordinates: [raw.longitude, raw.latitude] },
    },
    startDateUtc,
    endDateUtc,
    style: raw.styles?.map((s) => s.trim()).filter(Boolean) ?? [],
    lineup: raw.lineup?.map((s) => s.trim()).filter(Boolean) ?? [],
    // Default to the conservative "multi-venue" when the source doesn't state
    // an all-in-one/hotel package.
    accommodationFormat: raw.accommodationFormat ?? 'multi-venue',
    sourceUrl: raw.sourceUrl.trim(),
    facebookEventUrl: raw.facebookEventUrl?.trim() || undefined,
    bookingUrls: raw.bookingUrls?.map((u) => u.trim()).filter(Boolean) ?? [],
    sources: [{ provider: raw.provider.trim(), url: raw.sourceUrl.trim(), retrievedAtUtc }],
    updatedAtUtc: retrievedAtUtc,
  };
}
