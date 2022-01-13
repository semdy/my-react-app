const initialState = () => ({
  // 是否正在切换团队
  changingTeam: false,
  // 是否正在登录团队
  loginingTeam: true,
  // 是否可更新
  updateAvailable: false,
  // 检查更新进行中
  updateLoading: false,
  // app版本信息
  version: {}
})

// 重置redux store
export const resetStore = () => {
  return {
    type: 'resetStore'
  }
}

// 设置团队切换状态
export const setChangingTeam = payload => {
  localStorage.setItem('changingTeam', payload)
  return {
    type: 'setChangingTeam',
    payload
  }
}

// 设置登录团队状态
export const setLoginingTeam = payload => {
  return {
    type: 'setLoginingTeam',
    payload
  }
}

export const setUpdateAvailable = payload => {
  return {
    type: 'setUpdateAvailable',
    payload
  }
}

export const setUpdateLoading = payload => {
  return {
    type: 'setUpdateLoading',
    payload
  }
}

export default (state = initialState(), { type, payload }) => {
  switch (type) {
    case 'setChangingTeam':
      return {
        ...state,
        changingTeam: payload
      }
    case 'setLoginingTeam':
      return {
        ...state,
        loginingTeam: payload
      }
    case 'setVersion':
      return {
        ...state,
        version: payload
      }
    case 'setUpdateLoading':
      return {
        ...state,
        updateLoading: payload
      }
    case 'setUpdateAvailable':
      return {
        ...state,
        updateAvailable: payload,
        updateLoading: false
      }
    default:
      return state
  }
}
