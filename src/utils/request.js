import { message } from 'antd'
import merge from 'lodash/merge'
import { store } from '@/index'
import { logout } from '@/models/login'
// import { cookieToStorage } from '@/utils/utils'
import appConfig from '@/config/app'
import { getCurrentLang } from '@/locales'
import getServerInfo from '../beforeRenderApp'

// 唯一报错的key
const notifiKey = 'notifiOnly'

let lastServeUrl
// 若修改代理请仅在 setupProxy.js 修改对应域名
const getServerUrl = async server => {
  let serverUrl = lastServeUrl
  if (!serverUrl) {
    serverUrl = localStorage.getItem('serverUrl')
    try {
      if (serverUrl) {
        serverUrl = JSON.parse(serverUrl)
      } else {
        serverUrl = await getServerInfo()
      }
    } catch (e) {
      console.log('getServerUrl Error', e)
    }
  }

  const { userApi, spaceApi, calApi } = serverUrl
  const notProd = process.env.NODE_ENV !== 'production'

  switch (server) {
    case 'user':
      return notProd ? '/apiuser' : userApi
    case 'space':
      return notProd ? '/apispace' : spaceApi
    case 'cal':
      return notProd ? '/apical' : calApi
    default:
      return notProd ? '/apiuser' : userApi
  }
}

const codeMessage = {
  200: '服务器成功返回请求的数据',
  201: '新建或修改数据成功',
  202: '一个请求已经进入后台排队（异步任务）',
  204: '删除数据成功',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作.',
  401: '用户没有权限（令牌、用户名、密码错误）.',
  403: '用户得到授权，但是访问是被禁止的.',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作.',
  406: '请求的格式不可得',
  410: '请求的资源被永久删除，且不会再得到的.',
  422: '当创建一个对象时，发生一个验证错误.',
  500: '服务器发生错误，请检查服务器.',
  502: '网关错误',
  503: '服务不可用，服务器暂时过载或维护.',
  504: '网关超时'
}

export const getToken = () => {
  // if (process.env.REACT_APP_ENV !== 'electron') {
  //   cookieToStorage('ims_token')
  // }
  return store.getState().login.token || localStorage.getItem('ims_token')
  // return localStorage.getItem('ims_token')
}

const parseParams = (params = {}) => {
  const result = Object.keys(params).map(key => {
    if (params[key] === undefined) {
      return `${key}=`
    }
    return `${key}=${encodeURIComponent(params[key])}`
  })
  return result.join('&')
}

let isLogout = false
const doLogout = () => {
  if (isLogout) return
  store.dispatch(logout())
  isLogout = true
}

const checkStatus = response => {
  if (response.status >= 200 && response.status < 300) {
    return response
  }
  const errorText = codeMessage[response.status] || response.statusText
  const error = new Error(errorText)
  error.status = response.status
  error.response = response
  throw error
}

const delay = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} server    The server belong to server module ('user', 'space', 'cal')
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @param  {boolean} noNeedNotify Don't notification when error from "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default async function request(server, url, options = {}, noNeedNotify) {
  const defaultOptions = {
    // credentials: 'include',
    headers: {
      token: getToken(),
      lang: getCurrentLang(),
      version: appConfig.versionId
    },
    body: {}
  }
  // const newOptions = { ...defaultOptions, ...options }
  const newOptions = merge(defaultOptions, options)
  if (
    newOptions.method === 'POST' ||
    newOptions.method === 'PUT' ||
    newOptions.method === 'DELETE'
  ) {
    if (newOptions.body instanceof FormData) {
      newOptions.headers = {
        Accept: 'application/json',
        ...newOptions.headers
      }
    } else {
      newOptions.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        ...newOptions.headers
      }
      newOptions.body = JSON.stringify(newOptions.body)
    }
  } else if (newOptions.method === 'GET' && newOptions.body) {
    const params = parseParams(newOptions.body)
    if (params) {
      if (url.indexOf('?') > -1) {
        /* eslint-disable-next-line */
        url += `&${params}`
      } else {
        /* eslint-disable-next-line */
        url += `?${params}`
      }
    }
    delete newOptions.body
  }

  const serverUrl = await getServerUrl(server)
  const reqUrl = /^https?:\/\//.test(url) ? url : `${serverUrl}${url}`
  const begin = Date.now()

  return new Promise((resolve, reject) => {
    fetch(reqUrl, newOptions)
      .then(checkStatus)
      .then(response => {
        // DELETE and 204 do not return data by default
        // using .json will report an error.
        if (newOptions.method === 'DELETE' || response.status === 204) {
          return response.text()
        }
        return response.json()
      })
      .then(response => {
        const time = Date.now() - begin
        // 上报接口调用成功
        // eslint-disable-next-line
        window.__bl && __bl.api(reqUrl, true, time, response.code, response.msg)

        if (response.code === 0) {
          isLogout = false
          return resolve(response.data || {})
        }
        // request again
        if (response.code === 10014) {
          isLogout = false
          return delay(300).then(() => {
            return request(server, url, options, noNeedNotify, resolve, reject)
          })
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({ message: response.msg, code: response.code, response })
        if (response.code === 98 || response.code === 100) {
          doLogout()
        } else {
          if (noNeedNotify) return

          message.error({
            key: notifiKey,
            content: response.msg
          })
          // notification.error({
          //   key: notifiKey,
          //   // message: `请求异常 ${response.code}: ${url}`,
          //   message: response.msg
          //   // description: response.msg
          // })
        }
      })
      .catch(e => {
        const time = Date.now() - begin
        // 上报接口调用失败
        // eslint-disable-next-line
        window.__bl && __bl.api(reqUrl, false, time, 'ERROR', e.message)

        e.response = e.response || {}
        reject(e)
        if (e.status === 401) {
          doLogout()
        } else {
          // 某些忽略报错的接口 不要抛分手
          if (noNeedNotify) return

          message.error({
            key: notifiKey,
            content: '和服务器分手了，请稍后再试...'
          })
          // notification.error({
          //   key: notifiKey,
          //   // message: `请求错误 ${e.status}: ${url}`,
          //   message: '和服务器分手了，请稍后再试...'
          //   // description: e.message || e.stack
          //   // description: '和服务器分手了，请稍后再试...'
          // })
        }
      })
  })
}

request.get = (server, url, body = {}, noNeedNotify) =>
  request(server, url, { body, method: 'GET' }, noNeedNotify)

request.post = (server, url, body = {}, noNeedNotify) =>
  request(server, url, { body, method: 'POST' }, noNeedNotify)

export function amapRequest(url, options = {}) {
  const defaultOptions = {}
  const newOptions = { ...defaultOptions, ...options }

  if (
    newOptions.method === 'POST' ||
    newOptions.method === 'PUT' ||
    newOptions.method === 'DELETE'
  ) {
    if (newOptions.body instanceof FormData) {
      newOptions.headers = {
        Accept: 'application/json',
        ...newOptions.headers
      }
    } else {
      newOptions.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        ...newOptions.headers
      }
      newOptions.body = JSON.stringify(newOptions.body)
    }
  } else if (newOptions.method === 'GET' && newOptions.body) {
    const params = parseParams(newOptions.body)
    if (params) {
      if (url.indexOf('?') > -1) {
        /* eslint-disable-next-line */
        url += `&${params}`
      } else {
        /* eslint-disable-next-line */
        url += `?${params}`
      }
    }
    delete newOptions.body
  }

  const reqUrl = `${url}`

  return fetch(reqUrl, newOptions)
    .then(checkStatus)
    .then(response => {
      // DELETE and 204 do not return data by default
      // using .json will report an error.
      if (newOptions.method === 'DELETE' || response.status === 204) {
        return response.text()
      }
      return response.json()
    })
    .then(response => {
      if (response.infocode === '10000') {
        return response.tips || ''
      }
      return []
    })
    .catch(e => {
      // const status = e.name
      console.log('e', e)
      message.error({
        key: notifiKey,
        content: '和服务器分手了，请稍后再试...'
      })
      // notification.error({
      //   key: notifiKey,
      //   // message: `请求错误 ${status}: ${url}`,
      //   message: '和服务器分手了，请稍后再试...'
      //   // description: e.message || e.stack
      //   // description: '和服务器分手了，请稍后再试...' // 修改成文案
      // })
    })
}

amapRequest.get = (url, body) => amapRequest(url, { body, method: 'GET' })
