import path from 'path'
import url from 'url'
import { app, BrowserWindow, ipcMain, screen } from 'electron'
import localshortcut from 'electron-localshortcut'
import MenuBuilder from '../modules/MenuBuilder'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Menu.setApplicationMenu(null)

export default imsdomApp => {
  if (imsdomApp.mainWindow) {
    imsdomApp.showMainWindow()
    return imsdomApp.mainWindow
  }

  const windowOptions = {
    width: 1024,
    height: 768,
    minWidth: 750,
    minHeight: 650,
    title: 'IMSDOM',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false
    }
  }
  if (process.platform === 'win32') {
    windowOptions.frame = false
    windowOptions.icon = './resources/icon.ico'
  } else {
    windowOptions.titleBarStyle = 'hidden'
  }

  let mainWindow = new BrowserWindow(windowOptions)
  mainWindow.frameName = 'imsdomMainWin'
  // localshortcut.register(mainWindow, 'Esc', () => {
  //   mainWindow.hide()
  // })
  if (process.platform === 'darwin') {
    // const contents = mainWindow.webContents
    localshortcut.register(mainWindow, 'Cmd+Q', () => {
      app.quit()
    })
    // localshortcut.register(mainWindow, 'CommandOrControl+A', () => {
    //   contents.selectAll()
    // })
    // localshortcut.register(mainWindow, 'CommandOrControl+C', () => {
    //   contents.copy()
    // })
    // localshortcut.register(mainWindow, 'CommandOrControl+X', () => {
    //   contents.cut()
    // })
    // localshortcut.register(mainWindow, 'CommandOrControl+V', () => {
    //   contents.paste()
    // })
    // localshortcut.register(mainWindow, 'CommandOrControl+Z', () => {
    //   contents.undo()
    // })
    // localshortcut.register(mainWindow, 'Shift+CommandOrControl+Z', () => {
    //   contents.redo()
    // })
  }

  if (isDevelopment) {
    mainWindow.loadURL(
      url.format({
        hostname: 'localhost',
        protocol: process.env.HTTPS === 'true' ? 'https' : 'http',
        port: process.env.PORT || 3132,
        slashes: true
      })
    )
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file',
        slashes: true
      })
    )
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined')
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  mainWindow.on('close', e => {
    if (mainWindow.forceQuit) {
      app.quit()
    } else if (!mainWindow.canQuit) {
      e.preventDefault()
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false)
        setTimeout(() => {
          mainWindow.hide()
        }, 700)
      } else {
        mainWindow.hide()
      }
      if (process.platform === 'win32' && mainWindow.isMinimized()) {
        mainWindow.webContents.send('mainWindow:unmaximize')
      }
      mainWindow.setSkipTaskbar(true)
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // 屏幕标题栏的右键菜单
  mainWindow.on('system-context-menu', e => {
    e.preventDefault()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })

  // 屏蔽自定义标题栏的右键菜单
  if (process.platform === 'win32' && mainWindow.hookWindowMessage) {
    const WM_INITMENU = 0x116 // 278
    mainWindow.hookWindowMessage(WM_INITMENU, () => {
      mainWindow.setEnabled(false)
      setTimeout(() => {
        mainWindow.setEnabled(true)
      }, 100)
      return true
    })
  }

  // 主菜单和右键菜单管理
  const menuBuilder = new MenuBuilder(imsdomApp, mainWindow)
  menuBuilder.buildMenu()

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('mainWindow:onMaximize')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('mainWindow:unmaximize')
  })

  mainWindow.on('restore', () => {
    mainWindow.webContents.send('mainWindow:onRestore')
  })

  ipcMain.on('ipcMain:Update', () => {
    const download = require('download')
    const path = require('path')
    const appPath = path.resolve(app.getAppPath(), '..')
    mainWindow.webContents.send('StartDownload')
    download('http://192.168.3.115:9999/app.asar.zip', appPath).then(() => {
      mainWindow.webContents.send('EndDownload')
      mainWindow.webContents.send('StartUpdate')
      const AdmZip = require('adm-zip')
      const zip = new AdmZip(`${appPath}/app.asar.zip`)
      zip.extractAllTo(appPath, true)
      mainWindow.webContents.send('EndUpdate')
      // 删除有待确认
      // const fs = require('fs')
      // fs.unlink(`${appPath}/app.asar.zip`)
      app.relaunch()
      app.exit()
    })
  })

  ipcMain.on('mainWindow:minimize', () => mainWindow.minimize())

  ipcMain.on('mainWindow:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('mainWindow:close', () => mainWindow.hide())

  ipcMain.on('mainWindow:restore', () => mainWindow.restore())

  ipcMain.on('mainWindow:show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  ipcMain.on('mainWindow:badge', (e, count) => {
    app.setBadgeCount(count)
    if (imsdomApp.tray) imsdomApp.tray.flicker(!!count)
    if (app.dock) {
      app.dock.show()
      app.dock.bounce('critical')
    }
  })

  ipcMain.on('mainWindow:splitScreen', () => {
    try {
      const cursorPoint = screen.getCursorScreenPoint()
      const {
        workArea: { x, y, width, height }
      } = screen.getDisplayNearestPoint(cursorPoint)
      if (mainWindow.isMaximized()) {
        mainWindow.restore()
      }
      mainWindow.setBounds({ x, y, width: width / 2, height })
    } catch (e) {
      console.log(e)
    }
  })

  return mainWindow
}
