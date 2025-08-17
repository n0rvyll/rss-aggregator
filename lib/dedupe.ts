// lib/dedupe.ts
import type { Article } from "@/lib/feeds";

// minimál stopwords (HU + általános)
const STOP = new Set([
  "a","az","és","meg","vagy","is","hogy","már","még","mint","de","ha","mert","nem","se","sem",
  "egy","egyik","másik","lesz","volt","van","vannak","lenne","kell","sőt","közben","után","előtt",
  "között","szerint","miatt","tovább","videó","fotó","friss","breaking"
]);

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”„"']/g, " ")
    .replace(/[(){}\[\]]/g, " ")
    .replace(/[-\u2010\u2011\u2013\u2014]/g, " ")
    .replace(/[.,:;!?/\\|+*=<>@#%^&~`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(title: string): string[] {
  const n = norm(title);
  if (!n) return [];
  return n.split(" ").filter(w => w.length >= 4 && !STOP.has(w));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  // mindig a kisebbet iteráljuk
  const [S, T] = a.size <= b.size ? [a, b] : [b, a];
  for (const w of S) if (T.has(w)) inter++;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function prefer(a: Article, b: Article): Article {
  const ai = !!a.imageUrl, bi = !!b.imageUrl;
  if (ai !== bi) return ai ? a : b;
  const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
  const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
  if (ta !== tb) return ta > tb ? a : b;
  return (a.title || "").length >= (b.title || "").length ? a : b;
}

/**
 * Gyors, konzervatív dedupe:
 * - token blokkosítás (csak azokat hasonlítjuk, amelyek minimum 3 tokent osztanak)
 * - csak Jaccard (nincs Levenshtein)
 * - base: 0..1 (magasabb = szigorúbb)
 */
export function dedupeArticles(items: Article[], base = 0.90): Article[] {
  if (items.length <= 1) return items.slice();

  // idő szerint csökkenő (újabb előre)
  const list = items.slice().sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });

  // előkészítés: token készletek
  const toks: Set<string>[] = list.map(a => new Set(tokenize(a.title || "")));

  const kept: Article[] = [];
  const keptToks: Set<string>[] = [];

  for (let i = 0; i < list.length; i++) {
    const ti = toks[i];
    // nagyon kevés érdemi token → ne deduplikáljunk agresszíven
    if (ti.size < 4) {
      kept.push(list[i]); keptToks.push(ti);
      continue;
    }

    let merged = false;

    // gyors blokk: csak azok a már megtartottak, ahol legalább 3 közös token
    for (let k = 0; k < kept.length; k++) {
      const tk = keptToks[k];

      // közös tokenek gyors becslése (max 3-ig számolunk)
      let shared = 0;
      for (const w of ti) {
        if (tk.has(w)) {
          shared++;
          if (shared >= 3) break;
        }
      }
      if (shared < 3) continue;

      const sim = jaccard(ti, tk);
      // Jaccard-küszöb (pl. base=0.90 → 0.78)
      const jMin = Math.max(0.60, base - 0.12);
      if (sim >= jMin) {
        // ugyanarra a hírre mutat → válasszunk egyet
        const winner = prefer(kept[k], list[i]);
        kept[k] = winner;
        // frissítsük a tok-készletet is, hogy a preferált maradjon
        keptToks[k] = winner === list[i] ? ti : tk;
        merged = true;
        break;
      }
    }

    if (!merged) {
      kept.push(list[i]);
      keptToks.push(ti);
    }
  }

  return kept;
}
