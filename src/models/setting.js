import { message } from 'antd'
import defaultSettings from '@/defaultSettings'

const updateColorWeak = colorWeak => {
  const root = document.getElementById('root')
  if (root) {
    root.className = colorWeak ? 'colorWeak' : ''
  }
}

let lessNodesAppended
const updateTheme = primaryColor => {
  // Determine if the component is remounted
  if (!primaryColor) {
    return
  }
  const hideMessage = message.loading('正在编译主题！', 0)
  function buildIt() {
    if (!window.less) {
      return
    }
    setTimeout(() => {
      window.less
        .modifyVars({
          '@primary-color': primaryColor
        })
        .then(() => {
          hideMessage()
        })
        .catch(() => {
          message.error('Failed to update theme')
          hideMessage()
        })
    }, 200)
  }
  if (!lessNodesAppended) {
    // insert less.js and color.less
    const lessStyleNode = document.createElement('link')
    const lessConfigNode = document.createElement('script')
    const lessScriptNode = document.createElement('script')
    lessStyleNode.setAttribute('rel', 'stylesheet/less')
    lessStyleNode.setAttribute('href', '/color.less')
    lessConfigNode.innerHTML = `
      window.less = {
        async: true,
        env: 'production',
        javascriptEnabled: true
      };
    `
    lessScriptNode.src = 'https://gw.alipayobjects.com/os/lib/less.js/3.8.1/less.min.js'
    lessScriptNode.async = true
    lessScriptNode.onload = () => {
      buildIt()
      lessScriptNode.onload = null
    }
    document.body.appendChild(lessStyleNode)
    document.body.appendChild(lessConfigNode)
    document.body.appendChild(lessScriptNode)
    lessNodesAppended = true
  } else {
    buildIt()
  }
}

const initialState = () => ({
  profileList: [],
  ...defaultSettings
})

export default (state = initialState(), { type, payload }) => {
  switch (type) {
    case 'profileList':
      return {
        ...state,
        profileList: payload.profileList || []
      }
    case 'getSetting':
      const setting = {}
      const urlParams = new URL(window.location.href)
      Object.keys(state).forEach(key => {
        if (urlParams.searchParams.has(key)) {
          const value = urlParams.searchParams.get(key)
          setting[key] = value === '1' ? true : value
        }
      })
      if (state.primaryColor !== setting.primaryColor) {
        updateTheme(setting.primaryColor)
      }
      updateColorWeak(setting.colorWeak)
      return {
        ...state,
        ...setting
      }
    case 'changeSetting':
      const urlParams2 = new URL(window.location.href)
      Object.keys(defaultSettings).forEach(key => {
        if (urlParams2.searchParams.has(key)) {
          urlParams2.searchParams.delete(key)
        }
      })
      Object.keys(payload).forEach(key => {
        if (key === 'collapse') {
          return
        }
        let value = payload[key]
        if (value === true) {
          value = 1
        }
        if (defaultSettings[key] !== value) {
          urlParams2.searchParams.set(key, value)
        }
      })
      if (state.primaryColor !== payload.primaryColor) {
        updateTheme(payload.primaryColor)
      }
      updateColorWeak(payload.colorWeak)
      // window.history.replaceState(null, 'setting', urlParams2.href)
      return {
        ...state,
        ...payload
      }
    default:
      return state
  }
}
