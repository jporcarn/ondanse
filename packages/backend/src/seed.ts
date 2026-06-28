import { connectToDatabase, getFestivalsCollection, closeDatabase, type FestivalDoc } from './db';

/**
 * Dev seed script — inserts one sample festival so the data-access layer and the
 * `/api/festivals` endpoint can be exercised locally. This is the scripts-based
 * data path chosen for the MVP (no admin UI; request 0001 Q6). Run with:
 *
 *   pnpm --dir packages/backend seed
 *
 * Honors MONGODB_URI / MONGODB_DB; defaults to a local MongoDB.
 */

const sample: Omit<FestivalDoc, '_id'> = {
  name: 'Loves Kizomba Summer Fest 2026',
  descriptions: { en: 'A week-long kizomba festival in Seville.' },
  primaryLanguage: 'en',
  location: {
    city: 'Seville',
    country: 'Spain',
    // GeoJSON order: [longitude, latitude]
    geo: { type: 'Point', coordinates: [-5.995, 37.296] },
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
      retrievedAtUtc: '2026-06-21T00:00:00Z',
    },
  ],
  updatedAtUtc: '2026-06-21T00:00:00Z',
};

async function main(): Promise<void> {
  await connectToDatabase();
  const festivals = getFestivalsCollection();
  await festivals.deleteMany({});
  const result = await festivals.insertOne(sample as FestivalDoc);
  console.log(`Seeded festival ${result.insertedId}`);
  await closeDatabase();
}

main().catch((err) => {
  console.error('Seed failed', err);
  process.exitCode = 1;
  void closeDatabase();
});
