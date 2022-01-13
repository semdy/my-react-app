import { parse, stringify } from 'qs'
import { notification } from 'antd'
import copy from 'copy-to-clipboard'
import fetchProgress from 'fetch-progress'
import moment from 'moment'
import momentTimeZone from 'moment-timezone'
import html2Text from 'textversionjs'
import UAParser from 'ua-parser-js'
import emojiObj from '@/config/emoji'
import appConfigObj from '@/config/app'
import { history } from '@/index'
import { buildUrlLink, domainList, emailReg, extractUrl, schemaList } from '@/utils/url'
import cookieManager from '@/utils/cookie'
import { getFormatFileType } from '@/utils/space'
import { intl } from '@/locales'

// 唯一报错的key
const notifiKey = 'notifiOnly'

// browser 信息
let browser = null

export function getPageQuery() {
  return parse(window.location.href.split('?')[1])
}

export function getQueryPath(path = '', query = {}) {
  const search = stringify(query)
  if (search.length) {
    return `${path}?${search}`
  }
  return path
}

export function isEmptyObject(obj) {
  if (typeof obj === 'object') {
    if (obj === null) return true
    // eslint-disable-next-line
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false
      }
    }
    return true
  }
  return false
}

export function isPromise(obj) {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  )
}

export function getRandomNum() {
  // eslint-disable-next-line no-bitwise
  return ((Math.random() * 1e15) >>> 0) + Date.now()
}

export function getRegionInfo() {
  return [
    {
      countryNo: 1006,
      countryName: intl.t({ id: 'Login.00015', defaultMessage: '台湾' }),
      phoneCode: '+886'
    },
    {
      countryNo: 1005,
      countryName: intl.t({ id: 'Login.00016', defaultMessage: '英国' }),
      phoneCode: '+44'
    },
    {
      countryNo: 1004,
      countryName: intl.t({ id: 'Login.00017', defaultMessage: '韩国' }),
      phoneCode: '+82'
    },
    {
      countryNo: 1003,
      countryName: intl.t({ id: 'Login.00018', defaultMessage: '日本' }),
      phoneCode: '+81'
    },
    {
      countryNo: 1002,
      countryName: intl.t({ id: 'Login.00019', defaultMessage: '美国' }),
      phoneCode: '+1'
    },
    {
      countryNo: 1001,
      countryName: intl.t({ id: 'Login.00020', defaultMessage: '中国' }),
      phoneCode: '+86'
    }
  ]
}

export const uuid = (() => {
  const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
  return function (len, radix) {
    const chars = CHARS
    const uuid = []
    let i
    radix = radix || chars.length

    if (len) {
      // Compact form
      // eslint-disable-next-line no-bitwise
      for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)]
    } else {
      // rfc4122, version 4 form
      let r

      // rfc4122 requires these characters
      // eslint-disable-next-line no-multi-assign
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
      uuid[14] = '4'

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          // eslint-disable-next-line no-bitwise
          r = 0 | (Math.random() * 16)
          // eslint-disable-next-line no-bitwise
          uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r]
        }
      }
    }

    return uuid.join('')
  }
})()

export function encode(map, _content) {
  const content = `${_content}`
  if (!map || !content) {
    return content || ''
  }
  return content.replace(map.r, $1 => {
    const result = map[!map.i ? $1.toLowerCase() : $1]
    return result != null ? result : $1
  })
}

export const htmlEncode = (() => {
  const reg = /<br\/?>$/
  const map = {
    // eslint-disable-next-line no-useless-escape
    r: /\<|\>|\&|\r|\n|\s|\'|\"/g,
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    ' ': '&nbsp;',
    '"': '&quot;',
    "'": '&apos;', // eslint-disable-line
    '\n': '<br/>',
    '\r': ''
  }
  return _content => {
    const content = encode(map, _content)
    return content.replace(reg, '<br/>')
  }
})()

export function htmlDecode(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'") // eslint-disable-line
    .replace(/&#39;/g, "'") // eslint-disable-line
    .replace(/<br\s*\/?>/g, '\n')
}

export function eraseHtmlTag(str, keepBr) {
  if (typeof str !== 'string') {
    str = String(str)
  }
  if (keepBr) return str.replace(/<br\s*\/?>/g, '\n').replace(/(<[^>]+?>)|(&nbsp;)/g, '')
  return str.replace(/(<[^>]+?>)|(&nbsp;)/g, '')
}

export const isJSON = str => {
  if (typeof str === 'string') {
    // str = str.trim()
    return str.startsWith('{') || str.startsWith('[')
  }
  return false
}

export const isObject = str => {
  if (typeof str === 'object') {
    return true
  }
  return isJSON(str)
}

// export function copyToClipboard(text) {
//   return new Promise((resolve, reject) => {
//     text = String(text || '')
//     let input = document.createElement('textarea')
//     input.style.cssText = 'position:absolute;top:-9999px;opacity:0;'
//     // 兼容在iOS环境下瞬间拉起键盘又缩回的闪烁
//     input.setAttribute('readonly', 'readonly')
//     input.value = text
//     document.body.appendChild(input)
//     input.select()
//     try {
//       const isSuccess = document.execCommand('copy', false, null)
//       if (isSuccess) {
//         resolve()
//       } else {
//         reject()
//       }
//     } catch (e) {
//       reject(e)
//     }
//     document.body.removeChild(input)
//     input = null
//   })
// }

export function copyToClipboard(text, options = { format: 'text/plain' }) {
  return new Promise((resolve, reject) => {
    if (copy(text, options)) {
      resolve()
    } else {
      reject()
    }
  })
}

export function copyImageDataToClipboard(img, type) {
  const dataURL = convertImgToBase64(img)
  if (process.env.REACT_APP_ENV === 'electron') {
    const { clipboard, nativeImage } = require('electron')
    const nImage = nativeImage.createFromDataURL(dataURL)
    clipboard.writeImage(nImage, type)
    return Promise.resolve()
  }
  if (navigator.clipboard && window.ClipboardItem) {
    const blob = convertBase64ToBlob(dataURL)
    const item = new window.ClipboardItem({
      [blob.type]: blob
    })
    return navigator.clipboard.write([item])
  }
  return copyToClipboard(`<img src="${dataURL}">`, {
    format: 'text/html'
  })
}

export function getSelectionPosition() {
  let left
  let top
  let selection
  if (document.selection) {
    selection = document.selection.createRange()
    left = selection.boundingLeft + selection.boundingWidth
    top = selection.boundingTop + selection.boundingHeight
  } else {
    selection = window.getSelection()
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    left = rect.right
    top = rect.bottom
  }

  return {
    left,
    top
  }
}

export function insertAtCaret(inputElement, insertValue) {
  if (document.selection) {
    inputElement.focus()
    const sel = document.selection.createRange()
    sel.text = insertValue
    inputElement.focus()
  } else if (
    inputElement.setSelectionRange &&
    (inputElement.selectionStart || inputElement.selectionStart === '0')
  ) {
    const rangeStart = inputElement.selectionStart
    const rangeEnd = inputElement.selectionEnd
    const lastScrollTop = inputElement.scrollTop
    const tempStr1 = inputElement.value.substring(0, rangeStart)
    const tempStr2 = inputElement.value.substring(rangeEnd)
    inputElement.value = tempStr1 + insertValue + tempStr2
    inputElement.focus()
    inputElement.selectionStart = rangeStart + insertValue.length
    inputElement.selectionEnd = rangeStart + insertValue.length
    inputElement.scrollTop = lastScrollTop
  } else {
    inputElement.value += insertValue
    inputElement.focus()
  }
}

// 获得富文本框中光标的位置
export function getCursorPosition(element) {
  const doc = element.ownerDocument || element.document
  const win = doc.defaultView || doc.parentWindow
  let sel
  if (typeof win.getSelection !== 'undefined') {
    sel = win.getSelection()
    if (sel.rangeCount > 0) {
      const range = win.getSelection().getRangeAt(0)
      return range.getBoundingClientRect()
    }
  }
  return element.getBoundingClientRect()
}

export function getContentFromSelection() {
  const range = window.getSelection().getRangeAt(0)
  const fragment = range.cloneContents()
  const doc = document.createElement('div')
  doc.appendChild(fragment)
  return doc.innerHTML
}

export function parseStringFromHTML(content) {
  const styleConfig = {
    keepNbsps: true,
    imgProcess: (src, alt) => {
      let className = ''
      if (/^\[[^\]]+\]$/.test(alt)) {
        className = 'emoji-small'
      }
      return `<img class="${className}" src="${src}" alt="${alt}" style="max-width: 180px; max-height: 180px;" />`
    },
    linkProcess: (href, linkText) => {
      return linkText
    }
  }
  content = content.replace(/<br\s*\/?>/gm, '%n%')
  return html2Text(content, styleConfig)
    .trimRight()
    .replace(/\n+$/g, '')
    .replace(/\n/g, '<br>')
    .replace(/%n%/g, '<br>')
    .replace(/\s/g, '&nbsp;')
    .replace(/<\/?a[^>]+?>/g, '')
    .replace(/&lt;img.*&gt;/g, match => htmlDecode(match))
}

export function parseStringFromSelection() {
  return parseStringFromHTML(getContentFromSelection())
}

export function isImgUrl(url) {
  return /(^https?:\/\/)|(\.(png|jpe?g|webp|svg|gif|bmp|apng)$)|(^data:image\/)/i.test(url)
}

export function isBlobUrl(url) {
  return /^blob:/.test(url)
}

export function getBase64(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result)
      reader.onload = null
      reader = null
    }
    reader.onerror = err => {
      reader.onerror = null
      reader = null
      reject(err)
    }
    reader.readAsDataURL(file)
  })
}

export function downloadBlob(data, fileName) {
  if (typeof data === 'string') {
    window.location.href = data
    return
  }
  let blob
  try {
    blob = new Blob([data], { type: 'application/zip' })
  } catch (e) {
    // 旧版本浏览器下的blob创建对象
    window.BlobBuilder =
      window.BlobBuilder ||
      window.WebKitBlobBuilder ||
      window.MozBlobBuilder ||
      window.MSBlobBuilder
    if (e.name === 'TypeError' && window.BlobBuilder) {
      const blobBuilder = new window.BlobBuilder()
      window.BlobBuilder.append(data)
      blob = blobBuilder.getBlob('application/zip')
    } else {
      notification.error({
        key: notifiKey,
        message: 'download error',
        description: intl.t({
          id: 'Common.00007',
          defaultMessage: '浏览器版本较低，暂不支持该文件类型下载.'
        })
      })
    }
  }

  // IE10+
  if (window.navigator.msSaveOrOpenBlob) {
    return window.navigator.msSaveOrOpenBlob(blob, fileName)
  }

  let linkElement = document.createElement('a')
  let url = window.URL.createObjectURL(blob)
  linkElement.setAttribute('href', url)
  linkElement.setAttribute('download', fileName)
  linkElement.click()
  window.URL.revokeObjectURL(url)
  linkElement = null
  url = null
}

export const downloadPool = {
  pool: {},
  add(fileId, instance) {
    this.pool[fileId] = instance
  },
  get(fileId) {
    return this.pool[fileId]
  },
  getAll() {
    return this.pool
  },
  remove(fileId) {
    delete this.pool[fileId]
  },
  clear() {
    this.pool = {}
  }
}

export function downloadFile(url, fileName, fileId, _resolve, _reject) {
  let fileSize
  const controller = new AbortController()
  const { signal } = controller
  let readableResponse
  const promise = new Promise((resolve, reject) => {
    if (!_resolve && !_reject) {
      _resolve = resolve
      _reject = reject
    }
    const handleResponse = fetchProgress({
      onProgress(progress) {
        fileSize = progress.total
        dispatchCustomEvent('web:downloadFile:progress', { progress, fileId })
      },
      onComplete() {
        downloadPool.remove(fileId)
        dispatchCustomEvent('web:downloadFile:complete', { fileId, fileSize })
        _resolve()
      },
      onError(error) {
        if (typeof error === 'object' && error.message.indexOf('abort') === -1) {
          downloadPool.remove(fileId)
          _resolve()
        }
        dispatchCustomEvent('web:downloadFile:error', { error, fileId })
      }
    })
    fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      signal
    })
      .then(response => {
        readableResponse = handleResponse(response)
        return readableResponse
      })
      .then(response => {
        if (response.ok) {
          dispatchCustomEvent('web:downloadFile:start', { fileId })
          // const mimeType = response.headers.get('Content-Type')
          // // 除了pdf和图片文件，其它直接走系统自带下载器下载
          // if (mimeType !== 'application/pdf' && !/^image\//.test(mimeType)) {
          //   downloadBlob(url, fileName)
          //   return Promise.resolve()
          // }
          return response.blob()
        }
        throw new Error('Network response error.')
      })
      .then(blob => {
        if (blob) {
          downloadBlob(blob, fileName)
        }
        return blob
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          if (readableResponse && readableResponse.body) {
            readableResponse.body.cancel()
          }
        } else {
          notification.error({
            key: notifiKey,
            message: 'Download error',
            description: err.message
          })
        }
      })
  })

  promise.pause = () => {
    controller.abort()
    // downloadPool.remove(fileId)
    // _reject()
  }

  promise.stop = () => {
    controller.abort()
    downloadPool.remove(fileId)
    _reject()
  }

  promise.resume = () => {
    return downloadFile(url, fileName, fileId, _resolve, _reject)
  }

  promise.retry = () => {
    return downloadFile(url, fileName, fileId, _resolve, _reject)
  }

  downloadPool.add(fileId, promise)
  return promise
}

export function preloadImg(url) {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.onload = function () {
      img.onload = null
      img = null
      resolve(this)
    }
    img.onerror = function () {
      img.onerror = null
      img = null
      reject(new Error('Image load error'))
    }
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

// 清除验证码倒计时缓存
export function clearCountDownCache() {
  Object.keys(localStorage).forEach(cacheName => {
    if (cacheName.indexOf('_lastCountDownStamp:') === 0) {
      localStorage.removeItem(cacheName)
    }
  })
}

export function sleep(ms) {
  if (ms === undefined) return Promise.resolve()
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve), ms)
}

export function dispatchHTMLEvent(type, detail) {
  const event = document.createEvent('HTMLEvents')
  event.detail = detail
  event.initEvent(type, true, false)
  window.dispatchEvent(event)
}

export function dispatchCustomEvent(type, detail) {
  const event = document.createEvent('CustomEvent')
  event.initCustomEvent(type, false, false, detail)
  window.dispatchEvent(event)
}

export function getWeekDayCN(day) {
  const dayMap = {
    1: intl.t({ id: 'Cal.00026', defaultMessage: '周一' }),
    2: intl.t({ id: 'Cal.00027', defaultMessage: '周二' }),
    3: intl.t({ id: 'Cal.00028', defaultMessage: '周三' }),
    4: intl.t({ id: 'Cal.00029', defaultMessage: '周四' }),
    5: intl.t({ id: 'Cal.00030', defaultMessage: '周五' }),
    6: intl.t({ id: 'Cal.00031', defaultMessage: '周六' }),
    0: intl.t({ id: 'Cal.00025', defaultMessage: '周日' })
  }
  return dayMap[day]
}

export function getViewTypMap() {
  return {
    1: intl.t({ id: 'Cal.00171', defaultMessage: '日视图' }),
    2: intl.t({ id: 'Cal.00172', defaultMessage: '周视图' }),
    3: intl.t({ id: 'Cal.00173', defaultMessage: '月视图' }),
    4: intl.t({ id: 'Cal.00174', defaultMessage: '列表视图' })
  }
}

export function getViewTypeList() {
  const map = getViewTypMap()
  return Object.keys(map).map(key => {
    return { key: +key, text: map[key] }
  })
}

export function getRepeatMap() {
  return {
    1: intl.t({ id: 'Cal.00175', defaultMessage: '不重复' }),
    2: intl.t({ id: 'Cal.00176', defaultMessage: '每天重复' }),
    3: intl.t({ id: 'Cal.00177', defaultMessage: '每周重复' }),
    4: intl.t({ id: 'Cal.00178', defaultMessage: '每月重复' }),
    5: intl.t({ id: 'Cal.00179', defaultMessage: '每年重复' }),
    6: intl.t({ id: 'Cal.00180', defaultMessage: '每个工作日重复' })
  }
}

export function getRepeatList() {
  const map = getRepeatMap()
  return Object.keys(map).map(key => {
    return { key: +key, value: map[key] }
  })
}

export function getAlertTypMap() {
  return {
    0: intl.t({ id: 'Cal.00182', defaultMessage: '事件发生时' }),
    5: intl.t({ id: 'Cal.00183', defaultMessage: '5分钟前' }),
    15: intl.t({ id: 'Cal.00184', defaultMessage: '15分钟前' }),
    30: intl.t({ id: 'Cal.00185', defaultMessage: '30分钟前' }),
    60: intl.t({ id: 'Cal.00186', defaultMessage: '1小时前' }),
    120: intl.t({ id: 'Cal.00187', defaultMessage: '2小时前' }),
    1440: intl.t({ id: 'Cal.00188', defaultMessage: '1天前' }),
    2880: intl.t({ id: 'Cal.00189', defaultMessage: '2天前' }),
    10080: intl.t({ id: 'Cal.00190', defaultMessage: '1周前' })
  }
}

export function getAlertTypList() {
  const map = getAlertTypMap()
  return Object.keys(map).map(key => {
    return { key: +key, value: map[key] }
  })
}

export function getAlertAllDayTypList() {
  return [
    {
      key: -9 * 60,
      value: intl.t({ id: 'Cal.00191', defaultMessage: '日程当天（09:00）' })
    },
    {
      key: 15 * 60,
      value: intl.t({ id: 'Cal.00192', defaultMessage: '1天前（09:00）' })
    },
    {
      key: (24 + 15) * 60,
      value: intl.t({ id: 'Cal.00193', defaultMessage: '2天前（09:00）' })
    },
    {
      key: (24 * 6 + 15) * 60,
      value: intl.t({ id: 'Cal.00194', defaultMessage: '1周前（09:00）' })
    }
  ]
}

export function getPermissionLevelMap() {
  return {
    0: intl.t({ id: 'Cal.00195', defaultMessage: '默认公开的范围' }),
    1: intl.t({ id: 'Cal.00196', defaultMessage: '私密' }),
    3: intl.t({ id: 'Cal.00197', defaultMessage: '公开' })
  }
}

export function getPrivacyTypList() {
  const map = getPermissionLevelMap()
  return Object.keys(map).map(key => {
    return { key: +key, value: map[key] }
  })
}

export function getBusyMap() {
  return {
    0: intl.t({ id: 'Cal.00198', defaultMessage: '空闲' }),
    1: intl.t({ id: 'Cal.00199', defaultMessage: '忙碌' })
  }
}

export function getBusyTypList() {
  const map = getBusyMap()
  return Object.keys(map).map(key => {
    return { key: +key, value: map[key] }
  })
}

export function getRepeatTypList() {
  return [
    { key: 1, value: intl.t({ id: 'Cal.00200', defaultMessage: '天' }) },
    { key: 2, value: intl.t({ id: 'Cal.00201', defaultMessage: '周' }) },
    { key: 3, value: intl.t({ id: 'Cal.00202', defaultMessage: '个月' }) },
    { key: 4, value: intl.t({ id: 'Cal.00203', defaultMessage: '年' }) }
  ]
}

export function getMonthRepeatList() {
  return [
    { key: 1, value: intl.t({ id: 'Cal.00204', defaultMessage: '按日期重复' }) },
    { key: 2, value: intl.t({ id: 'Cal.00205', defaultMessage: '按星期重复' }) }
  ]
}

export function getPublicScopeList() {
  return [
    {
      key: 1,
      value: intl.t({ id: 'Cal.00196', defaultMessage: '私密' }),
      desc: intl.t({ id: 'Cal.00207', defaultMessage: '仅自己可见' })
    },
    {
      key: 2,
      value: intl.t({ id: 'Cal.00206', defaultMessage: '仅显示忙碌' }),
      desc: intl.t({ id: 'Cal.00208', defaultMessage: '可被搜到，仅向他人显示是否“忙碌”' })
    },
    {
      key: 3,
      value: intl.t({ id: 'Cal.00197', defaultMessage: '公开' }),
      desc: intl.t({ id: 'Cal.00209', defaultMessage: '可被搜到，显示日程详情' })
    }
  ]
}

export function getAttenderTypMap() {
  return {
    1: intl.t({ id: 'Cal.00210', defaultMessage: '游客' }),
    2: intl.t({ id: 'Cal.00211', defaultMessage: '订阅者' }),
    3: intl.t({ id: 'Cal.00212', defaultMessage: '编辑者' }),
    4: intl.t({ id: 'Cal.00213', defaultMessage: '管理员' })
  }
}

export function getAttenderTypList() {
  return [
    {
      key: 1,
      value: intl.t({ id: 'Cal.00210', defaultMessage: '游客' }),
      desc: intl.t({ id: 'Cal.00214', defaultMessage: '只能看到忙碌/空闲信息' })
    },
    {
      key: 2,
      value: intl.t({ id: 'Cal.00211', defaultMessage: '订阅者' }),
      desc: intl.t({ id: 'Cal.00215', defaultMessage: '查看所有日程详情' })
    },
    {
      key: 3,
      value: intl.t({ id: 'Cal.00212', defaultMessage: '编辑者' }),
      desc: intl.t({ id: 'Cal.00216', defaultMessage: '创建及修改日程' })
    },
    {
      key: 4,
      value: intl.t({ id: 'Cal.00213', defaultMessage: '管理员' }),
      desc: intl.t({ id: 'Cal.00217', defaultMessage: '管理日历及共享设置' })
    }
  ]
}

export function thirtyList() {
  return Array.from({ length: 30 }).map((item, index) => {
    return { key: index + 1, value: index + 1 }
  })
}

function formatList(arr, key) {
  if (!arr.length) return []
  return arr.map(item => {
    return {
      id: item.eventId,
      resourceId: key || '',
      title: item.eventTitle,
      start: item.startTime,
      end: item.endTime,
      allDay: item.isAllDay,
      backgroundColor: item.eventColor,
      borderColor: item.eventColor,
      type: item.type,
      calendarId: item.calendarId,
      eventId: item.eventId,
      truncateTime: item.truncateTime,
      startZoneNoGmtNumber: item.startZoneNoGmtNumber,
      endZoneNoGmtNumber: item.endZoneNoGmtNumber,
      repeatType: item.repeatType,
      roomName: item.roomName,
      acceptType: item.acceptType,
      ownerMemberName: item.ownerMemberName
    }
  })
}

function repeatList(arr) {
  const tmpList = []
  arr.forEach(item => {
    const { repeatType, start, end, truncateTime } = item
    const durationTimeDay = Math.max(Math.floor((truncateTime - start) / 8.64e7), 0)
    const durationTimeWeek = Math.max(Math.floor((truncateTime - start) / 6.048e8), 0)
    const durationTimeMonth = Math.max(Math.floor((truncateTime - start) / 2.592e9), 0)
    const durationTimeYear = Math.max(Math.floor((truncateTime - start) / 3.1536e10), 0)
    // 每天重复
    if (repeatType === 2) {
      new Array(durationTimeDay).fill('').forEach((innerItem, innerIndex) => {
        tmpList.push({
          ...item,
          start: repeatTime(repeatType, start, end, innerIndex + 1).start,
          end: repeatTime(repeatType, start, end, innerIndex + 1).end
        })
      })
    }
    // 每周重复
    if (repeatType === 3) {
      new Array(durationTimeWeek).fill('').forEach((innerItem, innerIndex) => {
        tmpList.push({
          ...item,
          start: repeatTime(repeatType, start, end, innerIndex + 1).start,
          end: repeatTime(repeatType, start, end, innerIndex + 1).end
        })
      })
    }
    // 每月重复
    if (repeatType === 4) {
      const date = moment(start).date()
      const thisMonthDate = moment().date(date).valueOf()
      if (thisMonthDate < truncateTime) {
        new Array(durationTimeMonth).fill('').forEach((innerItem, innerIndex) => {
          tmpList.push({
            ...item,
            start: repeatTime(repeatType, start, end, innerIndex + 1).start,
            end: repeatTime(repeatType, start, end, innerIndex + 1).end
          })
        })
      }
    }
    // 每年重复
    if (repeatType === 5) {
      const date = moment(start).dayOfYear()
      const thisYearDate = moment().dayOfYear(date).valueOf()
      if (thisYearDate < truncateTime) {
        new Array(durationTimeYear).fill('').forEach((innerItem, innerIndex) => {
          tmpList.push({
            ...item,
            start: repeatTime(repeatType, start, end, innerIndex + 1).start,
            end: repeatTime(repeatType, start, end, innerIndex + 1).end
          })
        })
      }
    }
    // 工作日重复
    if (repeatType === 6) {
      new Array(durationTimeDay).fill('').forEach((innerItem, innerIndex) => {
        const day = moment(repeatTime(repeatType, start, end, innerIndex + 1).start).day()
        if (day !== 0 && day !== 6) {
          tmpList.push({
            ...item,
            start: repeatTime(repeatType, start, end, innerIndex + 1).start,
            end: repeatTime(repeatType, start, end, innerIndex + 1).end
          })
        }
      })
    }
  })
  return tmpList
}

function repeatTime(repeatType, st, et, duration) {
  switch (repeatType) {
    case 2:
      return {
        start: st + duration * 8.64e7,
        end: et + duration * 8.64e7
      }
    case 3:
      return {
        start: st + duration * 6.048e8,
        end: et + duration * 6.048e8
      }
    case 4:
      const monthDayStart = moment(st).add(duration, 'month').valueOf()
      const monthDayEnd = moment(et).add(duration, 'month').valueOf()
      return {
        start: monthDayStart,
        end: monthDayEnd
      }
    case 5:
      const yearDayStart = moment(st).add(duration, 'year').valueOf()
      const yearDayEnd = moment(et).add(duration, 'year').valueOf()
      return {
        start: yearDayStart,
        end: yearDayEnd
      }
    case 6:
      return {
        start: st + duration * 8.64e7,
        end: et + duration * 8.64e7
      }
    default:
      return {
        start: st,
        end: et
      }
  }
}

export function formatEventListRes(list) {
  let tmpList = []
  if (!list.length) {
    return [{ events: [{}] }]
  }
  list.forEach(item => {
    tmpList.push({ calendarId: item.calendarId, events: [] })
  })
  tmpList = unique(tmpList)
  tmpList.forEach(outer => {
    const tmpCalList = formatList(list.filter(inner => inner.calendarId === outer.calendarId))
    outer.events = outer.events.concat(tmpCalList)
    const rList = repeatList(outer.events)
    outer.events = outer.events.concat(rList)
  })
  return tmpList
}

export function formatPersonEventListRes(obj) {
  let tmpList = []
  if (JSON.stringify(obj) === '{}') {
    return [{ events: [{}] }]
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(obj)) {
    const tmpCalList = formatList(obj[key], key)
    tmpList = tmpList.concat(tmpCalList)
  }
  const rList = repeatList(tmpList)
  tmpList = tmpList.concat(rList)
  return tmpList
}

export function easyCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function unique(arr) {
  const unique = {}
  arr.forEach(item => {
    unique[JSON.stringify(item)] = item
  })
  arr = Object.keys(unique).map(u => {
    return JSON.parse(u)
  })
  return arr
}

export function uniqueObjectArray(arrayObject, key1, key2) {
  const tmp = {}
  arrayObject.forEach(item => {
    tmp[item[key1] || item[key2]] = item
  })
  return Object.values(tmp)
}

export function distinct(a, b, key) {
  const json = a.concat(b)
  const newJson = []
  let i = 0
  let j = 0

  for (; i < json.length; i++) {
    let flag = true
    const item1 = json[i]
    for (; j < newJson.length; j++) {
      const item2 = newJson[j]
      if (item1[key] === item2[key]) {
        flag = false
      }
    }

    if (flag) {
      newJson.push(item1)
    }
  }
  return newJson
}

export function colorRgb(sColor, size) {
  sColor = sColor.toLowerCase()
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/
  if (sColor && reg.test(sColor)) {
    if (sColor.length === 4) {
      let sColorNew = '#'
      for (let i = 1; i < 4; i += 1) {
        sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1))
      }
      sColor = sColorNew
    }
    // 处理六位的颜色值
    const sColorChange = []
    for (let i = 1; i < 7; i += 2) {
      // eslint-disable-next-line radix
      const colorInt = parseInt(`0x${sColor.slice(i, i + 2)}`)
      sColorChange.push(colorInt > size ? colorInt - size : colorInt)
    }
    return `rgb(${sColorChange.join(',')})`
  }
  return sColor
}

export function colorRgba(sColor, opacity) {
  sColor = sColor.toLowerCase()
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/
  if (sColor && reg.test(sColor)) {
    if (sColor.length === 4) {
      let sColorNew = '#'
      for (let i = 1; i < 4; i += 1) {
        sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1))
      }
      sColor = sColorNew
    }
    // 处理六位的颜色值
    const sColorChange = []
    for (let i = 1; i < 7; i += 2) {
      // eslint-disable-next-line radix
      sColorChange.push(parseInt(`0x${sColor.slice(i, i + 2)}`))
    }
    return `rgba(${sColorChange.join(',')},${opacity})`
  }
  return sColor
}

// 随机颜色
export function randomColor(list) {
  return colorRgba(list[Math.floor(Math.random() * 15)].value, 0.3)
}

// 阿里云图片压缩
export function imgCompress(url, size) {
  return `${url}&x-oss-process=image/resize,m_lfit,h_0,w_${size}/quality,Q_50`
}

// 检测浏览器名称
export function getBrowserName() {
  const UserAgent = navigator.userAgent.toLowerCase()
  let browser = null
  const browserArray = {
    IE: window.ActiveXObject || 'ActiveXObject' in window, // IE
    Chrome: UserAgent.indexOf('chrome') > -1 && UserAgent.indexOf('safari') > -1, // Chrome浏览器
    Firefox: UserAgent.indexOf('firefox') > -1, // 火狐浏览器
    Opera: UserAgent.indexOf('opera') > -1, // Opera浏览器
    Safari: UserAgent.indexOf('safari') > -1 && UserAgent.indexOf('chrome') === -1, // safari浏览器
    Edge: UserAgent.indexOf('edge') > -1, // Edge浏览器
    QQBrowser: /qqbrowser/.test(UserAgent), // qq浏览器
    WeixinBrowser: /MicroMessenger/i.test(UserAgent) // 微信浏览器
  }
  // eslint-disable-next-line
  for (const i in browserArray) {
    if (Object.hasOwnProperty.call(browserArray, i) && browserArray[i]) {
      browser = i
    }
  }
  return browser
}

// 检测操作系统OS名称
export function getOperationSys() {
  const { userAgent, platform } = window.navigator
  if (platform === 'Win32' || platform === 'Windows') {
    return 'Windows'
  }
  if (
    platform === 'Mac68K' ||
    platform === 'MacPPC' ||
    platform === 'Macintosh' ||
    platform === 'MacIntel'
  ) {
    return 'Mac'
  }
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'ios'
  }
  if (userAgent.indexOf('Android') > -1) {
    return 'Android'
  }
  if (userAgent.indexOf('Linux') > -1 || platform.indexOf('Linux') > -1) {
    return 'Linux'
  }
  return 'Unknown OS'
}

// 时区猜测并返回时区对象
export function guessTimeZone(allList) {
  const guessZoneId = momentTimeZone.tz.guess(true)
  let getZone = null
  allList.some(item => {
    if (item.zoneId === guessZoneId) {
      getZone = item
      return true
    }
    return false
  })
  if (getZone) return getZone
  const gmt = momentTimeZone.tz(guessZoneId).format('Z')
  const gmtNumber = Number(gmt.split(':')[0])
  allList.some(item => {
    if (item.gmtNumber === gmtNumber) {
      getZone = item
      return true
    }
    return false
  })
  return getZone
}

export function getUtcOffset(returnNum) {
  if (returnNum) return zoneNum
  const zoneNum = moment().utcOffset() / 60
  let zoneStr = ''
  if (zoneNum > 0) {
    if (zoneNum > 9) {
      zoneStr = `+${zoneNum}:00`
    } else {
      zoneStr = `+0${zoneNum}:00`
    }
  } else if (Math.abs(zoneNum) > 9) {
    zoneStr = `-${Math.abs(zoneNum)}:00`
  } else {
    zoneStr = `-0${Math.abs(zoneNum)}:00`
  }

  return zoneStr
}

export function convertBase64ToBlob(base64) {
  const base64Arr = base64.split(',')
  let imgtype = ''
  let base64String = ''
  if (base64Arr.length > 1) {
    // 如果是图片base64，去掉头信息
    // eslint-disable-next-line prefer-destructuring
    base64String = base64Arr[1]
    imgtype = base64Arr[0].substring(base64Arr[0].indexOf(':') + 1, base64Arr[0].indexOf(';'))
  }
  // 将base64解码
  const bytes = atob(base64String)
  const bytesCode = new ArrayBuffer(bytes.length)
  // 转换为类型化数组
  const byteArray = new Uint8Array(bytesCode)

  // 将base64转换为ascii码
  for (let i = 0; i < bytes.length; i++) {
    byteArray[i] = bytes.charCodeAt(i)
  }

  // 生成Blob对象（文件对象）
  return new Blob([byteArray], { type: imgtype })
}

export function convertImgToBase64(img, ext = 'png') {
  let canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  let ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, img.width, img.height)
  const dataURL = canvas.toDataURL(`image/${ext}`)
  canvas = null
  ctx = null
  return dataURL
}

export function convertEmojiToLink(showText) {
  if (!/<img/.test(showText) && /\[[^\]]+\]/.test(showText)) {
    const emojiItems = showText.match(/\[[^\]]+\]/g)
    const emojiItemsSet = [] // 对emojiItems去重 不然alt="[xx]"会被重复替换
    for (let i = 0; i < emojiItems.length; i++) {
      if (emojiItemsSet.indexOf(emojiItems[i]) < 0) {
        emojiItemsSet.push(emojiItems[i])
      }
    }
    emojiItemsSet.forEach(text => {
      const emojiCnt = emojiObj.emojiList.emoji
      if (emojiCnt[text]) {
        showText = showText.split(text)
        showText = showText.join(
          `<img class="emoji-small" src="${emojiCnt[text].img}" alt="${text}" />`
        )
      }
    })
  }
  return showText.replace(/\n/g, '<br>')
}

// export function initAudioPermission() {
//   let iframe = document.createElement('iframe')
//   iframe.setAttribute('src', require('@/assets/audio/250-milliseconds-of-silence.mp3'))
//   iframe.setAttribute('allow', 'autoplay')
//   iframe.setAttribute('type', 'audio/mp3')
//   iframe.style.display = 'none'
//   document.body.appendChild(iframe)
//   iframe.onload = function() {
//     setTimeout(() => {
//       this.parentNode.removeChild(this)
//       iframe.onload = null
//       iframe = null
//     }, 300)
//   }
// }

export function requestAudioPermission() {
  let audio = new Audio(require('@/assets/audio/250-milliseconds-of-silence.mp3'))
  audio.play().catch(() => {})
  audio.addEventListener(
    'ended',
    () => {
      audio = null
    },
    { once: true }
  )
}

export function checkAutoPlay() {
  return new Promise((resolve, reject) => {
    try {
      let video = document.createElement('video')
      const promise = video.play()
      let supported = true
      promise.catch(() => {
        supported = false
      })
      setTimeout(() => {
        if (supported) {
          resolve()
        } else {
          reject()
        }
        video = null
      })
    } catch (e) {
      reject(e)
    }
  })
}

export function redirectDomain(teamDomain, teamId) {
  const curHost = window.location.host
  const tagHost = `${teamDomain}.${appConfigObj.appOrigin}`
  const notProd = process.env.NODE_ENV !== 'production'
  const isElectron = process.env.REACT_APP_ENV === 'electron'
  if (isElectron || notProd || !teamDomain || curHost.toLowerCase() === tagHost.toLowerCase())
    return false
  cookieManager.setCookie('ims_teamId', teamId)
  window.location.href = `https://${tagHost}/#/chat`
  return true
}

export function cookieToStorage(key, important) {
  const cookieValue = cookieManager.readCookie(key)
  const localValue = localStorage.getItem(key)
  if (!cookieValue) return

  if (important === 'cookie' || !localValue) {
    localStorage.setItem(key, cookieValue)
  }
}

// 获取url中参数
export function getSearchParams(search = '', name = '') {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`)
  const r = search.substr(1).match(reg)
  if (r != null) return decodeURIComponent(r[2])
  return null
}

// 聊天显示url消息
export function parseMsgUrl(val, forceMerge) {
  const URLs = extractUrl(val)
  const urls = URLs.map(url => {
    let urlForInfo = ''
    let filePath = ''
    let fileURL = ''
    let knowledgePath = ''
    let knowledgeURL = ''
    let isPubedKnowledge = false
    let isLink = false
    let value = url
    if (/^https?:\/\//.test(url)) {
      const fileUrl = url.match(
        /https:\/\/(?:.+).imsdom.com\/#\/office\/(file|openFile)(?:\/|\?).*/
      )
      const knowledgeUrl = url.match(
        /https:\/\/(?:.+).imsdom.com\/#\/(knowledgeEdit|knowledge\/publish)(?:\/|\?).*/
      )
      if (fileUrl) {
        // 文件url
        // eslint-disable-next-line prefer-destructuring
        fileURL = fileUrl[0]
        const index = fileURL.indexOf('?')
        if (index >= 0) {
          filePath = fileURL.substring(index)
        }
      }
      if (knowledgeUrl) {
        // 知识库url
        // eslint-disable-next-line prefer-destructuring
        knowledgeURL = knowledgeUrl[0]
        const index = knowledgeURL.indexOf('?')
        if (index >= 0) {
          knowledgePath = knowledgeURL.substring(index)
        } else {
          knowledgePath = knowledgeURL.split('/').pop()
          isPubedKnowledge = true
        }
      }
      value = `<a href="${url}" target="_blank"  rel="noopener noreferrer">${url}</a>`
      urlForInfo = url
      isLink = true
    } else if (emailReg.test(url)) {
      value = `<a href="mailto:${url}">${url}</a>`
      isLink = true
    } else if (new RegExp(`^[\\w/\\-?=%.]+\\.(${domainList.join('|')})$`).test(url)) {
      urlForInfo = buildUrlLink(url)
      value = `<a href="${urlForInfo}" target="_blank" rel="noopener noreferrer">${url}</a>`
      isLink = true
    } else if (new RegExp(`^(mailto|tel|${schemaList.join('|')}):`).test(url)) {
      value = `<a href="${url}">${url}</a>`
      isLink = true
    }

    return {
      urlForInfo,
      filePath,
      fileURL,
      knowledgePath,
      knowledgeURL,
      isPubedKnowledge,
      value,
      url,
      isLink
    }
  })

  if (urls.every(url => !url.isLink)) {
    return []
  }

  if (forceMerge || urls.length > 1) {
    const value = urls.reduce((p, url) => p + url.value, '')
    const url = eraseHtmlTag(value)
    return [{ value, url }]
  }
  return urls
}

export function getRedirectUri() {
  const params = getPageQuery()
  return params.redirectUri || ''
}

export function dealLoginWithRedirectUri() {
  const urlParams = new URL(window.location.href)
  let redirectUri = getRedirectUri()
  if (redirectUri) {
    redirectUri = decodeURIComponent(redirectUri)
    const redirectUrlParams = new URL(redirectUri)
    if (redirectUrlParams.origin === urlParams.origin) {
      redirectUri = redirectUri.substr(urlParams.origin.length)
      if (redirectUri.match(/^\/.*#/)) {
        redirectUri = redirectUri.substr(redirectUri.indexOf('#') + 1)
      }
    } else {
      window.location.href = redirectUri
      return
    }
  }
  history.replace(redirectUri || '/')
}

export function dealLogoutWithRedirectUri() {
  const redirectUri = getRedirectUri()
  if (redirectUri) {
    return history.replace({
      pathname: '/user/login',
      search: stringify({
        redirectUri
      })
    })
  }
  history.replace({
    pathname: '/user/login',
    search: stringify({
      redirectUri: encodeURIComponent(window.location.href)
    })
  })
}

export function getGreet(hour) {
  if (hour < 4) {
    return intl.t({ id: 'Work.00037', defaultMessage: '夜深了' })
  }
  if (hour < 10) {
    return intl.t({ id: 'Work.00038', defaultMessage: '早安' })
  }
  if (hour < 12) {
    return intl.t({ id: 'Work.00039', defaultMessage: '上午好' })
  }
  if (hour < 13) {
    return intl.t({ id: 'Work.00040', defaultMessage: '午安' })
  }
  if (hour < 19) {
    return intl.t({ id: 'Work.00041', defaultMessage: '下午好' })
  }
  if (hour < 22) {
    return intl.t({ id: 'Work.00042', defaultMessage: '晚上好' })
  }
  if (hour < 24) {
    return intl.t({ id: 'Work.00043', defaultMessage: '晚安' })
  }
  return intl.t({ id: 'Work.00044', defaultMessage: '你好' })
}

export function formatNoticeCenterTime(time) {
  const today = moment()
  const timeDay = moment(time)
  const isToday = timeDay.isSame(today, 'day')
  const isToYear = timeDay.isSame(today, 'year')
  if (isToday) {
    return timeDay.format('HH:mm')
  }
  if (isToYear) {
    return timeDay.format('MM-DD HH:mm')
  }
  return timeDay.format('YYYY-MM-DD')
}

export function formatKnowData(dataList) {
  return dataList.map(item => {
    const { fileId, fileName, knowledgeBaseId, updateTime, date, knowledgeBaseName } = item
    const sourceType = fileId ? getFormatFileType(fileName) : 'knowledge'
    const isKnowledge = sourceType === 'knowledge'

    return {
      ...item,
      sourceType,
      isKnowledge,
      id: isKnowledge ? knowledgeBaseId : fileId,
      plateTime: formatNoticeCenterTime(updateTime || date),
      plateName: isKnowledge ? knowledgeBaseName : fileName
    }
  })
}

export function filterListById(list, key) {
  const obj = {}
  let resList = [...list]
  const otherList = []
  resList = resList.reduce((a, b) => {
    if (obj[b[key]]) {
      otherList.push(b)
    } else {
      obj[b[key]] = true
      a.push(b)
    }
    return a
  }, [])
  return { resList, otherList }
}

// 通过ua-parser获取 browser 信息对象
export function getBrowser() {
  if (browser) return browser
  const parser = new UAParser()
  browser = parser.getBrowser()
  return browser
}

export function uploadVersionType(suffix) {
  const sourceType = {
    word: '.doc, .docx, .dotx',
    ppt: '.ppt, .pptx, .pptm',
    pdf: '.pdf',
    excel: '.xlsx, .xlsm, .xlsb, .xltx, .xls, .xlt'
  }
  let type = 'unknow'
  Object.keys(sourceType).some(key => {
    if (sourceType[key].indexOf(suffix) >= 0) {
      type = key
      return true
    }
    return false
  })
  return type
}

export function getExCellHeight() {
  let winH = 900
  if (window.innerHeight) {
    winH = window.innerHeight
  } else if (document.body && document.body.clientHeight) {
    winH = document.body.clientHeight
  }
  return winH - 200
}
