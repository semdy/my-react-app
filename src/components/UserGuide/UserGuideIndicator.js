import memoize from 'lodash/memoize'
import { getDomBounding } from './helper'

class UserGuideIndicator {
  constructor() {
    this.stack = {}
    this.memoizeSortFun = memoize(arr => {
      return arr.sort((a, b) => a.order - b.order)
    })
  }

  existIndex(scope, order) {
    const stackArr = this.stack[scope]
    if (stackArr) {
      return stackArr.findIndex(item => item.order === order)
    }
    return -1
  }

  addItem(scopeKey, dom, order) {
    const bound = getDomBounding(dom)
    if (!this.stack[scopeKey]) {
      this.stack[scopeKey] = []
    }
    const existIndex = this.existIndex(scopeKey, order)
    if (existIndex > -1) {
      const target = this.stack[scopeKey]
      target.bound = bound
      target.order = order
      target.dom = dom
      target.scope = scopeKey
    } else {
      this.stack[scopeKey].push({
        bound,
        order,
        dom,
        scope: scopeKey
      })
    }
  }

  getItem(scopeKey, order) {
    const stackArr = this.stack[scopeKey]
    if (stackArr) {
      return this.memoizeSortFun(stackArr)[order] || {}
    }
    return {}
  }

  removeItem(scopeKey, order) {
    if (!this.stack[scopeKey]) return
    const existIndex = this.existIndex(scopeKey, order)
    if (existIndex > -1) {
      this.stack[scopeKey].splice(existIndex, 1)
    }
  }

  updateItem(scopeKey, dom, order) {
    const bound = getDomBounding(dom)
    const existIndex = this.existIndex(scopeKey, order)
    if (existIndex > -1) {
      const targetItem = this.stack[scopeKey][existIndex]
      targetItem.bound = bound
      targetItem.dom = dom
      // this.stack[scopeKey].splice(existIndex, 1, targetItem)
    }
  }

  refresh() {
    Object.keys(this.stack).forEach(scope => {
      this.stack[scope].forEach(item => {
        this.updateItem(scope, item.dom, item.order)
      })
    })
  }

  destroy() {
    this.stack = {}
  }
}

export default new UserGuideIndicator()
