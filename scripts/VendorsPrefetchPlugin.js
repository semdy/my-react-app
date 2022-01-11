const HtmlWebpackPlugin = require('html-webpack-plugin')
const getVendorsFiles = require('./getVendorsFiles')

class PrefetchPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('PrefetchPlugin', (compilation) => {
      HtmlWebpackPlugin
        .getHooks(compilation)
        .alterAssetTagGroups
        .tapAsync('PrefetchPlugin', (assets, cb) => {
          const { injectFiles } = this.options
          if (injectFiles && !Array.isArray(injectFiles)) {
            process.exit(1)
            throw Error('"injectFiles" is expected to be array.')
          }
          if (!injectFiles || injectFiles.includes(assets.outputName)) {
            const chunks = getVendorsFiles()
            const tags = []
            chunks.forEach(chunk => {
              tags.push({
                tagName: 'link',
                voidTag: false,
                attributes: {
                  rel: 'prefetch',
                  as: 'script',
                  href: chunk
                }
              })
            })
            assets.headTags.push(...tags)
          }
          cb(null, assets)
      })
    })
  }
}

module.exports = PrefetchPlugin
