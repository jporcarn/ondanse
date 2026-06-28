import express from 'express';
import { connectToDatabase, getFestivalsCollection, toFestival } from './db';

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

app.get('/api/festivals', async (_req, res) => {
  // Read from the festivals collection. Filtering + proximity sorting arrive in
  // task 2.1; for now this returns the full collection.
  try {
    await connectToDatabase();
    const docs = await getFestivalsCollection().find().toArray();
    res.json(docs.map(toFestival));
  } catch (err) {
    console.error('Failed to read festivals', err);
    res.status(503).json({ error: 'Festival data is temporarily unavailable' });
  }
});

// Eagerly connect on startup so the 2dsphere index is created early and
// connection problems surface in the logs. The server still starts if the DB is
// unreachable — /api/health stays up and festival reads retry per request.
connectToDatabase()
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) =>
    console.error(
      'MongoDB connection failed on startup; festival endpoints return 503 until it recovers',
      err
    )
  );

app.listen(port, () => {
  console.log(`Ondanse backend running on http://localhost:${port}`);
});
