import type { Festival } from '@ondanse/shared';

// In production the frontend (Static Web App) calls the backend's public URL,
// injected at build time via VITE_API_BASE_URL. In local dev it is unset, so the
// path stays relative and the Vite dev-server proxy forwards /api to localhost.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export interface FestivalQuery {
  lat?: number;
  lng?: number;
  /** Max distance in kilometers. */
  radius?: number;
  /** Comma-separated dance styles. */
  style?: string;
  from?: string;
  to?: string;
  artist?: string;
  format?: string;
  upcomingOnly?: boolean;
}

/**
 * Fetch festivals from the public API. When `lat`/`lng` are provided the
 * backend returns them proximity-sorted; otherwise soonest-first.
 */
export async function fetchFestivals(query: FestivalQuery = {}): Promise<Festival[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/festivals${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`Festival request failed (${res.status})`);
  return res.json();
}
