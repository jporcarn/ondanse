import { MongoClient, type Db, type Collection } from 'mongodb';
import type { Festival } from '@ondanse/shared';

/**
 * MongoDB / Cosmos DB (Mongo API) data-access layer.
 *
 * The connection string is never hardcoded: in production it is injected from
 * Key Vault into the Web App settings (request 0001, task 1.5); for local
 * development it falls back to a MongoDB on localhost so the API runs with zero
 * configuration.
 */

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017';

const uri =
  process.env.MONGODB_URI ?? process.env.COSMOS_CONNECTION_STRING ?? DEFAULT_LOCAL_URI;

const dbName = process.env.MONGODB_DB ?? 'ondanse';

/**
 * A festival as stored in Mongo: the domain `id` is Mongo's `_id`. Everything
 * else mirrors the shared {@link Festival} type.
 */
export type FestivalDoc = Omit<Festival, 'id'> & { _id: unknown };

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to the database (idempotent). The first successful call caches the
 * client/db; subsequent calls return the cached `Db`. On failure the partially
 * opened client is closed so the next call can retry cleanly.
 */
export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  const pending = new MongoClient(uri);
  try {
    await pending.connect();
    const database = pending.db(dbName);
    await ensureIndexes(database);
    client = pending;
    db = database;
    return db;
  } catch (err) {
    await pending.close().catch(() => {
      /* ignore close error during failed connect */
    });
    throw err;
  }
}

/** Return the connected `Db`, or throw if {@link connectToDatabase} hasn't run. */
export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/** The typed `festivals` collection. */
export function getFestivalsCollection(): Collection<FestivalDoc> {
  return getDb().collection<FestivalDoc>('festivals');
}

/**
 * Create indexes the application owns. The `2dsphere` geospatial index on
 * `location.geo` (which powers proximity queries) lives here rather than in
 * Terraform: the azurerm provider's collection `index` block supports only
 * `keys`/`unique`, not an index *type* (request 0001, task 1.2). `createIndex`
 * is idempotent, so this is safe to run on every startup.
 */
async function ensureIndexes(database: Db): Promise<void> {
  await database
    .collection('festivals')
    .createIndex({ 'location.geo': '2dsphere' }, { name: 'location_geo_2dsphere' });
}

/** Close the connection (used by scripts and graceful shutdown). */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

/** Map a stored document to the API/domain shape (`_id` → `id`). */
export function toFestival(doc: FestivalDoc): Festival {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}
