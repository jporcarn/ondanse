# Moderating the pending-review queue

Ondanse re-verifies scraped festivals before showing them (request 0001, decision
Q11). Provider style filters are leaky — e.g. goandance.com's `?styles=kizomba`
also returns bachata/salsa/latin events — so each scraped festival is checked
against the requested style's keywords and gets a `moderationStatus`:

| status           | meaning                                    | visible to users? |
| ---------------- | ------------------------------------------ | ----------------- |
| `approved`       | confident style match (or a trusted source)| **yes**           |
| `pending-review` | no confident match — needs a human         | no                |
| `rejected`       | manually judged not relevant               | no                |

The public API (`GET /api/festivals`, `GET /api/festivals/:id`) returns **only
`approved`** festivals. There is no admin UI (Q6); the `pending-review` queue is
curated with the `moderate` helper script or direct Cosmos access.

## Prerequisites

The worker reads the DB connection from the environment (local fallback to
`mongodb://127.0.0.1:27017`, database `ondanse`):

```bash
export MONGODB_URI="<cosmos-or-local-connection-string>"   # optional locally
export MONGODB_DB="ondanse"                                # optional
pnpm --dir packages/worker build                            # compile once
```

## Reviewing with the `moderate` helper

**1. List what's waiting:**

```bash
pnpm --dir packages/worker moderate list
```

Each entry prints the id, name, styles, dates, location, the reason it was held
(e.g. *"No kizomba keywords found…"*), and the **source URL** — open it to judge.

```
2 festival(s) with moderationStatus="pending-review":

  665f0a…c1  10th Vilnius Bachata Festival 2026
     styles: —  |  2026-11-13..2026-11-15  |  Vilnius, LT
     reason: No kizomba keywords found in title/description/tags — needs manual review
     source: https://www.goandance.com/en/event/…
```

**2. Approve the ones that belong** (they become public immediately):

```bash
pnpm --dir packages/worker moderate approve 665f0a…c1 665f0a…c2
```

**3. Reject the ones that don't:**

```bash
pnpm --dir packages/worker moderate reject 665f0a…c9
```

You can also list other statuses to audit past decisions:

```bash
pnpm --dir packages/worker moderate list approved
pnpm --dir packages/worker moderate list rejected
```

## Alternative: direct Cosmos access

The same operations via the Mongo shell (or the Azure Portal → Cosmos DB → Data
Explorer), consistent with the "manage via direct Cosmos" decision (Q6):

```js
// list pending-review
db.festivals.find({ moderationStatus: "pending-review" })
            .sort({ startDateUtc: 1 })

// approve one
db.festivals.updateOne(
  { _id: ObjectId("665f0a…c1") },
  { $set: { moderationStatus: "approved" } }
)

// reject a batch
db.festivals.updateMany(
  { _id: { $in: [ObjectId("…"), ObjectId("…")] } },
  { $set: { moderationStatus: "rejected" } }
)
```

## Tuning what needs review

If genuinely-relevant festivals keep landing in `pending-review`, extend the
per-style keyword/synonym map in
[`packages/worker/src/styleVerification.ts`](../packages/worker/src/styleVerification.ts)
(`STYLE_KEYWORDS`) so future runs auto-approve them. Re-running ingestion
re-evaluates and upserts existing festivals by `sourceUrl`.
