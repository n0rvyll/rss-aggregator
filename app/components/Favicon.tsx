"use client";

import React, { useMemo } from "react";

/** Biztonságos origin kinyerés. Csak http/https és teljes URL esetén tér vissza. */
function safeOrigin(u?: string | null): string | null {
  if (!u || typeof u !== "string") return null;
  if (!/^https?:\/\//i.test(u)) return null;
  try {
    const url = new URL(u);
    return url.origin;
  } catch {
    return null;
  }
}

/** Ha nincs favicon vagy hibázik, egy kis placeholder négyzetet rajzolunk. */
export default function Favicon({
  url,
  size = 16,
  alt = "favicon",
  className = "",
}: {
  url?: string | null;
  size?: number;
  alt?: string;
  className?: string;
}) {
  const origin = useMemo(() => safeOrigin(url), [url]);

  if (!origin) {
    const letter = (alt?.trim()?.[0] || "•").toUpperCase();
    return (
      <span
        className={["inline-flex items-center justify-center rounded-sm bg-neutral-200 text-neutral-600", className].join(" ")}
        style={{ width: size, height: size, fontSize: Math.max(10, Math.floor(size * 0.7)) }}
        aria-hidden
        title={alt}
      >
        {letter}
      </span>
    );
  }

  // Egyszerű favicon-konvenció (ha nem létezik, az onError elrejti az img-et)
  const src = `${origin}/favicon.ico`;

  return (
    // sima <img> – nincs next/image domain-whitelist mizéria
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      className={["inline-block rounded-sm", className].join(" ")}
      onError={(e) => {
        // ha nincs favicon, csendben eltüntetjük az img-et, hagyjuk a layoutot
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
