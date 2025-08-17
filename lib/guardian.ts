// lib/guardian.ts
/** true, ha a link theguardian.com */
export function isGuardianLink(href?: string): boolean {
  try {
    return !!href && new URL(href).hostname.includes("theguardian.com");
  } catch {
    return false;
  }
}

/**
 * Guardian-képek normalizálása:
 * - ha media.guim.co.uk → át a képszolgára (i.guim.co.uk)
 * - ha már i.guim.co.uk → HAGYJUK BÉKÉN (nem piszkáljuk a query-t, a "s" szignót sem)
 */
export function toGuardianCdn(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u);

    // media.guim → i.guim (paramok nélkül; a CDN így is kiszolgál)
    if (url.hostname.endsWith("media.guim.co.uk")) {
      const path = url.pathname.replace(/^\/+/, "");
      // jó default: max szélesség, automatikus formátum – NEM adunk "s" paramot
      return `https://i.guim.co.uk/img/${path}?width=1000&quality=85&auto=format&fit=max`;
    }

    // i.guim és minden más: változatlanul hagyjuk
    return u;
  } catch {
    return u;
  }
}
