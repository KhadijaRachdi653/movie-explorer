import { ThemeProvider } from "@/components/layout/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
//import AuthProvider from "@/components/providers/AuthProvider";
import "@/app/globals.css";

export const metadata = {
  title: "CINEA | Movie Explorer",
  description: "Découvrez et organisez vos films préférés en temps réel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="no-scrollbar">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300">
              {children}
            </div>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
