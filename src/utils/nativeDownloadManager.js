// import { message } from 'antd'
import { DownloaderHelper } from '@/utils/downloadHelper'
import { getOssSpaceFileUrl } from '@/utils/space'
import { dispatchCustomEvent, downloadPool } from '@/utils/utils'
import { store } from '@/index'

export function openSaveDialog(options) {
  const { dialog } = require('electron').remote
  return dialog.showOpenDialog(options)
}

export function getSavePath(options = {}) {
  return new Promise((resolve, reject) => {
    openSaveDialog({
      title: '选择文件夹',
      properties: ['openFile', 'openDirectory'],
      ...options
    })
      .then(res => {
        if (res.filePaths.length > 0) {
          resolve(res.filePaths[0])
        } else {
          reject(res)
        }
      })
      .catch(reject)
  })
}

// function saveBlob(blob, fileName, savePath) {
//   const fs = require('fs')
//   const path = require('path')
//   savePath = getUniqPathByFileNameSync(path.resolve(savePath, fileName))
//   fs.writeFileSync(savePath, blob)
// }

function getUniqPathByNameSync(path) {
  if (typeof path !== 'string' || path === '') {
    return path
  }

  try {
    // if access fail, the file doesnt exist yet
    const fs = require('fs')
    fs.accessSync(path, fs.F_OK)
    const pathInfo = path.match(/(.*)(\([0-9]+\))(\..*)?$/)
    let base = pathInfo ? pathInfo[1].trim() : path
    let suffix = pathInfo ? parseInt(pathInfo[2].replace(/\(|\)/, ''), 10) : 0
    let ext = path.split('.').pop()

    if (ext !== path) {
      ext = `.${ext}`
      base = base.replace(ext, '')
    } else {
      ext = ''
    }

    // generate a new path until it doesn't exist
    return getUniqPathByNameSync(`${base} (${++suffix})${ext}`)
  } catch (err) {
    return path
  }
}

export function getUniqNameByPathSync(savePath, fileName) {
  const path = require('path')
  return path.basename(getUniqPathByNameSync(path.resolve(savePath, fileName)))
}

export function downloadFile(fileUrl, fileName, fileId, savePath) {
  const dl = new DownloaderHelper(fileUrl, savePath, { fileName, progressThrottle: 100 })
  return new Promise((resolve, reject) => {
    dl.on('download', () => {
      downloadPool.add(fileId, dl)
      dispatchCustomEvent('web:downloadFile:start', { fileId })
    })
    dl.on('progress.throttled', stats => {
      // eslint-disable-next-line no-bitwise
      stats.percentage = stats.progress >> 0
      dispatchCustomEvent('web:downloadFile:progress', { progress: stats, fileId })
    })
    dl.on('end', stats => {
      downloadPool.remove(fileId)
      dispatchCustomEvent('web:downloadFile:complete', { fileId, ...stats })
      resolve()
    })
    dl.on('beforeStop', () => {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject('space download stopped')
    })
    dl.on('stop', () => {
      downloadPool.remove(fileId)
    })
    dl.on('timeout', () => {
      downloadPool.remove(fileId)
      resolve()
    })
    dl.on('error', error => {
      // downloadPool.remove(fileId)
      dispatchCustomEvent('web:downloadFile:error', { error, fileId })
      resolve()
    })
    dl.start()
  })
}

export async function downloadOssSpaceFile(
  fileId,
  fileName,
  showLoading = true,
  savePath,
  knowledgeBaseId
) {
  let hideLoading
  if (showLoading) {
    // hideLoading = message.loading('下载链接获取中...', 0)
    hideLoading = () => {}
  } else {
    hideLoading = () => {}
  }
  try {
    const realFileId = fileId.split('|')[0]
    const fileUrl = await getOssSpaceFileUrl(realFileId, knowledgeBaseId)
    if (store.getState().cloud.oss.downloadStopped) {
      return Promise.reject()
    }
    const newFileName = getUniqNameByPathSync(savePath, fileName)
    const dl = downloadFile(fileUrl, newFileName, fileId, savePath)
    return { fileUrl, newFileName, dl }
  } catch (e) {
    console.error('download error', e)
  } finally {
    hideLoading()
  }
}

export async function downloadOssSpaceFileWithBucket(params, savePath) {
  try {
    const fileUrl = await getOssSpaceFileUrl(params)
    const newFileName = getUniqNameByPathSync(savePath, params.fileName)
    const dl = downloadFile(fileUrl, newFileName, params.fileId, savePath)
    return { fileUrl, newFileName, dl }
  } catch (e) {
    console.error('download error', e)
  }
}
