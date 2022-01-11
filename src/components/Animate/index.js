import React from 'react'
import propTypes from 'prop-types'
import RcAnimate from 'rc-animate'
import './animate.less'

const AnimateEl = props => {
  const {
    style,
    visible,
    destroyOnClose,
    component,
    componentProps,
    showProp,
    exclusive,
    transitionName,
    transitionAppear,
    transitionEnter,
    transitionLeave,
    onEnd,
    animation,
    ...restProps
  } = props

  if (!visible && destroyOnClose) return null

  const newStyle = { ...style, display: visible ? undefined : 'none' }

  return <div {...restProps} style={newStyle} />
}

const Animate = props => {
  return <RcAnimate {...props}>{props.exclusive && <AnimateEl {...props} />}</RcAnimate>
}

Animate.propTypes = {
  component: propTypes.string,
  showProp: propTypes.string,
  visible: propTypes.bool,
  destroyOnClose: propTypes.bool,
  exclusive: propTypes.bool
}

Animate.defaultProps = {
  component: '',
  showProp: 'visible',
  visible: true,
  destroyOnClose: true,
  exclusive: true
}

export default React.memo(Animate)
