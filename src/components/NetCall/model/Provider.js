import React, { useReducer } from 'react'
import NetCallContext from '@/context/NetCallContext'
import reducer, { initialState } from './index'

let currentState = {}

function wrapperDispatch(dispatch) {
  return function handler(action) {
    if (typeof action === 'function') {
      action(handler, () => currentState)
    } else {
      dispatch(action)
    }
  }
}

export function dispatch() {}

export function getState() {
  return currentState
}

export default ({ children }) => {
  const [state, dispatcher] = useReducer(reducer, initialState)

  // eslint-disable-next-line no-func-assign
  dispatch = wrapperDispatch(dispatcher)
  currentState = state

  return <NetCallContext.Provider value={[state, dispatch]}>{children}</NetCallContext.Provider>
}
