import "server-only";
import { NextResponse } from "next/server";
import Parser from "rss-parser";
import pLimit from "p-limit";
import { SOURCES, Article } from "@/lib/feeds";
import { extractImageFromItem } from "@/lib/extractImage";
import { fetchOgImage } from "@/lib/fetchOgImage";
import { dedupeArticles } from "@/lib/dedupe";
import { isGuardianLink } from "@/lib/guardian";
import { isHangLink } from "@/lib/hang";
import { normalizeSection } from "@/lib/section";

export const runtime = "nodejs";
export const revalidate = 300;

const PER_SOURCE_LIMIT = 25;
const MAX_TOTAL = 250;
const PER_SOURCE_MS = 5000;
const WALL_CLOCK_MS = 5500;

const parser = new Parser({ timeout: 6000 });

function sanitizeXml(xml: string) {
  return xml
    .replace(/&nbsp;/g, " ")
    .replace(/<br>/gi, "<br/>")
    .replace(/<hr>/gi, "<hr/>");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAndParse(url: string, outer?: AbortSignal) {
  const inner = new AbortController();
  let cleanup: (() => void) | undefined;
  if (outer) {
    const l = () => inner.abort();
    outer.addEventListener("abort", l);
    cleanup = () => outer.removeEventListener("abort", l);
  }
  const to = setTimeout(() => inner.abort(), PER_SOURCE_MS);

  try {
    const res = await fetch(url, {
      signal: inner.signal,
      headers: {
        "User-Agent": "rss-aggregator/1.0 (+local)",
        Accept:
          "application/rss+xml, application/atom+xml, text/xml;q=0.9, */*;q=0.1",
      },
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    const looksXml =
      ct.includes("xml") ||
      text.trim().startsWith("<?xml") ||
      text.trim().startsWith("<rss") ||
      text.trim().startsWith("<feed") ||
      text.trim().startsWith("<rdf");
    if (!looksXml) throw new Error(`Nem XML (Content-Type=${ct || "n/a"})`);

    try {
      return await parser.parseString(text);
    } catch {
      const fixed = sanitizeXml(text);
      return await parser.parseString(fixed);
    }
  } finally {
    clearTimeout(to);
    cleanup?.();
  }
}

type SourceStat = {
  id: string;
  name: string;
  url: string;
  ok: boolean;
  items: number;
  error?: string;
};

async function fetchSourceWithStats(
  sourceId: string,
  url: string,
  sourceName: string,
  signal: AbortSignal
): Promise<{ items: Article[]; stat: SourceStat }> {
  try {
    const feed = await fetchAndParse(url, signal);
    const itemsRaw = (feed?.items || []) as any[];

    const items = itemsRaw
      .map((item, i) => {
        const link = item.link || "";
        const publishedAt =
          item.isoDate || item.pubDate || item["dc:date"] || undefined;
        const imageUrl = extractImageFromItem(item, link);
        const description: string | undefined =
          item.contentSnippet || item.summary || undefined;
        const section = normalizeSection(item, link);

        const art: Article = {
          id: `${sourceId}-${i}-${link}`,
          title: item.title || "(cím nélkül)",
          link,
          sourceId,
          sourceName,
          publishedAt: publishedAt
            ? new Date(publishedAt).toISOString()
            : undefined,
          imageUrl,
          description,
        };
        return art;
      })
      .sort((a, b) => {
        const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return db - da;
      })
      .slice(0, PER_SOURCE_LIMIT);

    return {
      items,
      stat: {
        id: sourceId,
        name: sourceName,
        url,
        ok: true,
        items: items.length,
      },
    };
  } catch (e: any) {
    return {
      items: [],
      stat: {
        id: sourceId,
        name: sourceName,
        url,
        ok: false,
        items: 0,
        error: String(e?.message || e),
      },
    };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const sourcesParamRaw = searchParams.get("sources");
    const requested =
      sourcesParamRaw === null
        ? null
        : sourcesParamRaw.split(",").filter(Boolean);
    let selected =
      requested === null
        ? SOURCES
        : SOURCES.filter((s) => requested.includes(s.id));
    if (requested && requested.length > 0 && selected.length === 0)
      selected = SOURCES;

    const wall = new AbortController();
    const wallTimer = setTimeout(() => wall.abort(), WALL_CLOCK_MS);

    const limit = pLimit(6);

    const collected: Article[] = [];
    const stats: SourceStat[] = [];

    const tasks = selected.map((s) =>
      limit(() =>
        fetchSourceWithStats(s.id, s.url, s.name, wall.signal)
          .then((res) => {
            collected.push(...res.items);
            stats.push(res.stat);
          })
          .catch(() => {
            stats.push({
              id: s.id,
              name: s.name,
              url: s.url,
              ok: false,
              items: 0,
              error: "failed",
            });
          })
      )
    );

    await Promise.race([Promise.allSettled(tasks), sleep(WALL_CLOCK_MS)]);
    clearTimeout(wallTimer);

    collected.sort((a, b) => {
      const da = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const db = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return db - da;
    });
    let working = collected.slice(0, MAX_TOTAL);

    const q = (searchParams.get("q") || "").trim().toLowerCase();
    if (q) {
      working = working.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }

    const ogParam = (searchParams.get("og") || "").toLowerCase();
    const wantOg = ogParam === "1" || ogParam === "on" || ogParam === "";

    if (wantOg) {
      const OG_LIMIT = 20;
      const missing = working.filter((a) => !a.imageUrl);
      const prioritized = missing
        .sort((a, b) => {
          const pb = Number(isGuardianLink(b.link) || isHangLink(b.link));
          const pa = Number(isGuardianLink(a.link) || isHangLink(a.link));
          return pb - pa;
        })
        .slice(0, OG_LIMIT);

      if (prioritized.length) {
        const ogs = await Promise.all(
          prioritized.map(async (a) => {
            const ms =
              isGuardianLink(a.link) || isHangLink(a.link) ? 4000 : 1200;
            const img = await fetchOgImage(a.link, ms).catch(() => undefined);
            return { id: a.id, img };
          })
        );
        const map = new Map(
          ogs.filter((o) => o.img).map((o) => [o.id, o.img as string])
        );
        working = working.map((a) =>
          a.imageUrl || !map.get(a.id) ? a : { ...a, imageUrl: map.get(a.id)! }
        );
      }
    }

    const dedupeParam = (searchParams.get("dedupe") || "").toLowerCase();
    const dedupeOff =
      dedupeParam === "off" || dedupeParam === "0" || dedupeParam === "false";
    const simStr = searchParams.get("sim");
    const simVal = simStr !== null ? Number(simStr) : NaN;
    const baseSim =
      Number.isFinite(simVal) && simVal >= 0 && simVal <= 1 ? simVal : 0.9;

    const finalList = dedupeOff ? working : dedupeArticles(working, baseSim);

    if ((searchParams.get("debug") || "") === "1") {
      return NextResponse.json({
        articles: finalList,
        stats,
        counts: {
          selectedSources: selected.length,
          fetchedArticles: collected.length,
          afterLimit: working.length,
          afterDedupe: finalList.length,
          wallMs: WALL_CLOCK_MS,
          perSourceMs: PER_SOURCE_MS,
        },
      });
    }

    return NextResponse.json({ articles: finalList });
  } catch (err) {
    console.error("news route error:", err);
    return NextResponse.json(
      { articles: [], error: "internal" },
      { status: 500 }
    );
  }
}
