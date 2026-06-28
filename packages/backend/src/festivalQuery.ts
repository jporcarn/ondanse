import type { Filter, Sort } from 'mongodb';
import type { FestivalDoc } from './db';

/**
 * Pure translation of `GET /api/festivals` query-string params into a MongoDB
 * filter + sort + limit. Kept free of any DB/Express dependency so it can be
 * unit-tested in isolation.
 */

export interface FestivalQueryParams {
  /** Latitude for proximity sort (paired with `lng`). */
  lat?: string;
  /** Longitude for proximity sort (paired with `lat`). */
  lng?: string;
  /** Max distance from lat/lng, in kilometers. */
  radius?: string;
  /** Comma-separated dance styles; matches a festival with ANY of them. */
  style?: string;
  /** Inclusive date-only lower bound (YYYY-MM-DD): festival ends on/after `from`. */
  from?: string;
  /** Inclusive date-only upper bound (YYYY-MM-DD): festival starts on/before `to`. */
  to?: string;
  /** Case-insensitive substring match against the lineup. */
  artist?: string;
  /** Accommodation format filter: "all-in-one" | "multi-venue". */
  format?: string;
  /** Default "true"; when "false", past festivals are included. */
  upcomingOnly?: string;
  /** Result cap (default 100, max 200). */
  limit?: string;
}

export interface BuiltFestivalQuery {
  filter: Filter<FestivalDoc>;
  /** Undefined when `$near` drives the ordering (it sorts by distance itself). */
  sort?: Sort;
  limit: number;
}

/** Thrown for malformed params so the route can answer 400 instead of 500/503. */
export class InvalidQueryError extends Error {}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const VALID_FORMATS = new Set(['all-in-one', 'multi-venue']);

/** Date-only (YYYY-MM-DD) for a given instant, in UTC. */
export function toDateOnly(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildFestivalQuery(p: FestivalQueryParams, now: Date): BuiltFestivalQuery {
  const filter: Filter<FestivalDoc> = {};

  // --- Date range (date-only strings compare correctly with lexicographic ops) ---
  const upcomingOnly = p.upcomingOnly !== 'false';
  const endLowerBounds: string[] = [];
  if (upcomingOnly) endLowerBounds.push(toDateOnly(now));
  if (p.from) endLowerBounds.push(p.from);
  if (endLowerBounds.length > 0) {
    // The festival must still be running on/after the strictest lower bound.
    filter.endDateUtc = { $gte: endLowerBounds.sort().at(-1) };
  }
  if (p.to) {
    filter.startDateUtc = { $lte: p.to };
  }

  // --- Dance styles (any-of) ---
  if (p.style) {
    const styles = p.style
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (styles.length > 0) filter.style = { $in: styles };
  }

  // --- Artist / DJ substring (case-insensitive) ---
  if (p.artist && p.artist.trim()) {
    filter.lineup = { $elemMatch: { $regex: escapeRegex(p.artist.trim()), $options: 'i' } };
  }

  // --- Accommodation format ---
  if (p.format) {
    if (!VALID_FORMATS.has(p.format)) {
      throw new InvalidQueryError(`format must be one of: ${[...VALID_FORMATS].join(', ')}`);
    }
    filter.accommodationFormat = p.format as FestivalDoc['accommodationFormat'];
  }

  // --- Proximity (geospatial $near) vs. date sort fallback ---
  let sort: Sort | undefined;
  const hasLat = p.lat !== undefined && p.lat !== '';
  const hasLng = p.lng !== undefined && p.lng !== '';
  if (hasLat || hasLng) {
    if (!hasLat || !hasLng) {
      throw new InvalidQueryError('lat and lng must be provided together');
    }
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new InvalidQueryError('lat must be a number between -90 and 90');
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new InvalidQueryError('lng must be a number between -180 and 180');
    }
    const near: { $geometry: { type: 'Point'; coordinates: [number, number] }; $maxDistance?: number } = {
      $geometry: { type: 'Point', coordinates: [lng, lat] },
    };
    if (p.radius !== undefined && p.radius !== '') {
      const radiusKm = Number(p.radius);
      if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
        throw new InvalidQueryError('radius must be a positive number (kilometers)');
      }
      near.$maxDistance = radiusKm * 1000; // $near expects meters
    }
    // $near returns results ordered nearest-first, so no explicit sort.
    (filter as Filter<FestivalDoc>)['location.geo'] = { $near: near };
  } else {
    // No location: soonest festivals first.
    sort = { startDateUtc: 1 };
  }

  // --- Limit ---
  let limit = DEFAULT_LIMIT;
  if (p.limit !== undefined && p.limit !== '') {
    const n = Number(p.limit);
    if (!Number.isInteger(n) || n <= 0) {
      throw new InvalidQueryError('limit must be a positive integer');
    }
    limit = Math.min(n, MAX_LIMIT);
  }

  return { filter, sort, limit };
}
