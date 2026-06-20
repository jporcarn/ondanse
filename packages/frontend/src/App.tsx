import { useEffect, useState } from 'react';

interface Festival {
  id: string;
  name: string;
  location: { city: string; country: string };
  startDateUtc: string;
  endDateUtc: string;
  style: string[];
  lineup: string[];
  sourceUrl: string;
  bookingUrls: string[];
  accommodationFormat: string;
}

// In production the frontend (Static Web App) calls the backend's public URL,
// injected at build time via VITE_API_BASE_URL. In local dev it is unset, so the
// path stays relative and the Vite dev-server proxy forwards /api to localhost.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function App() {
  const [festivals, setFestivals] = useState<Festival[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/festivals`)
      .then((res) => res.json())
      .then(setFestivals)
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Ondanse</h1>
      <p>Discover dance festivals near you.</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {festivals.map((festival) => (
          <li key={festival.id} style={{ marginBottom: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
            <h2>{festival.name}</h2>
            <p>{festival.location.city}, {festival.location.country}</p>
            <p>{new Date(festival.startDateUtc).toLocaleDateString()} - {new Date(festival.endDateUtc).toLocaleDateString()}</p>
            <p>Styles: {festival.style.join(', ')}</p>
            <p>Lineup: {festival.lineup.join(', ')}</p>
            <p>Accommodation: {festival.accommodationFormat}</p>
            <p>
              <a href={festival.sourceUrl} target="_blank" rel="noreferrer">Facebook event</a>
            </p>
            <p>
              Booking: {festival.bookingUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" style={{ marginRight: '0.5rem' }}>{new URL(url).hostname}</a>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
