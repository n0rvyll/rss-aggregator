// app/components/SmartImage.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { isHangLink, hangCandidatesFromUrl } from "@/lib/hang";

type Props = {
  src?: string;
  alt: string;
  sizes?: string;
  className?: string;
};

function wpGenericCandidates(u: string): string[] {
  // általános WP fallback (nem csak hang.hu): /wp-content/uploads/.../file.ext → tipikus méretek
  try {
    const url = new URL(u);
    if (!/\/wp-content\/uploads\//i.test(url.pathname)) return [];
    const m = url.pathname.match(/^(.*?)(\.(jpe?g|png|webp|avif))$/i);
    if (!m) return [];
    const stem = m[1];
    const ext = m[2];
    return [
      `${stem}-1200x630${ext}`,
      `${stem}-1200x675${ext}`,
      `${stem}-1024x576${ext}`,
      `${stem}-800x450${ext}`,
    ];
  } catch {
    return [];
  }
}

export default function SmartImage({ src, alt, sizes, className }: Props) {
  // jelöltek összeállítása
  const candidates = useMemo(() => {
    if (!src) return [];
    const list: string[] = [];

    // 1) Magyar Hang: speciális jelöltek
    if (isHangLink(src)) {
      for (const c of hangCandidatesFromUrl(src)) if (!list.includes(c)) list.push(c);
    } else {
      list.push(src);
    }

    // 2) Általános WP-méretek (ha alkalmazható) – csak akkor, ha még nincs a listában
    for (const cand of [...list]) {
      for (const v of wpGenericCandidates(cand)) {
        if (!list.includes(v)) list.push(v);
      }
    }

    return list;
  }, [src]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [src]);

  const current = candidates[idx];

  if (!current) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
        Nincs kép
      </div>
    );
  }

  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      onError={() => setIdx((i) => i + 1)}
      className={["object-cover", className].filter(Boolean).join(" ")}
    />
  );
}
