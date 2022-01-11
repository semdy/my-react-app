import path from 'path'
import url from 'url'
import { Tray, Menu, screen, nativeTheme, shell, nativeImage } from 'electron'
import Events from 'events'
import {
  getMessageTrayIcon,
  getNoMessageTrayIcon,
  getNoMessageDarkTrayIcon
} from '../utils/getAssetsPath'

class AppTray extends Events {
  // 图标闪烁定时
  flickerTimer = null

  // 托盘对象
  tray = null

  // 正常图标文件
  noMessageTrayIcon = null

  // mac深色模式图标
  noMessageDarkTrayIcon = null

  // 透明图标文件
  messageTrayIcon = null

  constructor(imsdomApp) {
    super()
    this.imsdomApp = imsdomApp
    this.mainWindow = imsdomApp.mainWindow
    if (imsdomApp.menubarWindow) {
      this.menubarWindow = imsdomApp.menubarWindow
    }

    this.noMessageTrayIcon = nativeImage.createFromPath(getNoMessageTrayIcon())
    this.noMessageDarkTrayIcon = nativeImage.createFromPath(getNoMessageDarkTrayIcon())
    this.messageTrayIcon = nativeImage.createFromPath(getMessageTrayIcon())

    this.tray = new Tray(this.noMessageTrayIcon)

    if (process.env.NODE_ENV === 'development') {
      this.tray.setToolTip('imsdom开发版')
    } else {
      this.tray.setToolTip('imsdom')
    }

    // if (process.platform === 'win32') {
    //   this.initWinEvent()
    //   this.setMenu()
    // } else {
    //   this.initDarwinEvent()
    //   this.setTrayIconByTheme()
    //   nativeTheme.on('updated', this.setTrayIconByTheme)
    // }

    this.setMenu()

    if (process.platform === 'win32') {
      this.initWinEvent()
    } else {
      this.setTrayIconByTheme()
      nativeTheme.on('updated', this.setTrayIconByTheme)
    }
  }

  /**
   * 初始化事件
   */
  initWinEvent() {
    this.tray.on('click', () => {
      if (this.isFlicking()) {
        this.flicker(false)
        if (this.mainWindow.isVisible() && !this.mainWindow.isFocused()) {
          this.mainWindow.focus()
          this.emit('click', true)
          return
        }
      }
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.show()
        this.mainWindow.setSkipTaskbar(false)
        this.emit('click', true)
      } else if (this.mainWindow.isVisible()) {
        this.mainWindow.hide()
        this.mainWindow.setSkipTaskbar(true)
        this.emit('click', false)
      } else {
        this.mainWindow.show()
        this.mainWindow.setSkipTaskbar(false)
        this.emit('click', true)
      }
    })
  }

  initDarwinEvent() {
    this.tray.on('click', () => {
      if (!this.imsdomApp.isLogin()) return
      if (this.menubarWindowLoaded) return
      if (process.env.NODE_ENV !== 'production') {
        this.menubarWindow.loadURL(
          url.format({
            hostname: 'localhost',
            protocol: process.env.HTTPS === 'true' ? 'https' : 'http',
            port: process.env.PORT || 3132,
            slashes: true,
            hash: 'miniPage'
          })
        )
      } else {
        this.menubarWindow.loadURL(
          url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            hash: 'miniPage',
            protocol: 'file',
            slashes: true
          })
        )
      }
      this.menubarWindowLoaded = true
    })

    this.tray.on('click', () => {
      if (!this.imsdomApp.isLogin()) return
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      const [defaultWidth, defaultHeight] = [width, height].map(x => Math.round((x * 3) / 4))
      const WINDOW_WIDTH = defaultWidth - 640
      const WINDOW_HEIGHT = defaultHeight
      const HORIZ_PADDING = 0
      const VERT_PADDING = 0

      const cursorPosition = screen.getCursorScreenPoint()
      const primarySize = screen.getPrimaryDisplay().workAreaSize
      const trayPositionVert = cursorPosition.y >= primarySize.height / 2 ? 'bottom' : 'top'
      const trayPositionHoriz = cursorPosition.x >= primarySize.width / 2 ? 'right' : 'left'
      this.menubarWindow.setPosition(getTrayPosX(), getTrayPosY())
      if (this.menubarWindow.isVisible()) {
        this.menubarWindow.hide()
      } else {
        this.menubarWindow.show()
      }

      function getTrayPosX() {
        const horizBounds = {
          left: cursorPosition.x - WINDOW_WIDTH / 2,
          right: cursorPosition.x + WINDOW_WIDTH / 2
        }
        if (trayPositionHoriz === 'left') {
          return horizBounds.left <= HORIZ_PADDING ? HORIZ_PADDING : horizBounds.left
        }
        return horizBounds.right >= primarySize.width
          ? primarySize.width - HORIZ_PADDING - WINDOW_WIDTH
          : horizBounds.right - WINDOW_WIDTH
      }
      function getTrayPosY() {
        return trayPositionVert === 'bottom'
          ? cursorPosition.y - WINDOW_HEIGHT - VERT_PADDING
          : cursorPosition.y + VERT_PADDING
      }
    })
  }

  setTrayIconByTheme = () => {
    if (nativeTheme.shouldUseDarkColors) {
      this.tray.setImage(this.noMessageDarkTrayIcon)
    } else {
      this.tray.setImage(this.noMessageTrayIcon)
    }
  }

  /**
   * 设置菜单
   */
  setMenu() {
    const isDarwin = process.platform === 'darwin'
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `打开Imsdom (${isDarwin ? 'Command' : 'Ctrl'}+Shift+L)`,
        click: () => {
          this.imsdomApp.showMainWindow()
        }
      },
      {
        label: '设置',
        click: () => {
          this.imsdomApp.showMainWindow()
          this.mainWindow.webContents.send('JumpSetting')
        }
      },
      {
        label: '意见反馈',
        click: () => {
          shell.openExternal('https://www.imsdom.com/contactus/')
        }
      },
      {
        label: '帮助',
        click: () => {
          shell.openExternal('https://www.imsdom.com/about_us/')
        }
      },
      {
        label: '关于Imsdom',
        click: () => {
          this.imsdomApp.showMainWindow()
          this.mainWindow.webContents.send('JumpAboutIMSDOM', { anchor: 'about' })
        }
      },
      {
        label: '退出Imsdom',
        click: () => {
          this.imsdomApp.quit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }

  /**
   * 控制图标是否闪烁
   * @param {Boolean} is 是否闪烁
   */
  flicker(is) {
    if (is) {
      if (this.mainWindow.isFocused()) return
      // 防止连续调用多次，导致图标切换时间间隔不是600ms
      if (this.flickerTimer !== null) return
      let flickFlag = true
      this.flickerTimer = setInterval(() => {
        this.tray.setImage(flickFlag ? this.messageTrayIcon : this.noMessageTrayIcon)
        flickFlag = !flickFlag
      }, 600)
    } else {
      // eslint-disable-next-line
      if (this.flickerTimer) {
        clearInterval(this.flickerTimer)
        this.flickerTimer = null
        this.tray.setImage(this.noMessageTrayIcon)
      }
    }
  }

  isFlicking() {
    return this.flickerTimer !== null
  }

  /**
   * 判断托盘是否销毁
   */
  isDestroyed() {
    return this.tray.isDestroyed()
  }

  /**
   * 销毁托盘图标
   */
  destroy() {
    return this.tray.destroy()
  }
}

export default AppTray
