// lib/feeds.ts
export type FeedSource = { id: string; name: string; url: string };

export const SOURCES: FeedSource[] = [
  { id: "telex", name: "Telex", url: "https://telex.hu/rss" },
  { id: "444", name: "444", url: "https://444.hu/feed" },
  { id: "hvg", name: "HVG", url: "https://hvg.hu/rss" },
  {
    id: "gamestar",
    name: "Gamestar",
    url: "https://www.gsplus.hu/site/rss/rss.xml",
  },
  { id: "24", name: "24.hu", url: "https://24.hu/rss" },
  { id: "forbes", name: "Forbes", url: "https://forbes.hu/rss" },
  {
    id: "magyarnarancs",
    name: "Magyar Narancs",
    url: "https://magyarnarancs.hu/rss",
  },
  { id: "mfor", name: "Menedzsment Fórum", url: "https://mfor.hu/rss" },
  { id: "quibit", name: "Quibit", url: "https://qubit.hu/feed" },
  {
    id: "szabadeuropa",
    name: "Szabad Európa",
    url: "https://www.szabadeuropa.hu/api/zppymql-vomx-tpe_jtmr",
  },
  { id: "transtelex", name: "Transtelex", url: "https://transtelex.ro/rss" },
  { id: "g7", name: "G7", url: "https://g7.hu/rss" },
  { id: "lakmusz", name: "Lakmusz", url: "https://lakmusz.hu/rss" },
  { id: "media1", name: "Média1", url: "https://media1.hu/rss" },
  { id: "atlatszo", name: "Átlátszó", url: "atlatszo.hu/feed/" },
  { id: "merce", name: "Mérce", url: "https://merce.hu/rss" },
  { id: "rtl", name: "RTL", url: "https://rss.rtl.hu/" },
  {
    id: "theguardian",
    name: "The Guardian",
    url: "https://www.theguardian.com/international/rss",
  },
  {
    id: "jogaszvilag",
    name: "Jogászvilág",
    url: "https://jogaszvilag.hu/feed/",
  },
  { id: "ignhu", name: "IGN Hungary", url: "https://hu.ign.com/feed.xml" },

  {
    id: "portfolio",
    name: "Portfolio",
    url: "https://www.portfolio.hu/rss/gazdasag.xml",
  },

  {
    id: "hwsw",
    name: "HWSW",
    url: "https://www.hwsw.hu/feed",
  },
];

export type Article = {
  id: string;
  title: string;
  link: string;
  sourceId: string;
  sourceName: string;
  publishedAt?: string;
  imageUrl?: string;
  description?: string;
};
