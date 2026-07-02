import { useCallback, useState } from 'react';
import type { LatLng } from '../lib/geo';

/**
 * Geolocation permission flow (request 0001 task 3.1).
 *
 * - `idle`: not asked yet — the UI shows an explanatory prompt first (browsers
 *   punish permission requests fired on load).
 * - `requesting`: waiting for the browser/user.
 * - `granted`: `position` holds the device location.
 * - `unavailable`: denied or errored — the UI falls back to a manual picker or
 *   location-free browsing; discovery keeps working either way.
 * - `manual`: the user picked a location (or none) from the fallback UI.
 */
export type GeoStatus = 'idle' | 'requesting' | 'granted' | 'unavailable' | 'manual';

export interface GeolocationState {
  status: GeoStatus;
  position: LatLng | null;
  /** Label shown for manual choices, e.g. the picked city. */
  label: string | null;
  requestLocation: () => void;
  setManualLocation: (position: LatLng | null, label: string) => void;
  /** Back to the initial choice (used by the "change location" affordance). */
  reset: () => void;
}

export function useGeolocation(): GeolocationState {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [position, setPosition] = useState<LatLng | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLabel(null);
        setStatus('granted');
      },
      () => setStatus('unavailable'),
      { timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  }, []);

  const setManualLocation = useCallback((pos: LatLng | null, newLabel: string) => {
    setPosition(pos);
    setLabel(newLabel);
    setStatus('manual');
  }, []);

  const reset = useCallback(() => {
    setPosition(null);
    setLabel(null);
    setStatus('idle');
  }, []);

  return { status, position, label, requestLocation, setManualLocation, reset };
}
