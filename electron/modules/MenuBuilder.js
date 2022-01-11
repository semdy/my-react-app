import { Menu, shell } from 'electron'

class MenuBuilder {
  constructor(imsdomApp, mainWindow) {
    this.imsdomApp = imsdomApp
    this.mainWindow = mainWindow
  }

  buildMenu() {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      this.setupDevelopmentEnvironment()
    }

    const template =
      process.platform === 'darwin' ? this.buildDarwinTemplate() : this.buildDefaultTemplate()

    if (template.length) {
      const menu = Menu.buildFromTemplate(template)
      Menu.setApplicationMenu(menu)
    } else {
      Menu.setApplicationMenu(null)
    }
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props

      Menu.buildFromTemplate([
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload()
          }
        },
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y)
          }
        }
      ]).popup({ window: this.mainWindow })
    })
  }

  buildDarwinTemplate() {
    const menuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:', visible: false },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:', visible: false },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:', visible: false },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:', visible: false },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:', visible: false },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:', visible: false },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
          }
        },
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        {
          label: 'Close',
          accelerator: 'Command+W',
          selector: 'performClose:'
        },
        {
          label: 'Hide',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            this.imsdomApp.quit()
          }
        },
        {
          label: 'Check for Upates',
          selector: 'Command+U',
          click: () => {
            this.imsdomApp.autoUpdater.checkForUpdates()
          }
        },
        {
          label: 'About Imsdom',
          click() {
            shell.openExternal('https://www.imsdom.com/about_us/')
          }
        }
      ]
    }

    let menuView

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      menuView = {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'Command+R',
            click: () => {
              this.mainWindow.webContents.reload()
            }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'Alt+Command+I',
            click: () => {
              this.mainWindow.webContents.toggleDevTools()
            }
          }
        ]
      }
    }

    return [menuEdit, menuView].filter(Boolean)
  }

  buildDefaultTemplate() {
    return process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
      ? [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: () => {
              this.mainWindow.webContents.reload()
            }
          },
          {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click: () => {
              this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
            }
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click: () => {
              this.mainWindow.webContents.toggleDevTools()
            }
          }
        ]
      : []
  }
}

export default MenuBuilder
