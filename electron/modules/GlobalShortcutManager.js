import { globalShortcut } from 'electron'
// import electronLocalshortcut from 'electron-localshortcut'

// electronLocalshortcut.register(mainWindow, '<shortcut>', () => {})

class GlobalShortcutManager {
  constructor(imsdomApp) {
    this.imsdomApp = imsdomApp
    this.mainWindow = imsdomApp.mainWindow
  }

  register(accelerator) {
    const registered = globalShortcut.register(accelerator, () => {
      this.responseCallback(accelerator)
    })

    if (!registered) {
      console.error(`globalShortcut "${accelerator}" registration failed`)
    }
  }

  registerAll(accelerators) {
    globalShortcut.registerAll(accelerators, () => {
      this.responseCallback(accelerators)
    })
  }

  static isRegistered(accelerator) {
    globalShortcut.isRegistered(accelerator)
  }

  static unregister(accelerator) {
    globalShortcut.unregister(accelerator)
  }

  static unregisterAll() {
    globalShortcut.unregisterAll()
  }

  responseCallback(accelerator) {
    const { keymap } = this.imsdomApp.setting
    switch (accelerator) {
      // 全局唤醒并打开窗口
      case keymap['mainWindow-show']:
        this.imsdomApp.showMainWindow()
        break
      // 全局唤醒截图
      case keymap['screen-shot']:
        this.imsdomApp.execScreenShot()
        break
      default:
      //
    }
  }
}

export default GlobalShortcutManager
