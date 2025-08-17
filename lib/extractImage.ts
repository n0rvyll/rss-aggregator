// lib/extractImage.ts
export function extractImageFromItem(
  item: any,
  link?: string
): string | undefined {
  // 1) klasszikus RSS mezők
  const encUrl = item?.enclosure?.url || item?.enclosures?.[0]?.url;
  if (isHttp(encUrl)) return encUrl;

  const mediaContent = getMediaUrl(item);
  if (isHttp(mediaContent)) return mediaContent;

  // 2) summary/content HTML-ből első <img>
  const html =
    item["content:encoded"] ||
    item.content ||
    item.summary ||
    item.contentSnippet ||
    "";

  if (typeof html === "string" && html) {
    const fromImg = firstImgFromHtml(html, link);
    if (isHttp(fromImg)) return fromImg;
  }

  return undefined;
}

function isHttp(u?: string) {
  return typeof u === "string" && /^https?:\/\//i.test(u);
}

function getMediaUrl(item: any): string | undefined {
  // media:content / media:thumbnail / image / thumbnail
  const media =
    item?.["media:content"]?.url ||
    item?.["media:content"]?.["$"]?.url ||
    item?.media?.content?.url ||
    item?.["media:thumbnail"]?.url ||
    item?.image ||
    item?.thumbnail ||
    undefined;
  return typeof media === "string" ? media : undefined;
}

function firstImgFromHtml(html: string, base?: string): string | undefined {
  // prefer data-amp-src / data-src / data-lazy-src / srcset / src
  // teljes img tag
  const imgTag = html.match(/<img[^>]*?>/i)?.[0] || undefined;

  if (!imgTag) return undefined;

  // srcset parse (legnagyobb szélesség)
  const srcset = attr(imgTag, "srcset");
  if (srcset) {
    const best = pickFromSrcset(srcset);
    if (best) return absolute(best, base);
  }

  const cand =
    attr(imgTag, "data-amp-src") ||
    attr(imgTag, "data-src") ||
    attr(imgTag, "data-lazy-src") ||
    attr(imgTag, "src");

  if (cand) return absolute(cand, base);
  return undefined;
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return m?.[1];
}

function pickFromSrcset(srcset: string): string | undefined {
  // "url 320w, url2 640w, url3 1024w" -> válassz legnagyobbat
  const parts = srcset
    .split(",")
    .map((p) => p.trim())
    .map((p) => {
      const m = p.match(/(.+?)\s+(\d+)w$/);
      if (!m) return { url: p.split(" ")[0], w: 0 };
      return { url: m[1], w: Number(m[2]) || 0 };
    });
  if (!parts.length) return undefined;
  parts.sort((a, b) => b.w - a.w);
  return parts[0].url;
}

function absolute(u: string, base?: string): string {
  if (/^https?:\/\//i.test(u)) return u;
  if (/^\/\//.test(u)) return "https:" + u;
  try {
    return new URL(u, base).toString();
  } catch {
    return u;
  }
}
