import { app, ipcMain, BrowserWindow } from 'electron'
import merge from 'lodash/merge'
import { initSetting, readSetting, writeSetting } from './modules/setting'
import Notify from './modules/Notify'
import mainWindow from './windows/mainWindow'
import printWindow from './windows/printWindow'
import menubarWindow from './windows/menubarWindow'
import AppTray from './modules/AppTray'
import DownloadManager from './modules/DownloadManager'
import AppUpdater from './modules/AppUpdater'
import crashReporter from './modules/crashReporter'
import CrashMonitor from './modules/CrashMonitor'
import ScreenShot from './modules/ScreenShot'
import GlobalShortcutManager from './modules/GlobalShortcutManager'
import { setAutoStartOnBoot } from './modules/autoStartOnBoot'

export default class ImsdomApp {
  // 当前用户账号
  userAccount = null

  // 当前用户是否已登录
  userLogined = false

  // Deep linked url
  deepLinkingUrl = null

  // 托盘图标
  tray = null

  // 主窗口
  mainWindow = null

  // 打印窗口
  printWindow = null

  // mac tabbar小窗口
  menubarWindow = null

  autoUpdater = null

  downloadManager = null

  newMsgPayload = null

  // 默认配置
  setting = {
    autoUpdate: true,
    enableAutoStart: true,
    enableCapture: true,
    enableFlicker: true,
    keymap: {
      'screen-shot': 'Alt+A',
      'mainWindow-show': 'CmdOrCtrl+Shift+L'
    }
  }

  constructor() {
    if (!app.requestSingleInstanceLock()) {
      return app.quit()
    }
    this.init().then(() => {
      app.setAppUserModelId('com.im.imsdom')
      this.initMainWin()
      // if (process.platform !== 'win32') {
      //   this.initMenubarWin()
      // }
      this.initUserAccount()
      this.initTray()
      this.initNotify()
      this.bindShortcut()
      this.initAutoUpdate()
      this.initDownload()
      this.initCrashMonitor()
      this.initScreenShot()
      if (process.env.NODE_ENV === 'production') {
        this.initAutoStartOnBoot()
      }
      this.initEvents()
    })
  }

  /**
   * 初始化
   * @return {Promise}
   */
  async init() {
    this.setting = await initSetting(this)

    // 该方法应尽早地调用
    crashReporter.init()

    if (!app.isDefaultProtocolClient('imsdomapp')) {
      app.setAsDefaultProtocolClient('imsdomapp')
    }

    app.on('activate', () => {
      if (this.mainWindow === null) {
        this.initMainWin()
      } else {
        this.mainWindow.show()
      }
    })
    // 重复打开应用就显示窗口
    app.on('second-instance', (e, argv) => {
      // Protocol handler for win32
      if (process.platform === 'win32') {
        this.deepLinkingUrl = argv.slice(1)
        this.handleProtocol()
      }
      this.showMainWindow()
    })

    // 所有窗口关闭之后退出应用
    app.once('window-all-closed', () => {
      if (this.tray && !this.tray.isDestroyed()) {
        this.tray.destroy()
        this.tray = null
      }
      app.quit()
    })

    app.on('before-quit', () => {
      if (process.platform === 'darwin') {
        this.mainWindow.forceQuit = true
        if (this.menubarWindow) {
          this.menubarWindow.forceQuit = true
        }
        if (this.printWindow) {
          this.printWindow.forceQuit = true
        }
      }
    })

    app.on('will-quit', () => {
      GlobalShortcutManager.unregisterAll()
      if (process.platform === 'darwin') {
        app.quit()
      }
    })

    app.on('will-finish-launching', () => {
      // Protocol handler for osx
      app.on('open-url', (event, url) => {
        event.preventDefault()
        this.deepLinkingUrl = url
        this.handleProtocol()
      })
    })

    return app.whenReady()
  }

  initMainWin() {
    this.mainWindow = mainWindow(this)
    // Protocol handler for win32
    if (process.platform === 'win32') {
      this.deepLinkingUrl = process.argv.slice(1)
      this.handleProtocol()
    }
  }

  initMenubarWin() {
    this.menubarWindow = menubarWindow(this)
  }

  initEvents() {
    if (process.platform === 'win32') {
      ipcMain.on('ipcMain:onMsg', (e, payload) => {
        this.tray.flicker(true)
        if (this.mainWindow.isVisible() && !this.mainWindow.isFocused()) {
          this.flashFrame(true)
        }
        this.newMsgPayload = payload
      })
      this.tray.on('click', visible => {
        if (visible && this.newMsgPayload) {
          this.mainWindow.webContents.send('ipcRenderer:onMsg', this.newMsgPayload)
          this.newMsgPayload = null
        }
      })
      this.mainWindow.on('focus', () => {
        if (this.tray.isFlicking()) {
          this.tray.flicker(false)
        }
      })
    }

    ipcMain.on('ipcMain:updateSetting', (e, setting = {}) => {
      this.updateSetting(setting)
    })

    ipcMain.on('ipcMain:getSetting', e => {
      e.returnValue = this.setting
    })

    ipcMain.on('ipcMain:openFromNotify', () => {
      if (process.platform === 'win32') {
        this.tray.flicker(false)
      }
      this.mainWindow.show()
      this.mainWindow.focus()
    })

    ipcMain.on('ipcMain:printPDF', (e, pdf) => {
      this.printWindow = printWindow(this)
      this.printWindow.loadURL(pdf)
    })

    ipcMain.on('ipcMain:setForceUpdate', () => {
      if (this.updateTimer) {
        clearTimeout(this.updateTimer)
      }
    })

    if (process.env.DEBUG_PROD === 'true') {
      this.mainWindow.webContents.openDevTools()
    }
  }

  async updateSetting(setting) {
    this.setting = merge(this.setting, setting)
    await this.writeSetting()
    this.mainWindow.webContents.send('ipcMain.settingChange', this.setting)
  }

  handleProtocol() {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.deepLinkingUrl)
    }
  }

  initUserAccount() {
    ipcMain.on('ipcMain:user:setAccount', (e, account) => {
      this.userAccount = account
    })

    ipcMain.on('ipcMain:user:login', () => {
      this.userLogined = true
    })

    ipcMain.on('ipcMain:user:logout', () => {
      this.userAccount = null
      this.userLogined = false
    })
  }

  initAutoUpdate() {
    this.autoUpdater = new AppUpdater(this)
    if (process.env.NODE_ENV !== 'development') {
      if (this.setting.autoUpdate) {
        this.updateTimer = setTimeout(() => {
          this.autoUpdater.checkForUpdates(true)
        }, 8000)
      }
    }
  }

  initTray() {
    this.tray = new AppTray(this)
  }

  initDownload() {
    this.downloadManager = new DownloadManager(this)
    this.downloadManager.initEvent()
  }

  initNotify() {
    this.notify = new Notify()
    this.notify.on('click', () => this.showMainWindow())
  }

  initCrashMonitor() {
    const crashMonitor = new CrashMonitor(this)
    crashMonitor.init()
  }

  initScreenShot() {
    this.screenShot = new ScreenShot(this)
  }

  getUserAccount() {
    return this.userAccount
  }

  readSetting() {
    return readSetting(this)
  }

  writeSetting() {
    return writeSetting(this)
  }

  quit() {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(item => item.destroy())
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.destroy()
      this.tray = null
    }
    app.quit()
  }

  bindShortcut() {
    this.globalShortcutManager = new GlobalShortcutManager(this)
    // ctrl+shift+L快捷键打开窗口
    this.globalShortcutManager.register(this.setting.keymap['mainWindow-show'])
  }

  initAutoStartOnBoot() {
    // 开机自启动
    if (this.setting.enableAutoStart) {
      setAutoStartOnBoot(true)
    } else {
      setAutoStartOnBoot(false)
    }

    ipcMain.on('ipcMain:setAutoStartOnBoot', (e, enable) => {
      this.setting = { ...this.setting, enableAutoStart: enable }
      this.writeSetting()
      if (enable) {
        setAutoStartOnBoot(true)
      } else {
        setAutoStartOnBoot(false)
      }
    })
  }

  isLogin() {
    return this.userLogined
  }

  showMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show()
      }
      this.mainWindow.setSkipTaskbar(false)
      this.mainWindow.focus()
    }
  }

  showMenubarWindow() {
    if (this.menubarWindow) {
      if (!this.menubarWindow.isVisible()) {
        this.menubarWindow.show()
      }
      this.menubarWindow.focus()
    }
  }

  flashFrame(enable = true) {
    this.mainWindow.flashFrame(enable)
    if (enable) {
      this.mainWindow.once('focus', () => this.mainWindow.flashFrame(false))
    }
  }

  resetTrayMenu() {
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.setMenu()
    }
  }

  execScreenShot() {
    this.screenShot.execScreenShot()
  }
}
