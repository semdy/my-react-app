import React, { createContext, PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import propTypes from 'prop-types'
import Observer from './Observer'

export const AppearContext = createContext()

class Provider extends PureComponent {
  constructor(props) {
    super(props)
    this.observer = new Observer()
  }

  componentDidMount() {
    const { root, rootMargin, threshold, disabled } = this.props
    // eslint-disable-next-line react/no-find-dom-node
    const rootNode = findDOMNode(this)
    this.observer.init({
      root: root || rootNode,
      rootMargin,
      threshold,
      disabled
    })
  }

  componentDidUpdate(prevProps) {
    const { disabled } = this.props
    if (prevProps.disabled !== disabled) {
      this.observer.setDisabled(disabled)
    }
  }

  componentWillUnmount() {
    this.observer.destroy()
  }

  render() {
    const { children } = this.props
    return <AppearContext.Provider value={this.observer}>{children}</AppearContext.Provider>
  }
}

Provider.defaultProps = {
  root: null,
  rootMargin: '0px',
  threshold: 0,
  disabled: false
}

Provider.propTypes = {
  root: propTypes.element,
  rootMargin: propTypes.string,
  threshold: propTypes.oneOfType([propTypes.arrayOf(propTypes.number), propTypes.number]),
  disabled: propTypes.bool
}

export default Provider
