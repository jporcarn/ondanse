import express from 'express';

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
  res.json([
    {
      id: 'test-festival-1',
      name: 'Loves Kizomba Summer Fest 2026',
      location: { city: 'Seville', country: 'Spain', lat: 37.296, lng: -5.995 },
      startDateUtc: '2026-06-30T00:00:00Z',
      endDateUtc: '2026-07-07T00:00:00Z',
      style: ['Kizomba', 'Urban Kizz'],
      lineup: ['DJ Shark', 'DJ Snake', 'DJ Nice Life'],
      sourceUrl: 'https://www.facebook.com/events/1651344175563437',
      bookingUrls: ['https://salsero.es', 'https://www.goandance.com'],
      accommodationFormat: 'all-in-one'
    }
  ]);
});

app.listen(port, () => {
  console.log(`Ondanse backend running on http://localhost:${port}`);
});
