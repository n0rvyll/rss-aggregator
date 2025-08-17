// app/components/TimeAgo.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

function fmt(iso?: string): string {
  if (!iso) return "ismeretlen idő";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "ismeretlen idő";
  const diff = Date.now() - t;
  if (diff <= 0) return "épp most";
  const m = Math.floor(diff / 60000);
  if (m <= 0) return "épp most";
  return `${m} perce`;
}

export default function TimeAgo({ iso }: { iso?: string }) {
  const [now, setNow] = useState(Date.now());
  // percre igazított frissítés (szebb “ticking”)
  useEffect(() => {
    const sec = 60 - new Date().getSeconds();
    const first = setTimeout(() => {
      setNow(Date.now());
      const iv = setInterval(() => setNow(Date.now()), 60_000);
      return () => clearInterval(iv);
    }, sec * 1000);
    return () => clearTimeout(first);
  }, []);
  const text = useMemo(() => fmt(iso), [iso, now]);
  return <span>{text}</span>;
}
