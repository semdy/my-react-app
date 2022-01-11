importScripts('./workbox-v4.3.1/workbox-sw.js')
workbox.setConfig({ modulePathPrefix: './workbox-v4.3.1' })
workbox.core.setCacheNameDetails({ prefix: 'imsdom-app', suffix: 'v1' })
workbox.core.clientsClaim()

workbox.routing.registerRoute(
  /.*\.(?:js|css|htm|html|json|yml|yaml)/,
  workbox.strategies.networkFirst({
    cacheName: 'ui-cache', // Use a custom cache name
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 200, // Cache only N items
        purgeOnQuotaError: 1,
        maxAgeSeconds: 5 * 60
      })
    ]
  })
)

workbox.routing.registerRoute(
  /.*\.(?:ico|png|gif|jpg|jpeg|svg)/,
  workbox.strategies.cacheFirst({
    cacheName: 'images-cache', // Use a custom cache name
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 800, // Cache only N items
        purgeOnQuotaError: 3,
        maxAgeSeconds: 5 * 60
      })
    ]
  })
)

self.addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    )
  }
})

/*
workbox.routing.registerRoute(/\//, workbox.strategies.networkOnly());
*/ // 全部从网络加载

/*
caches.keys().then(cacheNames => {
  cacheNames.forEach(cacheName => {
    caches.delete(cacheName);
  });
});
*/ // 如需清理全部缓存，可在Console执行：
