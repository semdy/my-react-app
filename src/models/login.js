import { resetStore } from '@/models/app'
import cookieManager from '@/utils/cookie'
import { dealLogoutWithRedirectUri } from '@/utils/utils'

const initialState = () => {
  return {
    userStatus: 0,
    countryNo: 1001,
    createMobile: '',
    createMail: '',
    loginMobile: '',
    loginMail: '',
    teamId: '',
    token: localStorage.getItem('ims_token') || '',
    createImprove: {}
  }
}

let isLogouted = false

// 登录后重置用户态
export const resetUserStatus = () => {
  return {
    type: 'setUserStatus',
    payload: { userStatus: 0 }
  }
}

// 创建团队时输入手机号
export const setCreateMobile = mobile => {
  return {
    type: 'setCreateMobile',
    payload: { mobile }
  }
}

// 登录时输入手机号
export const setLoginMobile = mobile => {
  return {
    type: 'setLoginMobile',
    payload: { mobile }
  }
}

// 登录时输入邮箱
export const setLoginMail = mail => {
  return {
    type: 'setLoginMail',
    payload: { mail }
  }
}

// 创建团队时储存创建信息
export const setCreateImprove = createImprove => {
  return {
    type: 'setCreateImprove',
    payload: { createImprove }
  }
}

export const setLoginToken = token => {
  isLogouted = false
  cookieManager.setCookie('ims_token', token)
  localStorage.setItem('ims_token', token)
}

export const setLoginTeamId = teamId => {
  localStorage.setItem('ims_teamId', teamId)
}

// 退出imsSocket
export const logoutImsSocket = () => {
  const { imsSocket } = window
  if (imsSocket) {
    imsSocket.destroy()
    delete window.imsSocket
  }
}

// 退出
export const logout = () => dispatch => {
  if (isLogouted) {
    return Promise.resolve()
  }
  isLogouted = true
  // history.push('/user/login')
  dealLogoutWithRedirectUri()
  logoutImsSocket()
  dispatch(resetStore())
  cookieManager.delCookie('ims_token')
  cookieManager.delCookie('ims_teamId')
  localStorage.removeItem('ims_token')
  localStorage.removeItem('ims_mobile')
  localStorage.removeItem('ims_teamId')
  if (process.env.REACT_APP_ENV === 'electron') {
    const { ipcRenderer } = require('electron')
    ipcRenderer.send('ipcMain:user:logout')
  }
}

export default (state = initialState(), { type, payload }) => {
  switch (type) {
    case 'setCountryNo':
      return {
        ...state,
        countryNo: payload.countryNo
      }
    case 'setUserStatus':
      return {
        ...state,
        userStatus: payload.userStatus
      }
    case 'setCreateMobile':
      return {
        ...state,
        createMobile: payload.mobile
      }
    case 'setCreateMail':
      return {
        ...state,
        createMail: payload.mail
      }
    case 'setLoginMobile':
      return {
        ...state,
        loginMobile: payload.mobile
      }
    case 'setLoginMail':
      return {
        ...state,
        loginMail: payload.mail
      }
    case 'setToken':
      return {
        ...state,
        token: payload.token
      }
    case 'setTeamId':
      return {
        ...state,
        teamId: payload.teamId
      }
    case 'setCreateImprove':
      return {
        ...state,
        createImprove: payload.createImprove
      }
    default:
      return state
  }
}
