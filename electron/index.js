import path from 'path'
import { app } from 'electron'
// import installExtensions from './modules/installExtensions'
import ImsdomApp from './App'

// 屏蔽本地接口证书问题
// app.commandLine.appendSwitch('--ignore-certificate-errors', 'true')

/* eslint-disable no-new */
new ImsdomApp()
app.on('ready', () => {
  // if (isDevelopment || isProdDebug) {
  //   await installExtensions()
  // }

  if (process.env.NODE_ENV !== 'production') {
    require('electron-debug')()
  }

  if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support')
    sourceMapSupport.install()
  }

  process.on('uncaughtException', error => {
    console.log(error.stack || JSON.stringify(error))
    app.exit()
  })

  if (process.env.NODE_ENV !== 'production' && process.env.HOT === 'true') {
    require('./utils/watch')(path.join(app.getAppPath(), 'main.js'), {
      resetMethod: 'exit'
    })
  }
})
