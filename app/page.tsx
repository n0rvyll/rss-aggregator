import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-4 text-sm text-neutral-500">Betöltés…</div>}
    >
      <HomeClient />
    </Suspense>
  );
}
