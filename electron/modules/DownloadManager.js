import path from 'path'
import fse from 'fs-extra'
import { ipcMain, app, shell, dialog } from 'electron'
import { download } from 'electron-dl'
import du from 'du'

export default class DownloadManager {
  constructor(imsdomApp) {
    this.imsdomApp = imsdomApp
    this.mainWindow = imsdomApp.mainWindow
  }

  getFilesCacheDir() {
    const cacheDir = process.platform === 'win32' ? 'documents' : 'home'
    return path.join(app.getPath(cacheDir), 'ImsdomFiles', this.imsdomApp.getUserAccount())
  }

  getCacheFile(fileName) {
    return path.join(this.getFilesCacheDir(), fileName)
  }

  getAppCacheDir() {
    return path.join(app.getPath('appData'), 'imsdom', 'Cache')
  }

  initEvent() {
    ipcMain.on('ipcMain:downloadFile', async (e, fileUrl, fileName, fileId) => {
      try {
        const downloadOptions = {
          saveAs: false,
          filename: fileName,
          showBadge: false,
          directory: this.getFilesCacheDir(),
          onStarted: () => {
            this.mainWindow.webContents.send('fileDownload:onStarted', fileId)
          },
          onCancel: () => {
            this.mainWindow.webContents.send('fileDownload:onCancel', fileId)
          },
          onProgress: params => {
            this.mainWindow.webContents.send('fileDownload:onProgress', params, fileId)
          }
        }
        await download(this.mainWindow, fileUrl, downloadOptions)
        this.mainWindow.webContents.send('fileDownload:onDone', fileId)
      } catch (e) {
        this.mainWindow.webContents.send('fileDownload:onError', e, fileId)
      }
    })

    ipcMain.on('ipcMain:file:openInFolder', (e, fileName) => {
      shell.showItemInFolder(this.getCacheFile(fileName))
    })

    ipcMain.on('ipcMain:file:saveAs', async (e, fileName) => {
      try {
        const targetFilePath = this.getCacheFile(fileName)
        const { canceled, filePath } = await dialog.showSaveDialog(this.mainWindow, {
          title: '文件另存为',
          defaultPath: fileName,
          filePath: targetFilePath
        })
        if (!canceled) {
          await fse.copyFile(targetFilePath, filePath)
        }
      } catch (e) {
        console.log(e)
      }
    })

    ipcMain.on('ipcMain:file:open', (e, fileName) => {
      const fullPath = this.getCacheFile(fileName)
      const fileExist = fse.pathExistsSync(fullPath)
      if (fileExist) {
        e.returnValue = shell.openPath(fullPath)
      } else {
        e.returnValue = false
      }
    })

    ipcMain.on('ipcMain:file:delete', async (e, fileName) => {
      try {
        const filePath = this.getCacheFile(fileName)
        await fse.unlink(filePath)
      } catch (e) {
        console.log(e)
      }
    })

    ipcMain.on('ipcMain:file:existSync', (e, fileName) => {
      e.returnValue = fse.pathExistsSync(this.getCacheFile(fileName))
    })

    const measureCacheSize = async () => {
      try {
        const sizes = await Promise.all([du(this.getFilesCacheDir()), du(this.getAppCacheDir())])
        const total = sizes.reduce((p, n) => p + n)
        this.mainWindow.webContents.send('stats:folderSize', total)
      } catch (e) {
        console.log(e)
      }
    }

    ipcMain.on('ipcMain:statFolderSize', () => {
      measureCacheSize()
    })

    ipcMain.on('ipcMain:clearCache', async () => {
      try {
        await fse.emptyDir(this.getFilesCacheDir())
        await fse.emptyDir(this.getAppCacheDir())
        // fs.rmdirSync(this.getAppCacheDir(), { recursive: true })
        // await del(this.getAppCacheDir(), {force: true})
      } catch (e) {
        console.log(e)
      } finally {
        measureCacheSize()
      }
    })
  }
}
