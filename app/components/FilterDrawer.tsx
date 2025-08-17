"use client";
import { useEffect, useRef } from "react";
import SourceFilter from "./SourceFilter";
export default function FilterDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC zárja
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // kattintás a hátteren zár
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* háttér */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 h-full w-[90%] max-w-sm bg-white dark:bg-neutral-900 border-l shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Szűrők</h2>
          <button
            onClick={onClose}
            className="rounded p-2 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Bezárás"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          <SourceFilter />
          <p className="text-xs text-neutral-500">
            Tipp: az URL megjegyzi a szűrőket.
          </p>
        </div>
      </div>
    </div>
  );
}
