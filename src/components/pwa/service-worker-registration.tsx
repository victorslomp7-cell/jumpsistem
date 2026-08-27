"use client";

import { useEffect } from "react";

/** Registra o service worker (público em /sw.js) uma vez, no client. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Falha ao registrar o service worker:", err);
    });
  }, []);

  return null;
}
