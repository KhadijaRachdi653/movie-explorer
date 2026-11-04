"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker enregistré avec succès !");
        })
        .catch((error) => {
          console.error("Échec du Service Worker :", error);
        });
    }
  }, []);

  return null;
}
