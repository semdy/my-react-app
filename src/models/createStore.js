import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { routerMiddleware } from 'connected-react-router'
import { createHashHistory, /* createBrowserHistory, */ createMemoryHistory } from 'history'
import createRootReducer from './index'

export default (initialState = {}, fromServer = false) => {
  let history
  let enhancer

  if (fromServer) {
    history = createMemoryHistory()
  } else {
    history = createHashHistory()
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line import/no-extraneous-dependencies
    // const { logger } = require('redux-logger')
    // const DevTools = require('../DevTools').default
    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

    enhancer = composeEnhancers(
      applyMiddleware(routerMiddleware(history), thunk /* , logger */)
      // DevTools.instrument()
    )
  } else {
    enhancer = applyMiddleware(routerMiddleware(history), thunk)
  }

  const store = createStore(createRootReducer(history), initialState, enhancer)

  if (module.hot) {
    module.hot.accept('./', () => {
      const nextReducer = require('./index').default
      store.replaceReducer(nextReducer(history))
    })
  }

  window.g_store = store

  return { history, store }
}
