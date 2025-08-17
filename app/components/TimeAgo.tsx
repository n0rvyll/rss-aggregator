"use client";

import { useEffect, useMemo, useState } from "react";

function formatRelative(from: Date, to: Date): string {
  const diffMs = from.getTime() - to.getTime();
  const rtf = new Intl.RelativeTimeFormat("hu", { numeric: "auto" });

  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (abs < minute) return rtf.format(Math.round(diffMs / 1000), "second");
  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (abs < week) return rtf.format(Math.round(diffMs / day), "day");
  return rtf.format(Math.round(diffMs / week), "week");
}

export default function TimeAgo({ date }: { date: string | number | Date }) {
  const [now, setNow] = useState(() => new Date());

  // Frissítsük percenként, hogy a relatív idő változzon
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Normalizált dátum
  const target = useMemo(() => new Date(date), [date]);

  // A szöveget a target és a now alapján számoljuk
  const text = useMemo(() => formatRelative(target, now), [target, now]);

  return (
    <time dateTime={target.toISOString()} title={target.toLocaleString()}>
      {text}
    </time>
  );
}
