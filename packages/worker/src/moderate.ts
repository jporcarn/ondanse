import { ObjectId } from 'mongodb';
import type { ModerationStatus } from '@ondanse/shared';
import { connect, close } from './db';

/**
 * Manual moderation CLI for the pending-review queue (request 0001 Q11 + Q6:
 * no admin UI — curate via scripts / direct Cosmos). Usage:
 *
 *   pnpm --dir packages/worker build   # once
 *   pnpm --dir packages/worker moderate list            # list pending-review
 *   pnpm --dir packages/worker moderate list approved   # list another status
 *   pnpm --dir packages/worker moderate approve <id> [<id>…]
 *   pnpm --dir packages/worker moderate reject  <id> [<id>…]
 *
 * Honors MONGODB_URI / MONGODB_DB (local fallback), same as the scrapers.
 */

const COLLECTION = 'festivals';
const STATUSES: ModerationStatus[] = ['approved', 'pending-review', 'rejected'];

interface FestivalRow {
  _id: ObjectId;
  name?: string;
  style?: string[];
  startDateUtc?: string;
  endDateUtc?: string;
  location?: { city?: string; country?: string };
  moderationStatus?: ModerationStatus;
  moderationReason?: string;
  sourceUrl?: string;
}

/** Print all festivals with the given moderation status (default pending-review). */
export async function list(status: ModerationStatus = 'pending-review'): Promise<number> {
  const db = await connect();
  const docs = await db
    .collection<FestivalRow>(COLLECTION)
    .find({ moderationStatus: status })
    .sort({ startDateUtc: 1 })
    .toArray();

  if (docs.length === 0) {
    console.log(`No festivals with moderationStatus="${status}".`);
    return 0;
  }

  console.log(`${docs.length} festival(s) with moderationStatus="${status}":\n`);
  for (const d of docs) {
    const where = [d.location?.city, d.location?.country].filter(Boolean).join(', ') || '—';
    console.log(`  ${d._id.toString()}  ${d.name ?? '(no name)'}`);
    console.log(`     styles: ${d.style?.join(', ') || '—'}  |  ${d.startDateUtc ?? '?'}..${d.endDateUtc ?? '?'}  |  ${where}`);
    console.log(`     reason: ${d.moderationReason ?? '—'}`);
    console.log(`     source: ${d.sourceUrl ?? '—'}`);
    console.log('');
  }
  return docs.length;
}

/** Set the moderation status of one or more festivals by id. Returns modified count. */
export async function setStatus(ids: string[], status: ModerationStatus): Promise<number> {
  const invalid = ids.filter((id) => !ObjectId.isValid(id));
  invalid.forEach((id) => console.warn(`Skipping invalid id: ${id}`));
  const valid = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));

  if (valid.length === 0) {
    console.error(`No valid festival ids to mark "${status}".`);
    return 0;
  }

  const db = await connect();
  const result = await db
    .collection(COLLECTION)
    .updateMany({ _id: { $in: valid } }, { $set: { moderationStatus: status } });
  console.log(`Marked ${result.modifiedCount} festival(s) as "${status}".`);
  return result.modifiedCount;
}

function usage(): void {
  console.log(`Manual moderation of the pending-review queue (Q11).

Usage:
  moderate list [status]        List festivals by status (default: pending-review)
                                status: ${STATUSES.join(' | ')}
  moderate approve <id> [<id>…] Approve (make public) one or more festivals
  moderate reject  <id> [<id>…] Reject one or more festivals`);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  try {
    switch (command) {
      case 'list': {
        const status = (args[0] as ModerationStatus) ?? 'pending-review';
        if (!STATUSES.includes(status)) {
          console.error(`Unknown status "${status}". Expected: ${STATUSES.join(', ')}`);
          process.exitCode = 1;
          break;
        }
        await list(status);
        break;
      }
      case 'approve':
        await setStatus(args, 'approved');
        break;
      case 'reject':
        await setStatus(args, 'rejected');
        break;
      default:
        usage();
        process.exitCode = command ? 1 : 0;
    }
  } finally {
    await close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Moderation command failed', err);
    process.exitCode = 1;
    void close();
  });
}
