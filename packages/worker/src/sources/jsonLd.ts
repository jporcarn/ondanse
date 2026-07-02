/**
 * Shared helpers for scraping schema.org JSON-LD, used by the goandance and
 * lasalsadelbaile scrapers (both sites embed structured Event data).
 */

interface LangValue {
  '@value'?: string;
  '@language'?: string;
}

/**
 * Pick a usable string from a JSON-LD field that may be a plain string or a
 * multilingual array of `{ @value, @language }`.
 */
export function pickLang(value: unknown, preferred = 'en'): { text?: string; language: string } {
  if (typeof value === 'string') return { text: value, language: preferred };
  if (Array.isArray(value)) {
    const items = value as LangValue[];
    const match = items.find((i) => i['@language'] === preferred) ?? items[0];
    return { text: match?.['@value'], language: match?.['@language'] ?? preferred };
  }
  return { language: preferred };
}

/** Collect all JSON-LD objects embedded in a page (tolerant of parse errors). */
export function extractJsonLd(html: string): Record<string, unknown>[] {
  const blocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!blocks) return [];
  const objects: Record<string, unknown>[] = [];
  for (const block of blocks) {
    const json = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) objects.push(...parsed);
      else objects.push(parsed);
    } catch {
      /* skip malformed block */
    }
  }
  return objects;
}
