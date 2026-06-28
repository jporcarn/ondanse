import cron from 'node-cron';
import { runIngestion } from './pipeline';
import { close } from './db';
import { sources } from './sources';

/**
 * Worker entry point.
 *
 * - Default: run ingestion once and exit (the host's scheduler — e.g. an Azure
 *   timer trigger in production — invokes it).
 * - If INGEST_SCHEDULE is set to a cron expression, run on that schedule and
 *   stay alive (convenient for local "runs on a schedule" use).
 */

async function runOnce(): Promise<void> {
  if (sources.length === 0) {
    console.warn('No ingestion sources configured yet (add scrapers — task 7.3/7.4).');
  }
  const report = await runIngestion(sources);
  console.log('Ingestion report:', JSON.stringify(report));
}

async function main(): Promise<void> {
  const schedule = process.env.INGEST_SCHEDULE;

  if (schedule) {
    if (!cron.validate(schedule)) {
      console.error(`Invalid INGEST_SCHEDULE cron expression: ${schedule}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Scheduling ingestion with cron "${schedule}". Press Ctrl+C to stop.`);
    cron.schedule(schedule, () => {
      runOnce().catch((err) => console.error('Scheduled ingestion run failed', err));
    });
    // Leave the process running for the scheduler.
    return;
  }

  await runOnce();
  await close();
}

main().catch((err) => {
  console.error('Ingestion failed', err);
  process.exitCode = 1;
  void close();
});
