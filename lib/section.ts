// lib/section.ts
/** Nyers rovatnév normalizálása (HU+EN), első betű nagy. */
function mapSection(key: string): string {
  const k = key.toLowerCase().trim().replace(/\s+/g, "-");
  const map: Record<string, string> = {
    // HU
    "belfold": "Belföld", "belpolitika": "Belföld",
    "kulfold": "Külföld", "vilag": "Külföld",
    "gazdasag": "Gazdaság", "penz": "Gazdaság",
    "sport": "Sport", "tech": "Tech",
    "tudomany": "Tudomány", "kultura": "Kultúra",
    "egeszsegugy": "Egészségügy", "egeszseg": "Egészség",
    "eletmod": "Életmód", "velemeny": "Vélemény",
    "video": "Videó", "auto": "Autó", "idojaras": "Időjárás",
    "magyar-hang-plusz": "Plusz",
    // EN / Guardian
    "world": "Világ", "europe": "Európa",
    "us": "USA", "us-news": "USA",
    "uk": "UK", "uk-news": "UK",
    "politics": "Politika", "football": "Foci", "rugby": "Rögbi",
    "business": "Üzlet", "technology": "Tech", "science": "Tudomány",
    "environment": "Környezet", "culture": "Kultúra",
    "film": "Film", "books": "Könyvek",
    "lifestyle": "Életmód", "lifeandstyle": "Életmód",
    "health": "Egészség", "opinion": "Vélemény",
  };
  if (map[k]) return map[k];
  const nice = key.trim().replace(/\s+/g, " ");
  return nice ? nice.charAt(0).toUpperCase() + nice.slice(1) : "";
}

/** URL-ből rovat (fallback, ha nincs kategória) */
export function sectionFromUrl(u?: string): string | undefined {
  try {
    if (!u) return;
    const seg = new URL(u).pathname.split("/").filter(Boolean);
    if (!seg.length) return;
    const s = mapSection(seg[0]);
    return s || undefined;
  } catch { return; }
}

/** RSS item -> rovat: categories / category / dc:subject / tags -> URL fallback */
export function normalizeSection(item: any, link?: string): string | undefined {
  const raw =
    (Array.isArray(item.categories) && item.categories[0]) ||
    item.category ||
    item["dc:subject"] ||
    (Array.isArray(item.tags) && item.tags[0]?.term) ||
    "";

  const s = String(raw || "").trim();
  if (s) {
    const mapped = mapSection(s);
    return mapped || s;
  }
  return sectionFromUrl(link);
}