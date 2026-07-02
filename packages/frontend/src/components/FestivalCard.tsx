import type { Festival } from '@ondanse/shared';
import { distanceKm, formatDateOnly, formatDistance, type LatLng } from '../lib/geo';

const LINEUP_HIGHLIGHT_COUNT = 3;

interface Props {
  festival: Festival;
  /** Current browse position; when set, the card shows the distance (Q1). */
  origin: LatLng | null;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Festival card with the Q1 attribute set: name, date-only range, city/country,
 * distance from the user, hotel/all-in-one format flag, dance-style tags, a
 * short lineup highlight, and source / Facebook / booking links.
 */
export function FestivalCard({ festival, origin }: Props) {
  const [lng, lat] = festival.location.geo.coordinates;
  const distance = origin ? distanceKm(origin, { lat, lng }) : null;
  const lineupHighlight = festival.lineup.slice(0, LINEUP_HIGHLIGHT_COUNT);
  const lineupMore = festival.lineup.length - lineupHighlight.length;
  const place = [festival.location.city, festival.location.country].filter(Boolean).join(', ');

  return (
    <article className="festival-card">
      <header>
        <h2>{festival.name}</h2>
        {festival.accommodationFormat === 'all-in-one' && (
          <span className="badge badge-format" title="Hotel / all-in-one festival">
            🏨 All-in-one
          </span>
        )}
      </header>

      <p className="festival-meta">
        <span>
          {formatDateOnly(festival.startDateUtc)} – {formatDateOnly(festival.endDateUtc)}
        </span>
        {place && <span> · {place}</span>}
        {distance !== null && <span className="festival-distance"> · {formatDistance(distance)} away</span>}
      </p>

      {festival.style.length > 0 && (
        <p className="festival-styles">
          {festival.style.map((style) => (
            <span key={style} className="badge badge-style">
              {style}
            </span>
          ))}
        </p>
      )}

      {lineupHighlight.length > 0 && (
        <p className="festival-lineup">
          {lineupHighlight.join(' · ')}
          {lineupMore > 0 && <span className="lineup-more"> +{lineupMore} more</span>}
        </p>
      )}

      <p className="festival-links">
        <a href={festival.sourceUrl} target="_blank" rel="noreferrer">
          Event page
        </a>
        {festival.facebookEventUrl && festival.facebookEventUrl !== festival.sourceUrl && (
          <a href={festival.facebookEventUrl} target="_blank" rel="noreferrer">
            Facebook
          </a>
        )}
        {festival.bookingUrls.map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            {hostname(url)}
          </a>
        ))}
      </p>
    </article>
  );
}
