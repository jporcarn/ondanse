/** A user/browse position in the conventional lat/lng order. */
export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometers (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** "12 km" under 100, "1,234 km" above — enough precision for a card. */
export function formatDistance(km: number): string {
  const rounded = km < 100 ? Math.round(km) : Math.round(km / 10) * 10;
  return `${rounded.toLocaleString()} km`;
}

/**
 * Format a date-only "YYYY-MM-DD" value without timezone shifting (parsing via
 * `new Date(...)` alone would render the previous day in negative-offset zones).
 */
export function formatDateOnly(dateOnly: string, locale?: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
