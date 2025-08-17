// app/components/SourceFilter.tsx
"use client";

import { SOURCES } from "@/lib/feeds";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getDomain(url: string) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch {
    return url;
  }
}

function SmallSwitch({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={[
        // kompakt: 20px magas, 36px széles
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        checked ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 dark:focus-visible:ring-white/40",
      ].join(" ")}
    >
      <span
        className={[
          // gomb: 16px, finom árnyék, szép csúszás
          "absolute left-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-semibold shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      >
        {checked ? "✓" : ""}
      </span>
    </button>
  );
}

export default function SourceFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const allIds = useMemo(() => SOURCES.map((s) => s.id), []);
  const fromUrl = searchParams.get("sources");
  const initial = fromUrl ? fromUrl.split(",").filter(Boolean) : allIds;

  const [selected, setSelected] = useState<string[]>(initial);

  // url → state (vissza gomb / megosztott link)
  useEffect(() => {
    const ids = searchParams.get("sources");
    const next = ids ? ids.split(",").filter(Boolean) : allIds;
    setSelected(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // state → url
  useEffect(() => {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    if (selected.length === allIds.length) sp.delete("sources");
    else sp.set("sources", selected.join(","));
    router.replace(`/?${sp.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const setAll = () => setSelected(allIds);
  const setNone = () => setSelected([]);

  const allOn = selected.length === allIds.length;
  const noneOn = selected.length === 0;

  return (
    <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4 sm:p-5">
      {/* fejléc */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="space-y-0.5">
          <h3 className="font-semibold tracking-tight">Szűrők</h3>
          <p className="text-xs text-neutral-500">
            Kapcsold ki-be, mely források jelenjenek meg.
          </p>
        </div>
        <div className="shrink-0 inline-flex items-center gap-2">
          <button
            onClick={setAll}
            className="rounded-full border px-3 py-1 text-xs hover:bg-white dark:hover:bg-white/10"
            title="Minden forrás bekapcsolása"
          >
            Mind
          </button>
          <button
            onClick={setNone}
            className="rounded-full border px-3 py-1 text-xs hover:bg-white dark:hover:bg-white/10"
            title="Összes forrás kikapcsolása"
          >
            Egyik sem
          </button>
        </div>
      </div>

      {/* státusz sor */}
      <div className="mb-2">
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs",
            noneOn
              ? "text-red-600 border-red-200 dark:border-red-900/40"
              : allOn
              ? "text-emerald-700 border-emerald-200 dark:border-emerald-900/40"
              : "text-neutral-600 border-neutral-200 dark:border-white/15",
          ].join(" ")}
        >
          {noneOn
            ? "Nincs kiválasztott forrás"
            : allOn
            ? "Minden forrás bekapcsolva"
            : `Kiválasztva: ${selected.length}/${allIds.length}`}
        </span>
      </div>

      {/* kompakt kártyák – 4 oszlop xl-en */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SOURCES.map((s) => {
          const domain = getDomain(s.url);
          const on = selected.includes(s.id);
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-xl border bg-neutral-50/80 dark:bg-white/5 px-3 py-2 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* betű-avatar (kisebb) */}
                <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-neutral-200 dark:bg-neutral-800 text-[11px] font-semibold">
                  {s.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500 truncate">
                    {domain}
                  </div>
                </div>
              </div>

              {/* csak a kis kapcsoló, nincs külön “pipa” badge */}
              <SmallSwitch checked={on} onToggle={() => toggle(s.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
