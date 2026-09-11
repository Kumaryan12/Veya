const CACHE_NAME = "veya-web-v2";
const CORE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/models/face_landmarker.task",
  "/mediapipe/vision_wasm_internal.js",
  "/mediapipe/vision_wasm_internal.wasm",
  "/mediapipe/vision_wasm_module_internal.js",
  "/mediapipe/vision_wasm_module_internal.wasm",
  "/mediapipe/vision_wasm_nosimd_internal.js",
  "/mediapipe/vision_wasm_nosimd_internal.wasm"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/")));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })),
  );
});
