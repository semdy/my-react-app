import React, { useContext } from 'react'

export const UserGuideContext = React.createContext()

export const useUserGuideReducer = () => {
  return useContext(UserGuideContext)
}

export const initialState = () => ({
  bound: null,
  placement: 'top',
  scope: null,
  order: 0,
  currIndex: 0,
  total: 0,
  overlayClassName: '',
  canMoveNext: false,
  canMovePrev: false,
  canSkip: false,
  removeInst: true,
  content: null,
  pageRouter: null,
  showFloatModal: false,
  showStep: true,
  showFooter: true,
  tasks: []
})

export function updateUserGuide(payload) {
  return {
    type: 'updateUserGuide',
    payload
  }
}

export function resetUserGuide() {
  return {
    type: 'resetUserGuide'
  }
}

export function toggleFloatModal(show) {
  return (dispatch, getState) => {
    dispatch({
      type: 'toggleFloatModal',
      payload: show !== undefined ? show : !getState().showFloatModal
    })
  }
}

export function updateTasks(tasks) {
  return {
    type: 'updateTasks',
    payload: tasks
  }
}

export default (state, { type, payload }) => {
  switch (type) {
    case 'updateUserGuide':
      return {
        ...state,
        ...payload
      }
    case 'toggleFloatModal':
      return {
        ...state,
        showFloatModal: payload
      }
    case 'updateTasks':
      return {
        ...state,
        tasks: payload
      }
    case 'resetUserGuide':
      return {
        ...initialState(),
        tasks: state.tasks
      }
    default:
      return state
  }
}
