const paths = require('../../config/paths')

require('electron-reload')(paths.appMain, {
  electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
  hardResetMethod: 'exit'
})
