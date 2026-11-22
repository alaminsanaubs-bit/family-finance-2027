
const CACHE_NAME = "family-finance-2027-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});


self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});


self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API ডাটা ক্যাশ না করে সরাসরি অনলাইন থেকে আনা
  if (url.hostname === "script.google.com" ||
      url.hostname === "script.googleusercontent.com") {
    return;
  }

  // HTML পেজ
  if (request.mode === "navigate") {

    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put("./", copy);
          });

          return response;
        })
        .catch(() => {
          return caches.match("./")
            .then(cached => cached || caches.match("./index.html"));
        })
    );

    return;
  }

  // অন্যান্য ফাইল
  event.respondWith(
    fetch(request)
      .then(response => {

        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(() => caches.match(request))
  );

});
