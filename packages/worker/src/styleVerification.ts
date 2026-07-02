import type { ModerationStatus } from '@ondanse/shared';

/**
 * Style verification (Q11). Provider listing filters are leaky — e.g.
 * goandance.com's `?styles=kizomba` also returns bachata/salsa/latin events — so
 * after scraping a festival's detail page we re-check that the requested style
 * (or a related sub-style) is actually present in its text before showing it.
 *
 * A confident keyword match → `approved`; no match / doubt → `pending-review`.
 */

/**
 * Per-style keyword/synonym sets (lowercase, diacritic-free — matched against a
 * normalized haystack). Extend this as new styles are scraped. Keys are the
 * requested-style values used by the scraper (matched case-insensitively).
 */
export const STYLE_KEYWORDS: Record<string, string[]> = {
  kizomba: [
    'kizomba',
    'kizz',
    'urban kiz',
    'urbankiz',
    'urban kizz',
    'urbankizz',
    'tarraxo',
    'tarraxa',
    'tarraxinha',
    'konpa',
    'kompa',
    'ghetto zouk',
    'ghettozouk',
  ],
  bachata: ['bachata', 'bachatero', 'sensual bachata', 'bachata sensual', 'dominican bachata'],
  salsa: ['salsa', 'salsa cubana', 'cuban salsa', 'timba', 'rueda', 'mambo'],
  zouk: ['zouk', 'brazilian zouk', 'lambada', 'zouk love'],
};

export interface StyleVerificationInput {
  /** The style the listing was filtered by (e.g. "kizomba"). */
  requestedStyle: string;
  title?: string;
  description?: string;
  /** Style tags shown on the listing/detail page. */
  styleTags?: string[];
}

export interface StyleVerificationResult {
  status: Extract<ModerationStatus, 'approved' | 'pending-review'>;
  /** Keywords that matched (empty when none did). */
  matchedKeywords: string[];
  /** Human-readable reason, stored as `moderationReason` for reviewers. */
  reason: string;
}

/** Lowercase, strip diacritics, and collapse whitespace for robust matching. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Decide whether a scraped festival genuinely matches the requested style.
 * Falls back to matching the style name itself for styles not in the map.
 */
export function verifyStyle(input: StyleVerificationInput): StyleVerificationResult {
  const requested = normalize(input.requestedStyle);
  const keywords = STYLE_KEYWORDS[requested] ?? (requested ? [requested] : []);

  const haystack = normalize(
    [input.title, input.description, ...(input.styleTags ?? [])].filter(Boolean).join(' ')
  );

  const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword));

  if (matchedKeywords.length > 0) {
    return {
      status: 'approved',
      matchedKeywords,
      reason: `Matched ${input.requestedStyle} keyword(s): ${matchedKeywords.join(', ')}`,
    };
  }

  return {
    status: 'pending-review',
    matchedKeywords: [],
    reason: `No ${input.requestedStyle} keywords found in title/description/tags — needs manual review`,
  };
}

/**
 * Detect which known styles appear in free text (by keyword match). Used by
 * sources that aren't queried per-style (e.g. a dance-specific listing) to tag a
 * festival's styles from its name/description. Returns the matching STYLE_KEYWORDS
 * keys, e.g. ["kizomba", "bachata"].
 */
export function detectStyles(text: string): string[] {
  const haystack = normalize(text);
  return Object.entries(STYLE_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
    .map(([style]) => style);
}
