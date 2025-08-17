"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(Array.from(searchParams.entries()));
      if (q.trim()) sp.set("q", q.trim());
      else sp.delete("q");
      router.replace(`/?${sp.toString()}`, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="rounded-lg border p-4 bg-white/50 dark:bg-white/5 backdrop-blur">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Keresés a címekben és leírásokban…"
        className="w-full bg-transparent outline-none text-base placeholder:text-neutral-400"
      />
    </div>
  );
}
