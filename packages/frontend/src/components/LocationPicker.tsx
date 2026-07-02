import type { LatLng } from '../lib/geo';

/**
 * No-location fallback (request 0001 task 3.1): a small set of region presets
 * plus a location-free option, so discovery works when geolocation is denied
 * or unavailable.
 */
const PRESETS: Array<{ label: string; position: LatLng }> = [
  { label: 'Madrid', position: { lat: 40.4168, lng: -3.7038 } },
  { label: 'Barcelona', position: { lat: 41.3874, lng: 2.1686 } },
  { label: 'Paris', position: { lat: 48.8566, lng: 2.3522 } },
  { label: 'Lisbon', position: { lat: 38.7223, lng: -9.1393 } },
  { label: 'London', position: { lat: 51.5072, lng: -0.1276 } },
  { label: 'Berlin', position: { lat: 52.52, lng: 13.405 } },
];

interface Props {
  onPick: (position: LatLng | null, label: string) => void;
}

export function LocationPicker({ onPick }: Props) {
  return (
    <div className="location-picker">
      <p>Pick a city to browse from:</p>
      <div className="location-picker-options">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onPick(preset.position, preset.label)}
          >
            {preset.label}
          </button>
        ))}
        <button type="button" className="secondary" onClick={() => onPick(null, 'Anywhere')}>
          Anywhere (soonest first)
        </button>
      </div>
    </div>
  );
}
