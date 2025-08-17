// lib/favicon.ts
export function getFaviconCandidates(pageUrl?: string): string[] {
  if (!pageUrl) return [];
  try {
    const u = new URL(pageUrl);
    const origin = u.origin;
    const host = u.hostname;

    const list = [
      `${origin}/favicon.ico`,
      `${origin}/favicon-32x32.png`,
      `${origin}/favicon-16x16.png`,
      // két megbízható fallback szolgáltató:
      `https://icon.horse/icon/${host}`,
      `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
    ];
    // deduplikálás
    return Array.from(new Set(list));
  } catch {
    return [];
  }
}