// lib/hang.ts

/** true, ha a link a Magyar Hangra mutat */
export function isHangLink(href?: string): boolean {
  try {
    return !!href && new URL(href).hostname.includes("hang.hu");
  } catch {
    return false;
  }
}

/**
 * Magyar Hang kép-URL kanonizálása:
 * - /data/generated/ → /
 * - "_focuspointcut_<WxH>.ext" → ".ext"
 * - query eldobása
 */
export function toHangCanonicalImage(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    if (!url.hostname.includes("hang.hu")) return u;

    // query (pl. key=...) eldobása
    url.search = "";

    // /data/generated/ → /
    url.pathname = url.pathname.replace(/^\/data\/generated\//, "/");

    // ..._focuspointcut_600100010x314100010.jpg → .jpg
    url.pathname = url.pathname.replace(
      /(_focuspointcut_\d+x\d+)(\.(jpe?g|png|webp|avif))$/i,
      "$2"
    );

    return url.toString();
  } catch {
    return u;
  }
}

/**
 * Magyar Hang képekhez jelöltlistát állítunk elő:
 *  1) kanonizált wp-content/uploads
 *  2) az eredeti URL (ha /data/generated/)
 *  3) tipikus WP méret-variánsok (-1200x630, -1200x675, -1024x576, -800x450)
 * A lista deduplikált, sorrendben próbáljuk.
 */
export function hangCandidatesFromUrl(u?: string): string[] {
  if (!u) return [];
  const out: string[] = [];

  try {
    const url = new URL(u);
    if (!url.hostname.includes("hang.hu")) return [u];

    const orig = url.toString();
    const canon = toHangCanonicalImage(orig);

    const push = (x?: string) => {
      if (!x) return;
      if (!out.includes(x)) out.push(x);
    };

    push(canon);
    // ha data/generated volt, az eredetit is próbáljuk
    if (/^\/data\/generated\//.test(url.pathname)) push(orig);

    // ha van kanonizált uploads útvonal, generáljunk méret-variánsokat
    const base = canon || orig;
    try {
      const bu = new URL(base);
      const m = bu.pathname.match(/^(.*?)(\.(jpe?g|png|webp|avif))$/i);
      if (m) {
        const stem = m[1];
        const ext = m[2];
        const sizes = ["-1200x630", "-1200x675", "-1024x576", "-800x450"];
        for (const s of sizes) push(`${stem}${s}${ext}`);
      }
    } catch {}

    return out.length ? out : [u];
  } catch {
    return [u];
  }
}
