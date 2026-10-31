// Gerado no build. Versão 645c7eb1e43f
const CACHE = "ba-baby-645c7eb1e43f";
const TILES = "ba-baby-tiles";
const ASSETS = ["./","./assets/index-BFp-rcww.js","./assets/caveat-latin-600-normal-DUjB8dgm.woff","./assets/caveat-latin-600-normal-zlTlWIYU.woff2","./assets/dancing-script-latin-700-normal-CX8AaSVl.woff2","./assets/dancing-script-latin-700-normal-LI5MgW9m.woff","./assets/index-DfQS1Lz0.css","./assets/poppins-latin-400-normal-BOb3E3N0.woff","./assets/poppins-latin-400-normal-cpxAROuN.woff2","./assets/poppins-latin-600-normal-BJdTmd5m.woff","./assets/poppins-latin-600-normal-zEkxB9Mr.woff2","./assets/poppins-latin-700-normal-BVuQR_eA.woff","./assets/poppins-latin-700-normal-Qrb0O0WB.woff2","./assets/poppins-latin-800-normal-Bd8-pIP1.woff2","./assets/poppins-latin-800-normal-YoItoZZV.woff","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ba-baby-") && k !== CACHE && k !== TILES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trimTiles(cache) {
  const keys = await cache.keys();
  if (keys.length > 1500) await Promise.all(keys.slice(0, keys.length - 1200).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // App: do cache primeiro (funciona sem internet).
    event.respondWith(
      caches.match(request, { ignoreSearch: true, ignoreVary: true })
        .then((hit) => hit || (request.mode === "navigate" ? caches.match("./", { ignoreSearch: true, ignoreVary: true }) : undefined))
        .then((hit) => hit || fetch(request)),
    );
    return;
  }

  if (url.hostname.endsWith("basemaps.cartocdn.com")) {
    // Mapa: rede primeiro, cache como reserva para quando estiver sem sinal.
    event.respondWith(
      caches.open(TILES).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
            trimTiles(cache);
          }
          return response;
        } catch {
          const hit = await cache.match(request);
          return hit || Response.error();
        }
      }),
    );
  }
});
