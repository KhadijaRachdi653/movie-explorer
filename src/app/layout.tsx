import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/pwa/RegisterSW";
import { UserProvider } from "@/context/UserContext";

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
  themeColor: "#0d6efd",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <UserProvider>
          <RegisterSW />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
