"use client";

import { useEffect, useState } from "react";

/** Egyszerű téma-váltó gomb (light / dark / system) */
export default function ThemeToggle() {
  const [choice, setChoice] = useState<string>("system");

  useEffect(() => {
    // induláskor beolvassuk
    const saved = localStorage.getItem("theme") || "system";
    setChoice(saved);
  }, []);

  function applyTheme(next: string) {
    localStorage.setItem("theme", next);
    setChoice(next);

    const dark =
      next === "dark" ||
      (next === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = dark ? "dark" : "light";
    root.setAttribute("data-theme", dark ? "dark" : "light");
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border px-1.5 py-1 bg-white/70 dark:bg-white/10">
      {["light", "dark", "system"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => applyTheme(opt)}
          className={
            "text-xs px-2 py-1 rounded-md " +
            (choice === opt
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "hover:bg-black/5 dark:hover:bg-white/10")
          }
          aria-pressed={choice === opt}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
