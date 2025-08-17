import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Hírgyűjtő",
  description: "Egyszerű, modern RSS hírgyűjtő szűrőkkel és keresővel.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * No-flash téma script: még a React előtt felteszi/leszedi a .dark-ot,
 * és beállítja a color-scheme-et, így nem villan.
 * Fontos: itt nem lehet szintaktikai hiba, különben SEMMI sem fut le.
 */
const noFlash = `
(function () {
  try {
    var choice = localStorage.getItem('theme') || 'system';
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var dark = (choice === 'dark') || (choice === 'system' && mq.matches);
    var root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
    // Ez a sor volt elrontva (colorScheme kettétörve), emiatt az egész script parse errorral leállt.
    root.style.colorScheme = dark ? 'dark' : 'light';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      {/* Alap színek itt, hogy biztos legyen látható a szöveg dark módban is */}
      <body
        className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
