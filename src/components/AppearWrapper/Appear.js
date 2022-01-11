import { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import propTypes from 'prop-types'
import { AppearContext } from './Provider'

const APPEAR_EVENTS = {
  APPEAR: 'appear',
  DISAPPEAR: 'disappear'
}

class Appear extends PureComponent {
  static contextType = AppearContext

  componentDidMount() {
    const { onAppear, onDisappear, onAppearOnce, onDisappearOnce } = this.props
    // eslint-disable-next-line react/no-find-dom-node
    this.el = findDOMNode(this)
    requestAnimationFrame(() => {
      this.context.observe(this.el)
    })
    if (onAppear) {
      this.el.addEventListener(APPEAR_EVENTS.APPEAR, this.handleAppear, false)
    }
    if (onDisappear) {
      this.el.addEventListener(APPEAR_EVENTS.DISAPPEAR, this.handleDisAppear, false)
    }
    if (onAppearOnce) {
      this.el.addEventListener(APPEAR_EVENTS.APPEAR, onAppearOnce, { once: true })
    }
    if (onDisappearOnce) {
      this.el.addEventListener(APPEAR_EVENTS.DISAPPEAR, onDisappearOnce, { once: true })
    }
  }

  componentWillUnmount() {
    const { onAppear, onDisappear } = this.props
    this.context.unobserve(this.el)
    if (onAppear) {
      this.el.removeEventListener(APPEAR_EVENTS.APPEAR, this.handleAppear, false)
    }
    if (onDisappear) {
      this.el.removeEventListener(APPEAR_EVENTS.DISAPPEAR, this.handleDisAppear, false)
    }
  }

  handleAppear = e => {
    this.props.onAppear(e)
  }

  handleDisAppear = e => {
    this.props.onDisappear(e)
  }

  render() {
    return this.props.children
  }
}

Appear.defaultProps = {
  onAppear: () => {},
  onDisappear: () => {}
}

Appear.propTypes = {
  onAppear: propTypes.func,
  onAppearOnce: propTypes.func,
  onDisappear: propTypes.func,
  onDisappearOnce: propTypes.func
}

export default Appear
