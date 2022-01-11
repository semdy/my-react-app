const glob = require('glob')

const getPrettierFiles = () => {
  let files = []
  const jsFiles = glob.sync('src/**/*.js*', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/public/**']
  })
  const mainJsFiles = glob.sync('electron/**/*.js*', {
    ignore: ['**/node_modules/**', '**/dist/**', 'main.js']
  })
  const tsFiles = glob.sync('src/**/*.ts*', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/public/**']
  })
  const configFiles = glob.sync('config/**/*.js*', { ignore: ['**/node_modules/**', 'dist/**'] })
  const scriptFiles = glob.sync('scripts/**/*.js')
  const lessFiles = glob.sync('src/**/*.less*', { ignore: ['**/node_modules/**', 'dist/**'] })
  files = files.concat(jsFiles)
  files = files.concat(mainJsFiles)
  files = files.concat(tsFiles)
  files = files.concat(configFiles)
  files = files.concat(scriptFiles)
  files = files.concat(lessFiles)
  if (!files.length) {
    return
  }
  return files
}

module.exports = getPrettierFiles
