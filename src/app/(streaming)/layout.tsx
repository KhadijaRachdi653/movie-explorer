import type { ReactNode } from "react";
import "./streaming.css";
import StreamingProvider from "@/components/recommendations/StreamingProvider";

// Mise en page des pages du Module 6 : /recommendations, /lists, /lists/[id]
// (l'en-tête et la police viennent du layout racine, communs à toute la plateforme)
export default function StreamingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-[var(--marquee)] px-4 py-2 font-semibold text-[#1a1203] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <StreamingProvider>
        <main id="contenu" tabIndex={-1} className="outline-none">{children}</main>
      </StreamingProvider>
    </div>
  );
}
