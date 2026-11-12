import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import RegisterSW from "@/components/pwa/RegisterSW";
import { UserProvider } from "@/context/UserContext";
import ChatBot from "@/components/chatbot/ChatBot";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "CINEA | Movie Explorer",
    template: "%s | CINEA",
  },
  description: "Découvrez et organisez vos films préférés en temps réel.",
  applicationName: "CINEA",
  appleWebApp: {
    capable: true,
    title: "CINEA",
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
    <html lang="fr" className="no-scrollbar">
      <body>
        <AuthProvider>
          <UserProvider>
            <ThemeProvider>
              <RegisterSW />
              <Navbar />
              <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300">
                {children}
              </div>
              <ChatBot />
              <Footer />
            </ThemeProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
