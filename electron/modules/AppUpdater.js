import path from 'path'
import fs from 'fs-extra'
import { ipcMain, app, BrowserWindow /* dialog, shell, */ } from 'electron'
import { autoUpdater, CancellationToken } from 'electron-updater'
// import fetch from 'electron-fetch'
import log from 'electron-log'
import config from '../config'

export default class AppUpdater {
  constructor(imsdomApp) {
    this.imsdomApp = imsdomApp
    this.feedUrl = config.update.feedUrl
    this.openDownloadUrl = config.update.openDownloadUrl
    this.isAutoDownload = false
    this.isDownloading = false
    this.isForceUpdate = false

    autoUpdater.logger = log
    autoUpdater.logger.transports.file.level = 'info'
    autoUpdater.autoDownload = false // imsdomApp.setting.autoUpdate
    // autoUpdater.setFeedURL(this.feedUrl)
    if (process.env.NODE_ENV === 'development') {
      autoUpdater.updateConfigPath = path.join(app.getAppPath(), 'dev-app-update.yml')
    }

    // 清除每次更新下载的文件，否则无法进行更新
    const updaterCacheDirName = 'imsdom-updater'
    const updatePendingPath = path.join(
      autoUpdater.app.baseCachePath,
      updaterCacheDirName,
      'pending'
    )

    fs.emptyDir(updatePendingPath)

    this.initMainEvents()
    this.initUpdaterEvents()
  }

  checkForUpdates(autoDownload) {
    this.isAutoDownload = autoDownload || false
    autoUpdater.checkForUpdates()
  }

  checkForUpdatesAndNotify() {
    autoUpdater.checkForUpdatesAndNotify()
  }

  sendUpdateMessage(type, data) {
    this.imsdomApp.mainWindow.webContents.send('appUpdate:message', {
      type,
      data,
      isForceUpdate: this.isForceUpdate
    })
  }

  downloadUpdate() {
    if (this.isDownloading) return
    this.cancellationToken = new CancellationToken()
    this.isDownloading = true
    autoUpdater.downloadUpdate(this.cancellationToken)
  }

  initMainEvents() {
    ipcMain.on('ipcMain:setForceUpdate', () => {
      this.isForceUpdate = true
    })

    ipcMain.on('ipcMain:checkForUpdates', (e, autoDownload) => {
      this.checkForUpdates(autoDownload)
    })

    ipcMain.on('ipcMain:checkForUpdatesAndNotify', () => {
      this.checkForUpdatesAndNotify()
    })

    ipcMain.on('ipcMain:downloadUpdate', () => {
      this.downloadUpdate()
    })

    ipcMain.on('ipcMain:cancelDownloadUpdate', () => {
      this.cancellationToken.cancel()
      this.isAutoDownload = false
      this.isDownloading = false
      this.isForceUpdate = false
    })
  }

  initUpdaterEvents() {
    autoUpdater.on('checking-for-update', message => {
      this.sendUpdateMessage('checking-for-update', message)
    })

    autoUpdater.on('update-available', message => {
      if (this.isAutoDownload) {
        this.downloadUpdate()
      }
      this.sendUpdateMessage('update-available', message)
    })

    autoUpdater.on('update-not-available', message => {
      this.sendUpdateMessage('update-not-available', message)
    })

    autoUpdater.on('download-progress', progressObj => {
      this.sendUpdateMessage('download-progress', progressObj)
    })

    autoUpdater.on(
      'update-downloaded',
      (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) => {
        ipcMain.once('ipcMain:installNow', () => {
          if (process.platform === 'win32') {
            this.imsdomApp.mainWindow.canQuit = true
          }
          setImmediate(() => {
            app.removeAllListeners('window-all-closed')
            if (process.platform === 'win32') {
              BrowserWindow.getAllWindows().forEach(window => {
                window.close()
              })
            } else {
              BrowserWindow.getAllWindows().forEach(window => {
                window.destroy()
              })
            }
            autoUpdater.quitAndInstall()
          })
        })
        this.sendUpdateMessage('update-downloaded', {
          event,
          releaseNotes,
          releaseName,
          releaseDate,
          updateUrl,
          quitAndUpdate
        })
        this.isAutoDownload = false
        this.isDownloading = false
        this.isForceUpdate = false
      }
    )

    autoUpdater.on('error', () => {
      this.isAutoDownload = false
      this.isDownloading = false
      this.isForceUpdate = false
      this.sendUpdateMessage('update-error')
      // const isDarwin = process.platform === 'darwin'
      // fetch(`${this.feedUrl}/${isDarwin ? 'latest-mac' : 'latest'}.yml`, {
      //   method: 'GET',
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json; charset=utf-8'
      //   }
      // })
      //   .then(response => {
      //     return response.text()
      //   })
      //   .then(data => {
      //     const vReg = data.match(/version:\s*([.\d]+)/)
      //     let rVersion = ''
      //     if (vReg) {
      //       // eslint-disable-next-line prefer-destructuring
      //       rVersion = vReg[1]
      //     }
      //     // 检查版本号
      //     if (rVersion && rVersion !== app.getVersion()) {
      //       dialog
      //         .showMessageBox(this.imsdomApp.mainWindow, {
      //           type: 'question',
      //           title: '版本更新',
      //           message: '已有新版本更新，是否立即前往下载最新安装包？',
      //           noLink: true,
      //           buttons: ['是', '否']
      //         })
      //         .then(({ response }) => {
      //           if (response === 0) {
      //             shell.openExternal(this.openDownloadUrl)
      //           }
      //         })
      //     }
      //   })
      //   .catch(() => {
      //     // shell.openExternal(this.openDownloadUrl)
      //   })
    })
  }
}
