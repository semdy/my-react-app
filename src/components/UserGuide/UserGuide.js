import { dispatch } from './model/Provider'
import { resetUserGuide, updateUserGuide } from './model'
import userGuideIndicator from './UserGuideIndicator'

function defaultValue(value, defValue) {
  return value !== undefined ? value : defValue
}

class UserGuide {
  constructor(scope) {
    this.uiStack = []
    this.startIndex = -1
    this.scope = scope
  }

  setUIStack(array) {
    this.uiStack.push(...array)
  }

  prev() {
    if (--this.startIndex >= 0) {
      this.showGuideUI()
    } else {
      this.startIndex = 0
    }
  }

  next() {
    if (++this.startIndex < this.uiStack.length) {
      this.showGuideUI()
    } else {
      this.startIndex = this.uiStack.length - 1
    }
  }

  skip() {
    this.hide()
    this.destroy()
  }

  destroy() {
    this.uiStack = null
    this.scope = null
    this.startIndex = null
  }

  showGuideUI() {
    const source = this.getGuideSourceByIndex(this.startIndex)
    if (!source.bound) {
      this.startIndex--
    }
    dispatch(updateUserGuide(source))
  }

  show(index) {
    if (!index) {
      this.startIndex = 0
    } else {
      this.startIndex = index
    }
    this.showGuideUI()
  }

  hide() {
    // this.startIndex = -1
    dispatch(resetUserGuide())
  }

  refresh() {
    if (this.startIndex > -1) {
      this.showGuideUI()
    }
  }

  getGuideByIndex(index) {
    return this.uiStack[index]
  }

  getGuideSourceByIndex(index) {
    const guideItem = this.getGuideByIndex(index)
    if (guideItem) {
      const { bound, order, scope } = userGuideIndicator.getItem(this.scope, index)
      return {
        bound,
        scope,
        order,
        placement: guideItem.placement || 'bottom',
        currIndex: this.startIndex,
        total: this.uiStack.length,
        overlayClassName: defaultValue(guideItem.overlayClassName, ''),
        canMoveNext: defaultValue(guideItem.canMoveNext, false),
        canMovePrev: defaultValue(guideItem.canMovePrev, false),
        canSkip: defaultValue(guideItem.canSkip, false),
        canClose: defaultValue(guideItem.canClose, true),
        removeInst: defaultValue(guideItem.removeInst, true),
        goNextOnClose: defaultValue(guideItem.goNextOnClose, true),
        showStep: defaultValue(guideItem.showStep, true),
        showFooter: defaultValue(guideItem.showFooter, true),
        content: guideItem.layout(this.startIndex)
      }
    }
  }
}

export default UserGuide
