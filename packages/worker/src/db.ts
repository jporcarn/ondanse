import { MongoClient, type Db } from 'mongodb';
import type { NormalizedFestival } from './normalize';

/**
 * Write-side data access for the ingestion worker. Shares the same env-based
 * connection convention as the backend (MONGODB_URI / COSMOS_CONNECTION_STRING,
 * local fallback) so nothing is hardcoded.
 */

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017';

const uri =
  process.env.MONGODB_URI ?? process.env.COSMOS_CONNECTION_STRING ?? DEFAULT_LOCAL_URI;

const dbName = process.env.MONGODB_DB ?? 'ondanse';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connect(): Promise<Db> {
  if (db) return db;
  const pending = new MongoClient(uri);
  try {
    await pending.connect();
    client = pending;
    db = pending.db(dbName);
    return db;
  } catch (err) {
    await pending.close().catch(() => {
      /* ignore */
    });
    throw err;
  }
}

export async function close(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export interface UpsertResult {
  upserted: number;
  modified: number;
}

/**
 * Upsert festivals keyed by `sourceUrl` (the canonical per-festival URL), so a
 * re-run updates existing records rather than duplicating them.
 */
export async function upsertFestivals(festivals: NormalizedFestival[]): Promise<UpsertResult> {
  if (festivals.length === 0) return { upserted: 0, modified: 0 };
  const database = await connect();
  const collection = database.collection<NormalizedFestival>('festivals');
  const result = await collection.bulkWrite(
    festivals.map((festival) => ({
      updateOne: {
        filter: { sourceUrl: festival.sourceUrl },
        update: { $set: festival },
        upsert: true,
      },
    }))
  );
  return { upserted: result.upsertedCount, modified: result.modifiedCount };
}
