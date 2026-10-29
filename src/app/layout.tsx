
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Movie Explorer",
  description: "Discover and explore movies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
