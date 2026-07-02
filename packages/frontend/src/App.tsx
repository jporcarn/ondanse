import { useEffect, useState } from 'react';
import type { Festival } from '@ondanse/shared';
import { fetchFestivals } from './lib/api';
import { useGeolocation } from './hooks/useGeolocation';
import { LocationPicker } from './components/LocationPicker';
import { FestivalCard } from './components/FestivalCard';
import './App.css';

type LoadState = 'loading' | 'ready' | 'error';

function App() {
  const geo = useGeolocation();
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  // A location decision has been made once geolocation resolved (granted or
  // manual) or turned out unavailable with the user having picked a fallback.
  const locationDecided = geo.status === 'granted' || geo.status === 'manual';

  useEffect(() => {
    // Fetch as soon as the flow settles: with coordinates when we have them
    // (proximity-sorted by the API), or without (soonest-first) for "Anywhere".
    if (!locationDecided) return;
    let cancelled = false;
    setLoadState('loading');
    fetchFestivals(geo.position ? { lat: geo.position.lat, lng: geo.position.lng } : {})
      .then((data) => {
        if (cancelled) return;
        setFestivals(data);
        setLoadState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [locationDecided, geo.position]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ondanse</h1>
        <p>Discover dance festivals near you.</p>
      </header>

      {geo.status === 'idle' && (
        <section className="panel">
          <p>See festivals sorted by how close they are to you.</p>
          <button type="button" onClick={geo.requestLocation}>
            📍 Use my location
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => geo.setManualLocation(null, 'Anywhere')}
          >
            Browse without location
          </button>
        </section>
      )}

      {geo.status === 'requesting' && <p className="status">Waiting for your location…</p>}

      {geo.status === 'unavailable' && (
        <section className="panel">
          <p>We couldn't get your location — no problem.</p>
          <LocationPicker onPick={geo.setManualLocation} />
        </section>
      )}

      {locationDecided && (
        <main>
          <p className="browse-context">
            {geo.position
              ? `Sorted by distance${geo.label ? ` from ${geo.label}` : ' from you'}`
              : 'Upcoming festivals, soonest first'}
            {' · '}
            <button type="button" className="link" onClick={geo.reset}>
              change
            </button>
          </p>

          {loadState === 'loading' && <p className="status">Loading festivals…</p>}
          {loadState === 'error' && (
            <p className="status error">Couldn't load festivals. Please try again later.</p>
          )}
          {loadState === 'ready' && festivals.length === 0 && (
            <p className="status">No upcoming festivals found.</p>
          )}

          <ul className="festival-list">
            {festivals.map((festival) => (
              <li key={festival.id}>
                <FestivalCard festival={festival} origin={geo.position} />
              </li>
            ))}
          </ul>
        </main>
      )}
    </div>
  );
}

export default App;
