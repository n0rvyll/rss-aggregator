"use client";

import { useEffect, useMemo, useState } from "react";

function formatHungarian(from: Date, to: Date): string {
  const diffMs = to.getTime() - from.getTime(); // mennyi telt el
  const abs = Math.abs(diffMs);

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (abs < minute) return `${Math.round(abs / 1000)} mp`;
  if (abs < hour) return `${Math.round(abs / minute)} perce`;
  if (abs < day) return `${Math.round(abs / hour)} órája`;
  if (abs < week) return `${Math.round(abs / day)} napja`;
  return `${Math.round(abs / week)} hete`;
}

export default function TimeAgo({ date }: { date: string | number | Date }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const target = useMemo(() => new Date(date), [date]);
  const text = useMemo(() => formatHungarian(target, now), [target, now]);

  return (
    <time dateTime={target.toISOString()} title={target.toLocaleString()}>
      {text}
    </time>
  );
}
