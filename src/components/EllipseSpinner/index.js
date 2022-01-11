import React from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import './index.less'

const EllipseSpinner = React.memo(({ className, style }) => {
  return (
    <div className={classNames('ellipse-spinner', className)} style={style}>
      <span />
    </div>
  )
})

EllipseSpinner.propTypes = {
  className: propTypes.string,
  style: propTypes.object
}

EllipseSpinner.defaultProps = {
  className: '',
  style: {}
}

export default EllipseSpinner
