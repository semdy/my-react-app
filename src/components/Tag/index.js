import React from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import './index.less'

const Tag = ({ className, type, children, ...rest }) => {
  return (
    <div {...rest} className={classNames('app-tag', type, className)}>
      {children}
    </div>
  )
}

Tag.defaultProps = {
  className: '',
  type: 'default'
}

Tag.propTypes = {
  className: propTypes.string,
  style: propTypes.object,
  type: propTypes.string
}

export default React.memo(Tag)
