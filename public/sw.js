self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  // basic pass-through
  event.respondWith(fetch(event.request));
});
