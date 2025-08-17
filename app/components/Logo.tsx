// app/components/Logo.tsx
"use client";

import { useId } from "react";

type Props = {
  size?: number;            // px, default 36
  className?: string;       // extra tailwind/osztályok
  title?: string;           // accessibility
};

export default function Logo({ size = 36, className = "", title = "Hírgyűjtő" }: Props) {
  const gid = useId(); // egyedi gradient id (többszörös példány esetén se ütközzön)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={`g-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />   {/* indigo-500 */}
          <stop offset="100%" stopColor="#A855F7" /> {/* violet-500 */}
        </linearGradient>
        <filter id={`s-${gid}`} x="-10%" y="-10%" width="120%" height="120%">
          {/* enyhe belső árnyék a kártyán */}
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* háttér kártya */}
      <rect
        x="4" y="4" width="40" height="40" rx="12"
        fill={`url(#g-${gid})`}
        filter={`url(#s-${gid})`}
      />

      {/* „aggregátor” kártyasorok (fehér elemek) */}
      {/* felső hosszú sor */}
      <rect x="12" y="14" width="24" height="3.6" rx="1.8" fill="white" opacity="0.98" />
      {/* középső rövidebb sor */}
      <rect x="12" y="20" width="16" height="3.6" rx="1.8" fill="white" opacity="0.95" />
      {/* alsó sor: kis „kép” blokk + szöveg csík */}
      <rect x="12" y="27" width="6"  height="6"   rx="1.6" fill="white" opacity="0.98" />
      <rect x="20" y="28" width="16" height="4"   rx="2"   fill="white" opacity="0.98" />
    </svg>
  );
}
