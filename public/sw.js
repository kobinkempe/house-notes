const VERSION = "house-notes-share-v4";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method === "POST" && requestUrl.pathname === "/share-target") {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.method === "GET" && requestUrl.origin === self.location.origin) {
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "HOUSE_NOTES_VERSION") {
    event.source?.postMessage({ type: "HOUSE_NOTES_VERSION", version: VERSION });
  }
});
