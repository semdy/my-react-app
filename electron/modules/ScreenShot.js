import childProcess from 'child_process'
import path from 'path'
import { app, ipcMain } from 'electron'
import GlobalShortcutManager from './GlobalShortcutManager'

export default class ScreenShot {
  constructor(imsdomApp) {
    this.imsdomApp = imsdomApp
    this.initEvents()
  }

  execScreenShot(hideWindow) {
    if (hideWindow && this.imsdomApp.mainWindow.isVisible()) {
      this.imsdomApp.mainWindow.hide()
    }
    if (process.platform === 'win32') {
      childProcess.execFile('./resources/plugins/screenshot-win/ss-win32.exe')
      return
    }
    if (process.platform === 'darwin') {
      let executePath
      if (process.env.NODE_ENV === 'development') {
        executePath = path.join(
          app.getAppPath(),
          '../resources/plugins/screenshot-mac/imsdom-screenshot.app'
        )
      } else {
        executePath = `${process.resourcesPath.replace(
          ' ',
          '\\ '
        )}/plugins/screenshot-mac/imsdom-screenshot.app`
      }
      childProcess.exec(`open ${executePath}`)
    }
  }

  bindScreenShot(register) {
    // alt+A截图快捷键
    const accelerator = this.imsdomApp.setting.keymap['screen-shot']
    if (register) {
      this.imsdomApp.globalShortcutManager.register(accelerator)
    } else {
      GlobalShortcutManager.unregister(accelerator)
    }
  }

  async updateShotCut(accelerator) {
    this.bindScreenShot(false)
    await this.imsdomApp.updateSetting({
      keymap: {
        'screen-shot': accelerator
      }
    })
    this.bindScreenShot(true)
  }

  initEvents() {
    ipcMain.on('ipcMain:bindScreenShot', (e, register) => {
      this.bindScreenShot(register)
    })

    ipcMain.on('ipcMain:execScreenShot', (e, hideWindow) => {
      this.execScreenShot(hideWindow)
    })

    ipcMain.on('ipcMain:updateScreenShotCut', (e, accelerator) => {
      this.updateShotCut(accelerator)
    })
  }
}
