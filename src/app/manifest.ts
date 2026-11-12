import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movie Explorer",
    short_name: "MovieX",
    description:
      "Application PWA pour découvrir, rechercher et organiser vos films préférés.",
    id: "tn.esprit.movieexplorer",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#0d6efd",
    lang: "fr",
    categories: ["entertainment", "movies"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
