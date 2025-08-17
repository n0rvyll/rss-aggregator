// app/sources/page.tsx (Server Component)
import { Suspense } from "react";
import SourcesClient from "./SourcesClient";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-4 text-sm text-neutral-500">Betöltés…</div>}
    >
      <SourcesClient />
    </Suspense>
  );
}
