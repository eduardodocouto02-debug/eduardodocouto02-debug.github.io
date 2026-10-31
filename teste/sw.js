// Gerado no build. Versão 5459a1ff05c6
const PREFIX = "ba-teste-";
const CACHE = PREFIX + "5459a1ff05c6";
const TILES = "ba-baby-tiles-osm";
const ASSETS = ["./","./assets/index-BHVMMmMn.js","./assets/caveat-latin-600-normal-DUjB8dgm.woff","./assets/caveat-latin-600-normal-zlTlWIYU.woff2","./assets/dancing-script-latin-700-normal-CX8AaSVl.woff2","./assets/dancing-script-latin-700-normal-LI5MgW9m.woff","./assets/index-BVm1wS2F.css","./assets/poppins-latin-400-normal-BOb3E3N0.woff","./assets/poppins-latin-400-normal-cpxAROuN.woff2","./assets/poppins-latin-600-normal-BJdTmd5m.woff","./assets/poppins-latin-600-normal-zEkxB9Mr.woff2","./assets/poppins-latin-700-normal-BVuQR_eA.woff","./assets/poppins-latin-700-normal-Qrb0O0WB.woff2","./assets/poppins-latin-800-normal-Bd8-pIP1.woff2","./assets/poppins-latin-800-normal-YoItoZZV.woff","./assets/special-elite-latin-400-normal-BtSRmyJ6.woff","./assets/special-elite-latin-400-normal-YjDd9tmf.woff2","./assets/titan-one-latin-400-normal-DwVbh4mi.woff2","./assets/titan-one-latin-400-normal-VZVzRR2h.woff","./manifest-teste.webmanifest","./icons/teste-192.png","./icons/teste-512.png","./icons/teste-apple-touch-icon.png"];
// Só cuida dos arquivos deste app (o oficial fica em / e o de teste em /teste/, no mesmo endereço).
const SCOPE = new URL(self.registration.scope).pathname;
const OWN = new Set(ASSETS.map((a) => new URL(a, self.registration.scope).pathname));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE && k !== TILES).map((k) => caches.delete(k))))
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
    const isPage = url.pathname === SCOPE || url.pathname === SCOPE + "index.html";
    if (!isPage && !OWN.has(url.pathname)) return;
    // App: do cache primeiro (funciona sem internet).
    event.respondWith(
      caches.open(CACHE)
        .then((cache) => cache.match(isPage ? "./" : request, { ignoreSearch: true, ignoreVary: true }))
        .then((hit) => hit || fetch(request)),
    );
    return;
  }

  if (url.hostname === "tile.openstreetmap.org") {
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
