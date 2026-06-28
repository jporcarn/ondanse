import express from 'express';
import type { Festival } from '@ondanse/shared';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

// Allow the Static Web App frontend (different origin) to call this API.
// Open CORS is fine for the public, read-only festival endpoints; tighten if
// authenticated or write endpoints are added later.
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/festivals', (_req, res) => {
  // Placeholder seed until the Cosmos-backed data-access layer lands (task 1.3).
  const festivals: Festival[] = [
    {
      id: 'test-festival-1',
      name: 'Loves Kizomba Summer Fest 2026',
      descriptions: { en: 'A week-long kizomba festival in Seville.' },
      primaryLanguage: 'en',
      location: {
        city: 'Seville',
        country: 'Spain',
        // GeoJSON order: [longitude, latitude]
        geo: { type: 'Point', coordinates: [-5.995, 37.296] }
      },
      startDateUtc: '2026-06-30',
      endDateUtc: '2026-07-07',
      style: ['Kizomba', 'Urban Kizz'],
      lineup: ['DJ Shark', 'DJ Snake', 'DJ Nice Life'],
      accommodationFormat: 'all-in-one',
      sourceUrl: 'https://www.facebook.com/events/1651344175563437',
      facebookEventUrl: 'https://www.facebook.com/events/1651344175563437',
      bookingUrls: ['https://salsero.es', 'https://www.goandance.com'],
      sources: [
        {
          provider: 'facebook',
          url: 'https://www.facebook.com/events/1651344175563437',
          retrievedAtUtc: '2026-06-21T00:00:00Z'
        }
      ],
      updatedAtUtc: '2026-06-21T00:00:00Z'
    }
  ];
  res.json(festivals);
});

app.listen(port, () => {
  console.log(`Ondanse backend running on http://localhost:${port}`);
});
