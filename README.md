# Hírgyűjtő · Mobile-first RSS hírolvasó

[![Next.js](https://img.shields.io/badge/Next.js-14+-000?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com/)

Mobilra optimalizált hírolvasó Next.js-ben. Fix RSS-források, gyors szűrés/keresés, **natív mobil forrásválasztás**, **automatikusan eltűnő sticky fejléc** lefelé görgetésnél, **Beállítások** mobilon bottom sheetként, desktopon drawerben.

---

## ✨ Fő funkciók

- **Mobil header auto-hide**: lefelé görgetve eltűnik, felfelé azonnal visszaugrik.
- **Források kiválasztása**: mobilon natív `<select>`, desktopon popover.
- **Beállítások sheet**: bottom sheet (mobil) / jobb oldali drawer (desktop), fókuszcsapda és ESC-zárás.
- **Könyvjelzők + Olvasott jelölés**: `localStorage`-ban tartósítva.
- **Időablak szűrők**: Mind / 1h / 3h / 24h.
- **Polling új cikkekre**: háttérben figyel, „Frissítés” toasthoz hasonló értesítés.
- **Infinite scroll**: `IntersectionObserver`-rel.
- **Téma**: rendszer / világos / sötét (OS váltást is követi).
- **Hydration-safe időkezelés**: a relatív idő SSR/CSR eltérés okozta hibák minimalizálása.

---

## 🚀 Gyors indítás

### Követelmények

- Node 18+ (ajánlott 20)
- pnpm / npm / yarn

### Telepítés és futtatás

```bash
# csomagok
npm i

# fejlesztői szerver
npm dev  # http://localhost:3000

# build + start
npm build
npm start
```
