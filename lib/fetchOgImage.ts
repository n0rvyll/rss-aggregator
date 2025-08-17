// lib/fetchOgImage.ts
import { isGuardianLink, toGuardianCdn } from "@/lib/guardian";
import { isHangLink, toHangCanonicalImage } from "@/lib/hang";

function normFromPage(articleUrl: string, u?: string) {
  try {
    if (!u) return undefined;
    if (/^data:|^blob:/.test(u)) return undefined;
    const abs = new URL(u, articleUrl).toString();
    // domain-specifikus normalizálás
    return toHangCanonicalImage(toGuardianCdn(abs));
  } catch {
    return undefined;
  }
}

/** Gyors OG-kép keresés; The Guardian / Magyar Hang esetén hosszabb timeout. */
export async function fetchOgImage(
  articleUrl: string,
  timeoutMs = 1200
): Promise<string | undefined> {
  const needsMore = isGuardianLink(articleUrl) || isHangLink(articleUrl);
  const effectiveTimeout = needsMore ? Math.max(timeoutMs, 3500) : timeoutMs;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), effectiveTimeout);

  try {
    const res = await fetch(articleUrl, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "rss-aggregator/1.0 (+local)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      },
    });
    if (!res.ok) return undefined;
    const html = await res.text();

    const pickMeta = (re: RegExp) => html.match(re)?.[1];

    // 1) og / twitter / thumbnail / parsely
    const candidates = [
      pickMeta(
        /<meta[^>]+property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i
      ),
      pickMeta(
        /<meta[^>]+property=["']og:image:url["'][^>]*content=["']([^"']+)["']/i
      ),
      pickMeta(
        /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      ),
      pickMeta(/<meta[^>]+name=["']og:image["'][^>]*content=["']([^"']+)["']/i),
      pickMeta(
        /<meta[^>]+name=["']twitter:image:src["'][^>]*content=["']([^"']+)["']/i
      ),
      pickMeta(
        /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
      ),
      pickMeta(
        /<meta[^>]+name=["']thumbnail["'][^>]*content=["']([^"']+)["']/i
      ),
      pickMeta(
        /<meta[^>]+name=["']parsely-image-url["'][^>]*content=["']([^"']+)["']/i
      ),
      pickMeta(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i),
    ]
      .map((u) => normFromPage(articleUrl, u))
      .filter((u): u is string => !!u && !/\.svg($|\?)/i.test(u));

    if (candidates[0]) return candidates[0];

    // 2) JSON-LD (image)
    const ldBlocks = Array.from(
      html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      )
    );
    for (const m of ldBlocks) {
      try {
        const json = JSON.parse(m[1].trim());
        const pick = (val: any): string | undefined => {
          if (!val) return undefined;
          if (typeof val === "string") return normFromPage(articleUrl, val);
          if (Array.isArray(val)) {
            for (const x of val) {
              const r = pick(x);
              if (r) return r;
            }
            return undefined;
          }
          if (typeof val === "object") {
            return normFromPage(
              articleUrl,
              val.url || val.contentUrl || val["@id"] || val.src || val.image
            );
          }
          return undefined;
        };
        const candidate = pick(json.image) || pick(json.primaryImageOfPage);
        if (candidate && !/\.svg($|\?)/i.test(candidate)) return candidate;
      } catch {}
    }

    // 3) Fallback: első <img> (srcset → nagyobb)
    const set = html.match(
      /<img[^>]+(?:srcset|data-srcset)\s*=\s*"([^"]+)"/i
    )?.[1];
    if (set) {
      const parts = set
        .split(",")
        .map((s) => s.trim())
        .map((s) => {
          const m = s.match(/(\S+)\s+(\d+)w/);
          return m
            ? { url: m[1], w: parseInt(m[2], 10) }
            : { url: s.split(/\s+/)[0], w: 0 };
        })
        .sort((a, b) => b.w - a.w);
      for (const p of parts) {
        const u = normFromPage(articleUrl, p.url);
        if (u && !/\.svg($|\?)/i.test(u)) return u;
      }
    }
    const src = normFromPage(
      articleUrl,
      html.match(/<img[^>]+(?:data-src|src)\s*=\s*"([^"]+)"/i)?.[1]
    );
    if (src && !/\.svg($|\?)/i.test(src)) return src;

    return undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(t);
  }
}
