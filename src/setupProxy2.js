const proxy = require('http-proxy-middleware')

const apiMap = {
  dev: 'dev-',
  test: 'test-',
  stage: 'stage-',
  im: ''
}

const current = apiMap.dev

module.exports = function (app) {
  app.use(
    '/apiuser',
    proxy({
      // target: 'http://47.101.33.78:6005',
      target: `https://${current}user-api.imsdom.com`,
      // target: 'http://192.168.8.148:6005',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/apiuser': '' }
    })
  )
  app.use(
    '/apispace',
    proxy({
      // target: 'http://47.101.33.78:6008',
      target: `https://${current}space-api.imsdom.com`,
      // target: 'http://192.168.3.22:6008',
      // target: 'http://192.168.8.148:6008',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/apispace': '' }
    })
  )
  app.use(
    '/apical',
    proxy({
      // target: 'http://47.101.33.78:6007',
      target: `https://${current}cal-api.imsdom.com`,
      // target: 'http://192.168.8.122:6007',
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/apical': '' }
    })
  )
}
