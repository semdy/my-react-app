import React from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import './index.less'

const Icon = React.forwardRef(
  ({ name, className, size, color, type, action, style, children, ...rest }, ref) => {
    const styles = { color, fontSize: size, ...style }

    if (!children) {
      let iconData
      try {
        if (type === 'svg') {
          iconData = require(`@/assets/icons/${name}.svg`).default || {}
        }
      } catch (e) {
        iconData = {}
      }

      if (type === 'svg') {
        children = (
          <svg viewBox={iconData.viewBox} className="icon-symbol">
            <use xlinkHref={`#${iconData.id}`} />
          </svg>
        )
      } else if (type === 'iconfont') {
        children = <i className={classNames('iconfont', `icon-${name}`)} />
      } else {
        children = (
          <img className="icon-symbol" src={require(`@/assets/icons/${name}.png`)} alt={name} />
        )
      }
    }

    return (
      <span
        {...rest}
        role="img"
        aria-label={name}
        className={classNames('app-icon', { hasAction: action }, className)}
        style={styles}
        ref={ref}
      >
        {children}
      </span>
    )
  }
)

Icon.defaultProps = {
  className: '',
  size: '',
  color: '',
  type: 'svg',
  style: {}
}

Icon.propTypes = {
  name: propTypes.string,
  className: propTypes.string,
  size: propTypes.string,
  color: propTypes.string,
  onClick: propTypes.func,
  action: propTypes.bool,
  title: propTypes.string,
  type: propTypes.oneOf(['iconfont', 'svg', 'img']),
  style: propTypes.object
}

export default React.memo(Icon)
