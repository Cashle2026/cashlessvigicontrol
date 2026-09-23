// VigilPro — service worker
// Permite instalar la app (PWA), cachear el shell para carga offline y mostrar
// notificaciones del sistema aunque la pestaña esté en segundo plano.
// NOTA: ningún service worker puede evitar que el sistema operativo cierre por
// completo el navegador o mate el proceso; solo mantiene la app disponible mientras
// el navegador siga corriendo (aunque la pestaña no esté en primer plano).

const CACHE_NAME = "vigilpro-shell-v1";
const SHELL_FILES = ["./index.html", "./manifest.json", "./icons/icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: red primero (los datos vienen de Supabase y deben ser frescos),
// con respaldo en caché solo para el shell si no hay conexión.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./index.html");
    })
  );
});
