import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/pwa/RegisterSW";
import { UserProvider } from "@/context/UserContext";
import ChatBot from "@/components/chatbot/ChatBot";
import SiteHeader from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: {
    default: "Movie Explorer",
    template: "%s | Movie Explorer",
  },
  description:
    "Application pour découvrir, rechercher et organiser vos films préférés.",
  applicationName: "Movie Explorer",
  appleWebApp: {
    capable: true,
    title: "Movie Explorer",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b16",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // "dark" : palette sombre de globals.css (sinon le fond du body est ivoire)
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {/* Police du thème unifié (React 19 la place dans <head>) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- règle prévue pour l'ancien Pages Router */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap"
          precedence="default"
        />
        <UserProvider>
          <RegisterSW />
          <SiteHeader />
          {children}
          <ChatBot />
        </UserProvider>
      </body>
    </html>
  );
}
