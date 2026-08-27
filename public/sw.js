/**
 * Service worker escrito à mão (sem Serwist/Workbox) — a versão estável do
 * @serwist/next ainda depende do @serwist/webpack-plugin, e o Next.js 16 já
 * usa Turbopack até no build de produção, então não tem garantia de que o
 * plugin rode. Estratégia simples e explícita em vez de uma dependência
 * "preview"/instável.
 *
 * Bump o CACHE_VERSION quando fizer uma mudança que precise invalidar o
 * cache antigo (ex.: mudança grande de layout/assets).
 */
const CACHE_VERSION = "jump-frota-v1";
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith("jump-frota-") && key !== RUNTIME_CACHE).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só GET — nunca cachear/interceptar mutações (POST/Server Actions). Se
  // estiver offline, essas falham naturalmente e o app trata isso com a
  // fila local (ver src/lib/offline/).
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Assets estáticos do Next (imutáveis, hash no nome) — cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navegação (páginas HTML) — stale-while-revalidate: mostra o que tem em
  // cache na hora (rápido, funciona offline) e atualiza em segundo plano.
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkFetch; // atualiza em segundo plano, não espera
    return cached;
  }

  const network = await networkFetch;
  return network ?? new Response("Offline e sem versão em cache desta página.", { status: 503 });
}

// ---- Web Push (Fase 7) ----

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Jump Frota", body: event.data.text() };
  }

  const title = payload.title ?? "Jump Frota";
  const options = {
    body: payload.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url ?? "/alerts" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/alerts";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clientsList.find((c) => new URL(c.url).pathname === targetUrl);
      if (existing) {
        existing.focus();
        return;
      }
      await self.clients.openWindow(targetUrl);
    })()
  );
});
