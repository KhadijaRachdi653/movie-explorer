import type { ReactNode } from "react";
import "./streaming.css";
import Header from "@/components/recommendations/Header";
import StreamingProvider from "@/components/recommendations/StreamingProvider";

// Mise en page des pages du Module 6 : /recommendations, /lists, /lists/[id]
export default function StreamingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="stream">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* React 19 place cette feuille dans <head> (precedence) ; règle ESLint prévue pour l'ancien Pages Router */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap"
        precedence="default"
      />
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-[var(--marquee)] px-4 py-2 font-semibold text-[#1a1203] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <StreamingProvider>
        <Header />
        <main id="contenu" tabIndex={-1} className="pb-16 outline-none sm:pb-0">
          {children}
        </main>
      </StreamingProvider>
    </div>
  );
}
