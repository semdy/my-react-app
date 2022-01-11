import { BrowserWindow, app, dialog } from 'electron'

class CrashMonitor {
  constructor(imsdomApp) {
    this.mainWindow = imsdomApp.mainWindow
  }

  init() {
    this.mainWindow.webContents.on('crashed', () => {
      const options = {
        type: 'error',
        title: '进程崩溃了',
        message: '这个进程已经崩溃.',
        buttons: ['重载', '退出']
      }
      this.logCrashRecord()
        .then(() => {
          dialog.showMessageBox(this.mainWindow, options).then(({ response }) => {
            if (response === 0) {
              this.reloadWindow()
            } else {
              app.quit()
            }
          })
        })
        .catch(e => {
          console.error('err', e)
        })
    })
  }

  logCrashRecord() {
    return new Promise(resolve => {
      resolve()
    })
  }

  reloadWindow() {
    if (this.mainWindow.isDestroyed()) {
      app.relaunch()
      app.exit(0)
    } else {
      BrowserWindow.getAllWindows().forEach(window => {
        if (window.id !== this.mainWindow.id) {
          window.destroy()
        }
      })
      this.mainWindow.reload()
    }
  }
}

export default CrashMonitor
