workbox.core.setCacheNameDetails({
  prefix: 'imsdom-app',
  suffix: 'v1'
})

// Control all opened tabs ASAP
workbox.core.clientsClaim()

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || [])
workbox.precaching.precacheAndRoute(self.__precacheManifest, {})

// workbox.routing.registerNavigationRoute(workbox.precaching.getCacheKeyForURL('./index.html'), {
//   blacklist: [/^\/_/, /\/[^\/?]+\.[^\/]+$/]
// })

workbox.routing.registerRoute(
  /.*\.(?:html?|json|yml|yaml)/,
  workbox.strategies.networkFirst({
    cacheName: 'html-cache', // Use a custom cache name
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
  /.*\.(?:js|css|ico|png|gif|jpg|jpeg|svg)/,
  workbox.strategies.cacheFirst({
    cacheName: 'assets-cache', // Use a custom cache name
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 800, // Cache only N items
        purgeOnQuotaError: 3,
        maxAgeSeconds: 5 * 60
      })
    ]
  })
)

/**
 * Response to client after skipping waiting with MessageChannel
 */
self.addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () =>
          replyPort.postMessage({
            error: null
          }),
        error =>
          replyPort.postMessage({
            error
          })
      )
    )
  }
})
