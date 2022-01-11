import React from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import './index.less'

const Divider = ({ className, ...rest }) => {
  return <div {...rest} className={classNames('app-divider', className)} />
}

Divider.defaultProps = {
  className: ''
}

Divider.propTypes = {
  className: propTypes.string
}

export default React.memo(Divider)
