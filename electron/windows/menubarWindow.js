import { app, BrowserWindow } from 'electron'

const maxWindowInteger = 2147483647

export default imsdomApp => {
  if (imsdomApp.menubarWindow) {
    imsdomApp.showMenubarWindow()
    return imsdomApp.menubarWindow
  }

  const windowOptions = {
    width: 320,
    height: 380,
    titleBarStyle: 'hiddenInset',
    transparent: true,
    show: false,
    frame: false,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  }

  const win = new BrowserWindow(windowOptions)
  win.setWindowButtonVisibility(false)

  win.on('close', e => {
    if (win.forceQuit) {
      app.quit()
    } else {
      e.preventDefault()
      if (win.isFullScreen()) {
        win.setFullScreen(false)
        setTimeout(() => {
          win.hide()
        }, 700)
      } else {
        win.hide()
      }
    }
  })

  win.on('blur', () => {
    win.hide()
  })

  win.on('enter-full-screen', () => {
    win.setMaximumSize(maxWindowInteger, maxWindowInteger)
  })

  return win
}
