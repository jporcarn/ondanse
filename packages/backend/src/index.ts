import express, { type RequestHandler } from 'express';
import { ObjectId, type Filter } from 'mongodb';
import {
  connectToDatabase,
  getFestivalsCollection,
  toFestival,
  type FestivalDoc,
} from './db';
import {
  buildFestivalQuery,
  InvalidQueryError,
  type FestivalQueryParams,
} from './festivalQuery';

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

// Mark a public GET response as cacheable so the CDN/edge layer (Q4 layer 2) and
// the browser can cache it. Festival data changes only when ingestion runs, so a
// few minutes of staleness is acceptable.
const publicCache: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  next();
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/festivals
 * Query params: lat, lng, radius (km), style (CSV), from, to (YYYY-MM-DD),
 * artist, format (all-in-one|multi-venue), upcomingOnly (default true), limit.
 * When lat/lng are given, results are proximity-sorted via $near/2dsphere;
 * otherwise they are sorted by soonest start date.
 */
app.get('/api/festivals', publicCache, async (req, res) => {
  try {
    const { filter, sort, limit } = buildFestivalQuery(
      req.query as FestivalQueryParams,
      new Date()
    );
    await connectToDatabase();
    let cursor = getFestivalsCollection().find(filter).limit(limit);
    if (sort) cursor = cursor.sort(sort);
    const docs = await cursor.toArray();
    res.json(docs.map(toFestival));
  } catch (err) {
    if (err instanceof InvalidQueryError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Failed to read festivals', err);
    res.status(503).json({ error: 'Festival data is temporarily unavailable' });
  }
});

/** GET /api/festivals/:id — full detail for a single festival, or 404. */
app.get('/api/festivals/:id', publicCache, async (req, res) => {
  try {
    const { id } = req.params;
    // Documents seeded/ingested use an ObjectId _id, but accept a plain string
    // id too for forward compatibility.
    const _id = ObjectId.isValid(id) ? new ObjectId(id) : id;
    await connectToDatabase();
    const doc = await getFestivalsCollection().findOne({ _id } as unknown as Filter<FestivalDoc>);
    if (!doc) {
      res.status(404).json({ error: 'Festival not found' });
      return;
    }
    res.json(toFestival(doc));
  } catch (err) {
    console.error('Failed to read festival', err);
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
