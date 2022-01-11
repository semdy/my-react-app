import React from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import './index.less'

const Badge = ({ className, count, size, ...rest }) => {
  return (
    <span {...rest} className={classNames('app-badge', className, size)}>
      {count}
    </span>
  )
}

Badge.defaultProps = {
  className: '',
  size: 'small'
}

Badge.propTypes = {
  className: propTypes.string,
  count: propTypes.number.isRequired,
  size: propTypes.oneOf(['large', 'normal', 'small'])
}

export default React.memo(Badge)
