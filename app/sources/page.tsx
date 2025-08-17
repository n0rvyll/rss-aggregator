// app/sources/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Favicon from "@/app/components/Favicon";

type Source = { id: string; name: string; url: string };

function domainOf(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, "").toUpperCase(); }
  catch { return u.replace(/^https?:\/\//, ""); }
}

function PillToggle({
  label, hint, checked, onChange,
}: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={[
        "flex-1 min-w-[12rem] text-left rounded-xl border px-4 py-3",
        "bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition",
        checked ? "ring-1 ring-emerald-400" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{label}</div>
          {hint && <div className="text-[11px] text-neutral-500 mt-0.5">{hint}</div>}
        </div>
        <span
          className={[
            "inline-flex h-6 w-6 items-center justify-center rounded-full border",
            checked
              ? "bg-emerald-500 border-emerald-600 text-white"
              : "bg-white/60 dark:bg-white/10 border-neutral-300 dark:border-neutral-700 text-neutral-400",
          ].join(" ")}
          aria-hidden
        >
          {checked ? "✓" : "–"}
        </span>
      </div>
    </button>
  );
}

function SourceRow({
  s, checked, onToggle,
}: { s: Source; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left",
        "bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Favicon url={s.url} alt={s.name} size={24} />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{s.name}</div>
          <div className="text-[11px] text-neutral-500 truncate">{domainOf(s.url)}</div>
        </div>
      </div>
      <span
        className={[
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          checked
            ? "bg-emerald-500 border-emerald-600 text-white"
            : "bg-white/60 dark:bg-white/10 border-neutral-300 dark:border-neutral-700 text-neutral-400",
        ].join(" ")}
        aria-hidden
      >
        {checked ? "✓" : "–"}
      </span>
    </button>
  );
}

export default function SourcesPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);

  // kezdeti kiválasztás URL-ből (ha van), különben "minden"
  const initSelected = useMemo(() => {
    const raw = sp.get("sources");
    const arr = (raw ? raw.split(",") : []).filter(Boolean);
    return new Set(arr);
  }, [sp]);

  const [selected, setSelected] = useState<Set<string>>(initSelected);
  const [showSport, setShowSport] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try { return localStorage.getItem("showSport") !== "0"; } catch { return true; }
  });
  const [showTabloid, setShowTabloid] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("showTabloid") === "1"; } catch { return false; }
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await fetch("/api/sources", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        const list: Source[] = Array.isArray(data.sources) ? data.sources : [];
        setSources(list);

        // ha nincs semmi a kiválasztásban, alapból: MIND
        if (selected.size === 0) {
          setSelected(new Set(list.map(x => x.id)));
        } else {
          // ha URL-ben vannak id-k, de az API-ban nincs mind, szűkítsük a meglévőkre
          const onlyExisting = new Set(list.filter(x => selected.has(x.id)).map(x => x.id));
          setSelected(onlyExisting.size ? onlyExisting : new Set(list.map(x => x.id)));
        }
      } catch (e: any) {
        if (alive) setErr(String(e?.message || e) || "Hiba");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []); // csak mountkor

  // lokális preferenciák mentése (sport/bulvár)
  useEffect(() => {
    try { localStorage.setItem("showSport", showSport ? "1" : "0"); } catch {}
  }, [showSport]);
  useEffect(() => {
    try { localStorage.setItem("showTabloid", showTabloid ? "1" : "0"); } catch {}
  }, [showTabloid]);

  const allIds = useMemo(() => sources.map(s => s.id), [sources]);
  const allSelected = selected.size === allIds.length && allIds.length > 0;

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll()   { setSelected(new Set(allIds)); }
  function selectNone()  { setSelected(new Set()); }
  function goBack()      { router.push("/"); }

  function applyAndBack() {
    const ids = Array.from(selected);
    const params = new URLSearchParams();
    if (ids.length > 0 && ids.length !== allIds.length) {
      params.set("sources", ids.join(","));
    }
    // globális sport/bulvár flag-eket is átadjuk, ha szeretnéd később olvasni a főoldalon:
    if (!showSport)  params.set("sport", "off");
    if (showTabloid) params.set("tabloid", "on");

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="mx-auto max-w-[80rem] p-5 md:p-8 space-y-6">
        {/* fejléc sor */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              Szűrők
            </h1>
            <p className="text-sm text-neutral-500">Válaszd ki, mely forrásokat szeretnéd látni.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Összes be/ki */}
            <button
              type="button"
              onClick={allSelected ? selectNone : selectAll}
              className="rounded-lg border px-3 py-2 bg-white/60 dark:bg-white/10 hover:bg-white transition text-sm"
              title={allSelected ? "Összes kikapcsolása" : "Összes bekapcsolása"}
            >
              {allSelected ? "◯" : "●"}
            </button>
            {/* Mentés */}
            <button
              type="button"
              onClick={applyAndBack}
              className="rounded-lg border px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-500 transition text-sm"
              title="Mentés és vissza"
            >
              ✓ Mentés
            </button>
          </div>
        </div>

        {/* globális kapcsolók (mint a képen) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PillToggle
            label="Sport megjelenítése"
            hint="pl. foci"
            checked={showSport}
            onChange={setShowSport}
          />
          <PillToggle
            label="Bulvár megjelenítése"
            hint="napi herr flick"
            checked={showTabloid}
            onChange={setShowTabloid}
          />
        </div>

        {/* lista */}
        {loading && <div className="text-sm">Források betöltése…</div>}
        {err && <div className="text-sm text-red-600">Hiba: {err}</div>}

        {!loading && !err && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((s) => (
              <SourceRow
                key={s.id}
                s={s}
                checked={selected.has(s.id)}
                onToggle={() => toggle(s.id)}
              />
            ))}
          </div>
        )}

        {/* alsó gombsor mobilon kényelmes */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border px-3 py-2 bg-white/60 dark:bg-white/10 hover:bg-white transition text-sm"
            >
              Összes
            </button>
            <button
              type="button"
              onClick={selectNone}
              className="rounded-lg border px-3 py-2 bg-white/60 dark:bg-white/10 hover:bg-white transition text-sm"
            >
              Semmi
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg border px-3 py-2 bg-white/60 dark:bg-white/10 hover:bg-white transition text-sm"
            >
              Mégse
            </button>
            <button
              type="button"
              onClick={applyAndBack}
              className="rounded-lg border px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-500 transition text-sm"
            >
              ✓ Mentés
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}