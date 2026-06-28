import { chromium, type Browser } from 'playwright';
import type { PageFetcher } from './sources/goandance';

/**
 * A Playwright-backed page fetcher: launches a headless Chromium, returns the
 * fully-rendered HTML for a URL, and exposes a close() for teardown. Used by the
 * real ingestion run; scrapers accept any {@link PageFetcher}, so tests inject a
 * fixture-backed one instead of launching a browser.
 */
export async function createPlaywrightFetcher(): Promise<{
  fetchPage: PageFetcher;
  close: () => Promise<void>;
}> {
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OndanseBot/0.1 (+https://github.com/jporcarn/ondanse)',
  });

  const fetchPage: PageFetcher = async (url) => {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      return await page.content();
    } finally {
      await page.close();
    }
  };

  return {
    fetchPage,
    close: async () => {
      await browser.close();
    },
  };
}
