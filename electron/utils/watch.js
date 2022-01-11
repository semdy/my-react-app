const fs = require('fs')
const { app } = require('electron')

module.exports = (mainFile, options = {}) => {
  const watcher = fs.watch(mainFile, { encoding: 'utf8', recursive: false })
  watcher.once('change', () => {
    app.relaunch()
    if (options.resetMethod === 'exit') {
      app.exit()
    } else {
      app.quit()
    }
  })
}
