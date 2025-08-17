"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Favicon from "@/app/components/Favicon";

type Source = { id: string; name: string; url: string };

export default function SourceFilterPopover({
  onClose,
}: {
  onClose?: () => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  // --- betöltés az API-ból ---
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/sources", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setSources(Array.isArray(data?.sources) ? data.sources : []);
        setError(null);
      } catch (e: unknown) {
        if (!alive) return;
        setError((e instanceof Error ? e.message : String(e)) || "Hálózati hiba");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // --- kezdeti választás a query-ből ---
  // null = "minden forrás", Set = kifejezetten kiválasztottak
  const initialSel = useMemo(() => {
    const raw = sp.get("sources");
    if (raw === null) return null;
    const list = raw.split(",").filter(Boolean);
    return new Set(list);
  }, [sp]);

  const [selected, setSelected] = useState<Set<string> | null>(initialSel);

  // ha közben változik az URL (pl. back/forward), kövesd
  useEffect(() => setSelected(initialSel), [initialSel]);

  const allIds = useMemo(() => sources.map((s) => s.id), [sources]);
  const isAll = selected === null || (selected?.size || 0) === sources.length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      if (prev === null) {
        // eddig "minden": készíts teljes halmazt és vedd ki az adottat
        const next = new Set(allIds);
        next.delete(id);
        return next;
      }
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      // ha végül minden benne van → vissza null (tisztább URL)
      if (next.size === sources.length) return null;
      return next;
    });
  }

  function selectAll() {
    setSelected(null); // tiszta URL
  }
  function selectNone() {
    setSelected(new Set()); // üres halmaz
  }

  function applyAndClose() {
    const params = new URLSearchParams(sp.toString());
    if (selected === null || (selected?.size || 0) === sources.length) {
      params.delete("sources"); // minden → param törlése
    } else {
      params.set("sources", Array.from(selected).sort().join(","));
    }
    router.push(`/?${params.toString()}`, { scroll: false });
    onClose?.();
  }

  return (
    <div
      className="absolute right-0 top-full mt-2 z-50 w-[min(95vw,980px)] max-h-[70vh] overflow-hidden rounded-xl border bg-white dark:bg-neutral-900 shadow-2xl"
      role="dialog"
      aria-label="Forrás szűrők"
    >
      {/* Fejléc + akciók */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
        <div>
          <div className="text-sm font-semibold">Szűrők</div>
          <div className="text-xs text-neutral-500">
            {loading
              ? "Betöltés…"
              : error
              ? "Hiba történt a forráslista betöltésekor"
              : isAll
              ? "Minden forrás megjelenik"
              : `${selected?.size || 0} kiválasztva / ${sources.length}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
            title="Összes kijelölése"
          >
            Összes
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10"
            title="Kijelölések törlése"
          >
            Semmi
          </button>
          <button
            type="button"
            onClick={applyAndClose}
            className="rounded-lg border px-3 py-1.5 text-sm bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Mentés
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white dark:hover:bg-white/10"
          >
            Bezár
          </button>
        </div>
      </div>

      {/* Tartalom – 3 oszlop, görgethető */}
      <div className="p-3 overflow-auto max-h-[60vh]">
        {error && (
          <div className="p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border bg-white/60 dark:bg-white/5 p-3 h-[68px]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((s) => {
              const checked =
                selected === null ? true : (selected as Set<string>).has(s.id);
              const url = new URL(s.url).hostname.replace(/^www\./, "");
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleOne(s.id)}
                  className={[
                    "flex items-center justify-between gap-3 w-full rounded-xl border px-3 py-2 text-left",
                    "bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10",
                  ].join(" ")}
                  aria-pressed={checked}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Favicon url={s.url} alt={s.name} size={20} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 uppercase truncate">
                        {url}
                      </div>
                    </div>
                  </div>

                  {/* switch */}
                  <span
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
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
