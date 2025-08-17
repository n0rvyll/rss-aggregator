// app/HomeClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "./components/SearchBar";
import SourceFilterPopover from "./components/SourceFilterPopover";
import SmartImage from "./components/SmartImage";
import Logo from "@/app/components/Logo";
import Favicon from "@/app/components/Favicon";
import TimeAgo from "./components/TimeAgo";

/* --------------------------- Típusok --------------------------- */
type Article = {
  id: string;
  title: string;
  link: string;
  sourceId: string;
  sourceName: string;
  publishedAt?: string;
  imageUrl?: string;
  description?: string;
  section?: string;
};
type TimeWindow = "all" | "1h" | "3h" | "24h";

/* -------- rovat-chipek színei + segédfüggvények -------- */
const SECTION_COLORS: Record<string, string> = {
  Belföld:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
  Külföld:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800",
  Gazdaság:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  Tech: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800",
  Sport:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  Kultúra:
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:border-fuchsia-800",
  Tudomány:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800",
  Egészség:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  Egészségügy:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  Vélemény:
    "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900/20 dark:text-neutral-300 dark:border-neutral-800",
  Világ:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800",
  USA: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
  UK: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
};
function sectionClass(s?: string) {
  return SECTION_COLORS[s || ""] || "bg-white/50 dark:bg-white/10";
}
function cleanHost(u?: string): string {
  try {
    if (!u) return "";
    let urlStr = u;
    const m = urlStr.match(
      /[?&#](?:url|u|target|redirect|r|to|dest|destination)=([^&#]+)/i
    );
    if (m?.[1]) {
      try {
        urlStr = decodeURIComponent(m[1]);
      } catch {}
    }
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function brandFromArticle(a: Article): string {
  return (a.sourceName || "").trim() || cleanHost(a.link);
}
function guessSectionFromUrl(u?: string): string | undefined {
  try {
    if (!u) return undefined;
    const key =
      new URL(u).pathname.split("/").filter(Boolean)[0]?.toLowerCase() || "";
    const hu: Record<string, string> = {
      belfold: "Belföld",
      belpolitika: "Belföld",
      kulfold: "Külföld",
      vilag: "Külföld",
      gazdasag: "Gazdaság",
      penz: "Gazdaság",
      sport: "Sport",
      tech: "Tech",
      tudomany: "Tudomány",
      kultura: "Kultúra",
      egeszsegugy: "Egészségügy",
      egeszseg: "Egészség",
      velemeny: "Vélemény",
    };
    const en: Record<string, string> = {
      world: "Világ",
      europe: "Európa",
      us: "USA",
      "us-news": "USA",
      uk: "UK",
      "uk-news": "UK",
      business: "Üzlet",
      technology: "Tech",
      science: "Tudomány",
      sport: "Sport",
      health: "Egészség",
      opinion: "Vélemény",
    };
    if (hu[key]) return hu[key];
    if (en[key]) return en[key];
    if (!key) return undefined;
    return key.charAt(0).toUpperCase() + key.slice(1);
  } catch {
    return undefined;
  }
}
function isFresh(iso?: string, mins = 30) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && Date.now() - t < mins * 60_000;
}

/* ----------------------- Dátum + névnap ----------------------- */
const HUN_MONTHS = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
];
function formatHungarianDate(d: Date) {
  return `${d.getFullYear()}. ${HUN_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/* ---------------------- Settings tartalom ---------------------- */
function SettingsContent(props: {
  onClose?: () => void;
  theme: "system" | "light" | "dark";
  setTheme: (v: "system" | "light" | "dark") => void;
  dense: boolean;
  setDense: (v: boolean) => void;
  masonry: boolean;
  setMasonry: (v: boolean) => void;
  showSavedOnly: boolean;
  setShowSavedOnly: (v: boolean) => void;
  hideRead: boolean;
  setHideRead: (v: boolean) => void;
  tw: TimeWindow;
  setTw: (v: TimeWindow) => void;
  pollMs: number;
  setPollMs: (v: number) => void;
  markAllVisibleRead: () => void;
  clearReadMarks: () => void;
  resetSettings: () => void;
}) {
  const {
    onClose,
    theme,
    setTheme,
    dense,
    setDense,
    masonry,
    setMasonry,
    showSavedOnly,
    setShowSavedOnly,
    hideRead,
    setHideRead,
    tw,
    setTw,
    pollMs,
    setPollMs,
    markAllVisibleRead,
    clearReadMarks,
    resetSettings,
  } = props;

  const themeBtn = (
    key: "system" | "light" | "dark",
    label: string,
    icon: string
  ) => (
    <button
      type="button"
      onClick={() => setTheme(key)}
      className={[
        "rounded-lg border px-3 py-2 text-sm hover:bg-white dark:hover:bg-white/10",
        theme === key
          ? "bg-white dark:bg-white/10"
          : "bg-white/60 dark:bg-white/5",
      ].join(" ")}
      aria-pressed={theme === key}
      title={`Téma: ${label.toLowerCase()}`}
    >
      <span className="mr-1" aria-hidden>
        {icon}
      </span>
      {label}
    </button>
  );

  const segBtn = (key: TimeWindow, label: string) => (
    <button
      type="button"
      onClick={() => setTw(key)}
      className={[
        "rounded-md border px-2.5 py-1 text-xs",
        tw === key
          ? "bg-white dark:bg-white/10"
          : "bg-white/50 dark:bg-white/5",
      ].join(" ")}
      aria-pressed={tw === key}
    >
      {label}
    </button>
  );

  const toggleRow = (
    label: string,
    checked: boolean,
    onToggle: (v: boolean) => void,
    hint?: string
  ) => (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <div className="text-sm">{label}</div>
        {hint && <div className="text-xs text-neutral-500">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        role="switch"
        aria-checked={checked}
        className={[
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors border",
          checked
            ? "bg-emerald-500/90 border-emerald-600"
            : "bg-white/60 dark:bg-white/10 border-neutral-300 dark:border-neutral-700",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-200 transition-transform",
            checked ? "translate-x-4" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );

  const [sliderSec, setSliderSec] = useState(
    Math.max(15, Math.round(pollMs / 1000))
  );
  useEffect(() => {
    setSliderSec(Math.max(15, Math.round(pollMs / 1000)));
  }, [pollMs]);

  return (
    <div className="p-4">
      <div className="mb-3">
        <div className="text-sm font-medium">Beállítások</div>
        <p className="text-xs text-neutral-500">
          Testreszabás és gyors műveletek.
        </p>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium mb-1.5">Téma</div>
        <div className="grid grid-cols-3 gap-2">
          {themeBtn("system", "Rendszer", "🖥️")}
          {themeBtn("light", "Világos", "☀️")}
          {themeBtn("dark", "Sötét", "🌙")}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium mb-1.5">Nézet</div>
        {toggleRow("Sűrű kártyák", dense, setDense)}
        {toggleRow(
          "Masonry kiosztás",
          masonry,
          setMasonry,
          "Változó magasságú, vízesés-szerű elrendezés"
        )}
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium mb-1.5">Szűrés</div>
        {toggleRow("Csak könyvjelzettek", showSavedOnly, setShowSavedOnly)}
        {toggleRow("Olvasott cikkek elrejtése", hideRead, setHideRead)}
        <div className="mt-2">
          <div className="text-xs text-neutral-500 mb-1">Időablak</div>
          <div className="flex items-center gap-2">
            {segBtn("all", "Mind")}
            {segBtn("1h", "1h")}
            {segBtn("3h", "3h")}
            {segBtn("24h", "24h")}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-medium">Frissítés gyakorisága</div>
          <div className="text-xs text-neutral-500 tabular-nums">
            {sliderSec}s
          </div>
        </div>
        <input
          type="range"
          min={15}
          max={300}
          step={5}
          value={sliderSec}
          onChange={(e) => setSliderSec(Number(e.target.value))}
          onMouseUp={() => setPollMs(sliderSec * 1000)}
          onTouchEnd={() => setPollMs(sliderSec * 1000)}
          className="w-full accent-emerald-600"
          aria-label="Frissítési gyakoriság másodpercben"
        />
        <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
          <span>15s</span>
          <span>5m</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markAllVisibleRead}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
          >
            Láthatók olvasottnak
          </button>
          <button
            type="button"
            onClick={clearReadMarks}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
          >
            Olvasott jelölések törlése
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetSettings}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
            title="Beállítások visszaállítása"
          >
            Alapértelmezés
          </button>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white dark:hover:bg-white/10"
          >
            Bezár
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- SettingsSheet ---------------------- */
function SettingsSheet(props: {
  open: boolean;
  onClose: () => void;
  titleId?: string;
  children: React.ReactNode;
}) {
  const { open, onClose, titleId = "settingsTitle", children } = props;
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      lastFocused.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
  }, [open]);

  useEffect(() => {
    if (mounted && !visible) {
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [mounted, visible]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(
          (el) => !el.hasAttribute("disabled")
        );
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  useEffect(() => {
    if (mounted && drawerRef.current) {
      const t = setTimeout(() => {
        const titleEl = drawerRef.current!.querySelector<HTMLElement>(
          "#" + titleId
        );
        titleEl?.focus?.();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [mounted, titleId]);

  const handleClose = () => {
    onClose();
    const el = lastFocused.current;
    setTimeout(() => el?.focus?.(), 250);
  };

  if (!mounted) return null;

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-[100] bg-black/35 backdrop-blur-sm transition-opacity",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-hidden="true"
        onClick={handleClose}
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          "fixed z-[101] bg-white dark:bg-neutral-900 shadow-xl border",
          "left-0 right-0 bottom-0 rounded-t-2xl",
          "transition-transform duration-200 will-change-transform",
          visible ? "translate-y-0" : "translate-y-full",
          "lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto lg:h-screen lg:w-[420px] lg:rounded-none",
          visible ? "lg:translate-x-0" : "lg:translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 id={titleId} tabIndex={-1} className="text-base font-semibold">
            Beállítások
          </h2>
          <button
            onClick={handleClose}
            className="h-11 w-11 inline-flex items-center justify-center rounded-lg border hover:bg-white dark:hover:bg-white/10"
            aria-label="Bezárás"
          >
            ✕
          </button>
        </div>
        <div className="h-[min(80vh,560px)] overflow-auto lg:h-[calc(100vh-56px)]">
          {children}
        </div>
      </aside>
    </>
  );
}

/* ------------------------------- Oldal ------------------------------- */
export default function HomeClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [dense, setDense] = useState(false);
  const [masonry, setMasonry] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [hideRead, setHideRead] = useState(false);
  const [tw, setTw] = useState<TimeWindow>("all");
  const [pollMs, setPollMs] = useState<number>(60_000);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // init persisted
  useEffect(() => {
    try {
      const t =
        (localStorage.getItem("theme") as "system" | "light" | "dark") ||
        "system";
      setTheme(t);
      setDense(localStorage.getItem("dense") === "1");
      setMasonry(localStorage.getItem("masonry") === "1");
      setShowSavedOnly(localStorage.getItem("savedOnly") === "1");
      setHideRead(localStorage.getItem("hideRead") === "1");
      const twVal = (localStorage.getItem("timeWindow") as TimeWindow) || "all";
      setTw(twVal);
      const maybePoll = Number(localStorage.getItem("pollMs"));
      if (Number.isFinite(maybePoll) && maybePoll >= 15_000)
        setPollMs(maybePoll);
      const r = JSON.parse(localStorage.getItem("readIds") || "[]");
      if (Array.isArray(r)) setReadIds(new Set(r));
      const s = JSON.parse(localStorage.getItem("savedIds") || "[]");
      if (Array.isArray(s)) setSavedIds(new Set(s));
    } catch {}
  }, []);

  // apply theme
  useEffect(() => {
    const root = document.documentElement;
    const sysDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const wantDark = theme === "dark" || (theme === "system" && sysDark);
    root.classList.toggle("dark", wantDark);
    root.style.colorScheme = wantDark ? "dark" : "light";
    root.setAttribute("data-theme", wantDark ? "dark" : "light");
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  // follow system in "system" mode
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = mq.matches;
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
      document.documentElement.setAttribute(
        "data-theme",
        dark ? "dark" : "light"
      );
    };

    apply();

    // Modern API
    mq.addEventListener?.("change", apply);

    // Legacy Safari fallback – típusos, ts-komment nélkül
    (
      mq as unknown as {
        addListener?: (listener: (e: MediaQueryListEvent) => void) => void;
        removeListener?: (listener: (e: MediaQueryListEvent) => void) => void;
      }
    ).addListener?.(apply);

    return () => {
      mq.removeEventListener?.("change", apply);
      (
        mq as unknown as {
          addListener?: (listener: (e: MediaQueryListEvent) => void) => void;
          removeListener?: (listener: (e: MediaQueryListEvent) => void) => void;
        }
      ).removeListener?.(apply);
    };
  }, [theme]);

  /* NAV: dátum + névnap */
  const [todayStr, setTodayStr] = useState("");
  const [nameDay, setNameDay] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    setTodayStr(formatHungarianDate(now));
    const month = now.getMonth() + 1;
    const day = now.getDate();
    (async () => {
      try {
        const res = await fetch(`/api/nameday?month=${month}&day=${day}`, {
          cache: "no-store",
        });
        const j = await res.json().catch(() => ({}));
        setNameDay(j?.name ?? null);
      } catch {
        setNameDay(null);
      }
    })();
  }, []);

  // persist settings
  useEffect(() => {
    try {
      localStorage.setItem("dense", dense ? "1" : "0");
    } catch {}
  }, [dense]);
  useEffect(() => {
    try {
      localStorage.setItem("masonry", masonry ? "1" : "0");
    } catch {}
  }, [masonry]);
  useEffect(() => {
    try {
      localStorage.setItem("savedOnly", showSavedOnly ? "1" : "0");
    } catch {}
  }, [showSavedOnly]);
  useEffect(() => {
    try {
      localStorage.setItem("hideRead", hideRead ? "1" : "0");
    } catch {}
  }, [hideRead]);
  useEffect(() => {
    try {
      localStorage.setItem("timeWindow", tw);
    } catch {}
  }, [tw]);
  useEffect(() => {
    try {
      localStorage.setItem("pollMs", String(pollMs));
    } catch {}
  }, [pollMs]);

  // source popover toggles
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // mobile header hide on scroll
  const [hideHeader, setHideHeader] = useState(false);
  const lastYRef = useRef(0);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    lastYRef.current = window.scrollY;
    const onScroll = () => {
      if (mq.matches) {
        if (hideHeader) setHideHeader(false);
        lastYRef.current = window.scrollY;
        return;
      }
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      const goingDown = delta > 6;
      const goingUp = delta < -6;
      if (goingDown && y > 80) setHideHeader(true);
      else if (goingUp || y < 64) setHideHeader(false);
      lastYRef.current = y;
    };
    const onBpChange = () => {
      if (mq.matches) setHideHeader(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener?.("change", onBpChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener?.("change", onBpChange);
    };
  }, [hideHeader]);

  useEffect(() => {
    if (menuOpen || settingsOpen) setHideHeader(false);
  }, [menuOpen, settingsOpen]);

  // update URL
  function pushWithParam(update: (p: URLSearchParams) => void) {
    const params = new URLSearchParams(sp.toString());
    update(params);
    router.push(`/?${params.toString()}`);
  }

  // query string to backend
  const query = useMemo(() => {
    const params = new URLSearchParams();
    const q = sp.get("q");
    const sources = sp.get("sources");
    const sim = sp.get("sim");
    if (q) params.set("q", q);
    if (sources) params.set("sources", sources);
    if (sim) params.set("sim", sim);
    return params.toString();
  }, [sp]);

  // initial + refresh fetch
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?${query}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const data = res.ok
          ? await res.json().catch(() => ({ articles: [] }))
          : { articles: [] };
        setArticles(Array.isArray(data.articles) ? data.articles : []);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  // polling
  const [pending, setPending] = useState<{
    count: number;
    items: Article[];
  } | null>(null);
  useEffect(() => {
    const check = async () => {
      try {
        if (
          typeof document !== "undefined" &&
          document.visibilityState !== "visible"
        )
          return;
        const res = await fetch(`/api/news?${query}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const data = res.ok
          ? await res.json().catch(() => ({ articles: [] }))
          : { articles: [] };
        const fresh: Article[] = Array.isArray(data.articles)
          ? data.articles
          : [];
        if (!fresh.length) return;
        const currentIds = new Set(articles.map((x) => x.id));
        const newCount = fresh.filter((x) => !currentIds.has(x.id)).length;
        if (newCount > 0) setPending({ count: newCount, items: fresh });
      } catch {}
    };
    const id = window.setInterval(check, pollMs);
    const onVis = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [query, articles, pollMs]);

  const applyPending = () => {
    if (pending?.items) setArticles(pending.items);
    setPending(null);
  };

  // read/save ops
  function markRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem("readIds", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }
  function markAllVisibleRead(list: Article[]) {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const a of list) next.add(a.id);
      try {
        localStorage.setItem("readIds", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }
  function clearReadMarks() {
    setReadIds(new Set());
    try {
      localStorage.setItem("readIds", "[]");
    } catch {}
  }
  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("savedIds", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }

  // visible + filters
  const [visible, setVisible] = useState(24);
  useEffect(() => {
    setVisible(24);
  }, [articles]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const io = new IntersectionObserver(
      (ents) => {
        if (ents[0].isIntersecting)
          setVisible((v) => Math.min(v + 24, articles.length));
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(loadMoreRef.current);
    return () => io.disconnect();
  }, [articles.length]);

  const baseSlice = useMemo(
    () => articles.slice(0, visible),
    [articles, visible]
  );
  const savedFiltered = useMemo(
    () =>
      showSavedOnly ? baseSlice.filter((a) => savedIds.has(a.id)) : baseSlice,
    [baseSlice, showSavedOnly, savedIds]
  );
  const timeFiltered = useMemo(() => {
    if (tw === "all") return savedFiltered;
    const now = Date.now();
    const lim = tw === "1h" ? 60 : tw === "3h" ? 180 : 1440;
    return savedFiltered.filter((a) => {
      if (!a.publishedAt) return false;
      const t = new Date(a.publishedAt).getTime();
      return Number.isFinite(t) && now - t <= lim * 60_000;
    });
  }, [savedFiltered, tw]);
  const finalList = useMemo(
    () =>
      hideRead ? timeFiltered.filter((a) => !readIds.has(a.id)) : timeFiltered,
    [timeFiltered, hideRead, readIds]
  );

  // UI bits
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  }
  async function shareArticle(a: Article) {
    try {
      if (navigator.share)
        await navigator.share({ title: a.title, url: a.link });
      else {
        await navigator.clipboard.writeText(a.link);
        showToast("Link vágólapra másolva");
      }
    } catch {}
  }
  function resetFilters() {
    const sp = new URLSearchParams();
    router.push(`/?${sp.toString()}`);
  }
  function resetSettings() {
    setDense(false);
    setMasonry(false);
    setShowSavedOnly(false);
    setHideRead(false);
    setTw("all");
    setPollMs(60_000);
  }

  function Card({ a }: { a: Article }) {
    const brand = brandFromArticle(a);
    const section = a.section || guessSectionFromUrl(a.link);
    return (
      <article
        className={`group overflow-hidden rounded-2xl border bg-white/70 dark:bg-white/5 hover:shadow-xl transition ${
          readIds.has(a.id) ? "opacity-75" : ""
        }`}
      >
        <a
          href={a.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          onClick={() => markRead(a.id)}
        >
          <div className="relative aspect-[3/2] bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <SmartImage src={a.imageUrl} alt={a.title} />
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleSave(a.id);
                showToast(
                  savedIds.has(a.id)
                    ? "Eltávolítva a könyvjelzőkből"
                    : "Hozzáadva a könyvjelzőkhöz"
                );
              }}
              className="absolute top-2 right-2 rounded-full border bg-white/90 dark:bg-neutral-900/80 backdrop-blur px-2 py-1 text-xs hover:bg-white"
              aria-label="Könyvjelző"
              type="button"
            >
              {savedIds.has(a.id) ? "★" : "☆"}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                shareArticle(a);
              }}
              className="absolute top-2 left-2 rounded-full border bg-white/90 dark:bg-neutral-900/80 backdrop-blur px-2 py-1 text-xs hover:bg-white"
              aria-label="Cikk megosztása"
              title="Megosztás"
              type="button"
            >
              ↗
            </button>
          </div>

          <div
            className={["space-y-2.5", dense ? "p-4 space-y-2" : "p-5"].join(
              " "
            )}
          >
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Favicon url={a.link} alt={a.sourceName} size={16} />
              <span className="truncate max-w-[10rem]">{brand}</span>
              {section && (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 ${sectionClass(
                    section
                  )}`}
                >
                  {section}
                </span>
              )}
              <span aria-hidden>•</span>
              <span suppressHydrationWarning>
                {a.publishedAt ? <TimeAgo date={a.publishedAt} /> : null}
              </span>
              {isFresh(a.publishedAt) && (
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] tracking-wide bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
                  Új
                </span>
              )}
            </div>
            <h2
              className={[
                "font-semibold leading-snug group-hover:underline line-clamp-3 sm:line-clamp-3",
                dense ? "text-[0.95rem] md:text-base" : "text-lg md:text-xl",
              ].join(" ")}
            >
              {a.title}
            </h2>
          </div>
        </a>
      </article>
    );
  }

  /* Forrásválasztó */
  const sourceMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of articles) {
      const id = a.sourceId || cleanHost(a.link) || a.sourceName;
      const name =
        a.sourceName || cleanHost(a.link) || a.sourceId || "Ismeretlen";
      if (id && name && !m.has(id)) m.set(id, name);
    }
    return new Map(
      [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "hu"))
    );
  }, [articles]);
  const sourceOptions = useMemo(
    () => Array.from(sourceMap, ([value, label]) => ({ value, label })),
    [sourceMap]
  );
  const sourcesParam = sp.get("sources") || "";
  const selectedMobileSource =
    !sourcesParam || sourcesParam.includes(",")
      ? "all"
      : sourceOptions.some((o) => o.value === sourcesParam)
      ? sourcesParam
      : "all";

  function setSourcesParam(val: string) {
    pushWithParam((p) => {
      if (!val || val === "all") p.delete("sources");
      else p.set("sources", val);
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="mx-auto max-w-[90rem] p-5 md:p-8 space-y-7">
        {/* Sticky: fej + nav */}
        <div
          className={[
            "sticky top-0 z-40 -mx-5 md:-mx-8 px-5 md:px-8 py-3",
            "backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-neutral-900/70 border-b",
            "transition-transform duration-200 will-change-transform",
            hideHeader ? "-translate-y-full sm:translate-y-0" : "translate-y-0",
          ].join(" ")}
        >
          <header className="flex items-start gap-3">
            <Logo size={40} />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                Hírgyűjtő
              </h1>
              <p className="text-sm text-neutral-500">
                Fix RSS-források, szűrés és keresés — modern, gyors felület.
              </p>
            </div>
          </header>

          <nav className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <svg
                aria-hidden
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="flex-none"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  className="stroke-current"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 2v4M16 2v4M3 10h18"
                  className="stroke-current"
                  strokeWidth="1.5"
                />
              </svg>
              <span suppressHydrationWarning>{todayStr}</span>
              <span aria-hidden>•</span>
              <span className="hidden sm:inline">Névnap:</span>
              <strong className="font-medium">{nameDay ?? "—"}</strong>
            </div>

            <div className="flex items-center gap-2">
              <div className="search-compact w-48 sm:w-64">
                <SearchBar />
              </div>

              {/* Mobil: select */}
              <label htmlFor="sourceSelect" className="sr-only">
                Források kiválasztása
              </label>
              <select
                id="sourceSelect"
                value={selectedMobileSource}
                onChange={(e) => setSourcesParam(e.target.value)}
                className="sm:hidden min-h-11 text-base rounded-lg border px-3 bg-white/80 dark:bg-white/10"
                aria-label="Források kiválasztása"
              >
                <option value="all">Összes forrás</option>
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Desktop: popover */}
              <div className="relative hidden sm:block" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                    setSettingsOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 bg-white/60 dark:bg-white/10 hover:bg-white transition text-sm"
                  aria-expanded={menuOpen}
                  aria-haspopup="dialog"
                  type="button"
                >
                  ☰ <span className="hidden sm:inline">Források</span>
                </button>
                {menuOpen && (
                  <SourceFilterPopover onClose={() => setMenuOpen(false)} />
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(true);
                  setMenuOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 bg-white/60 dark:bg-white/10 hover:bg:white transition text-sm"
                aria-expanded={settingsOpen}
                aria-haspopup="dialog"
                title="Beállítások"
                type="button"
              >
                ⚙️ <span className="hidden sm:inline">Beállítások</span>
              </button>
            </div>
          </nav>
        </div>

        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        >
          <SettingsContent
            onClose={() => setSettingsOpen(false)}
            theme={theme}
            setTheme={setTheme}
            dense={dense}
            setDense={setDense}
            masonry={masonry}
            setMasonry={setMasonry}
            showSavedOnly={showSavedOnly}
            setShowSavedOnly={setShowSavedOnly}
            hideRead={hideRead}
            setHideRead={setHideRead}
            tw={tw}
            setTw={setTw}
            pollMs={pollMs}
            setPollMs={setPollMs}
            markAllVisibleRead={() => markAllVisibleRead(finalList)}
            clearReadMarks={clearReadMarks}
            resetSettings={resetSettings}
          />
        </SettingsSheet>

        {/* Csontváz */}
        {loading && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border bg-white/70 dark:bg-white/5"
              >
                <div className="animate-pulse">
                  <div className="aspect-[3/2] bg-neutral-200 dark:bg-neutral-800" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-40 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && finalList.length === 0 && (
          <div className="p-8 border rounded-xl bg-white/50 dark:bg:white/5 text-center space-y-3">
            <div>Nincs találat a beállításokkal/kereséssel.</div>
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
              <button
                onClick={resetFilters}
                className="rounded-lg border px-3 py-1.5 hover:bg-white dark:hover:bg-white/10"
              >
                Szűrők visszaállítása
              </button>
            </div>
          </div>
        )}

        {/* Kártyák */}
        {!loading && finalList.length > 0 && (
          <>
            <div
              className={[
                "grid gap-6",
                "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              ].join(" ")}
            >
              {finalList.map((a) => (
                <Card key={a.id} a={a} />
              ))}
            </div>
            {visible < articles.length && (
              <div ref={loadMoreRef} className="h-10" />
            )}
          </>
        )}

        <footer className="py-8 text-center text-xs text-neutral-500">
          {/* lábjegyzet */}
        </footer>
      </div>

      {/* új cikk értesítő */}
      <div
        className={[
          "fixed left-4 bottom-4 z-50 transition-all",
          pending
            ? "opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 translate-y-2",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {pending && (
          <div className="flex items-center gap-3 rounded-xl border bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-4 py-3 shadow-lg">
            <span
              className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
              aria-hidden
            />
            <span className="text-sm">
              <strong>{pending.count}</strong> új cikk jelent meg
            </span>
            <button
              onClick={applyPending}
              className="ml-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-white dark:hover:bg-white/10"
            >
              Frissítés
            </button>
            <button
              onClick={() => setPending(null)}
              className="ml-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              aria-label="Értesítés elrejtése"
            >
              Bezár
            </button>
          </div>
        )}
      </div>

      {/* Vissza a tetejére */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={[
          "fixed right-4 bottom-20 z-40 rounded-full border bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-3 py-2 text-sm shadow transition",
          showTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 pointer-events-none translate-y-2",
        ].join(" ")}
        aria-label="Vissza a tetejére"
      >
        ↑ Tetejére
      </button>

      {/* Toast */}
      <div
        className={[
          "fixed left-1/2 -translate-x-1/2 bottom-6 z-50 transition-all",
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 pointer-events-none translate-y-2",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <div className="rounded-xl border bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-4 py-2 shadow">
            <span className="text-sm">{toast}</span>
          </div>
        )}
      </div>

      {/* Globális apróságok */}
      <style jsx global>{`
        .search-compact input[type="search"],
        .search-compact [role="searchbox"],
        .search-compact input {
          height: 34px !important;
          padding-top: 0.25rem !important;
          padding-bottom: 0.25rem !important;
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
        }
      `}</style>
    </main>
  );
}
