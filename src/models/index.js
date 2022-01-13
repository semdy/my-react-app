import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import login from './login'
import app from './app'
import setting from './setting'

const appReducer = history => {
  return combineReducers({
    router: connectRouter(history),
    login,
    app,
    setting
  })
}

const createRootReducer = history => {
  return (state, action) => {
    if (action.type === 'resetStore') {
      state = undefined
    }
    return appReducer(history)(state, action)
  }
}

export default createRootReducer
