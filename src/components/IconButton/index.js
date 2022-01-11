import React from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import Icon from '@/components/Icon'
import './index.less'

const IconButton = ({ name, size, color, round, plain, bordered, className, ...rest }) => {
  return (
    <div {...rest} className={classNames('app-icon-button', { round, plain, bordered }, className)}>
      <Icon name={name} size={size} color={color} />
    </div>
  )
}

IconButton.defaultProps = {
  className: '',
  size: '20px'
}

IconButton.propTypes = {
  name: propTypes.string.isRequired,
  className: propTypes.string,
  size: propTypes.string,
  color: propTypes.string,
  bordered: propTypes.bool,
  round: propTypes.bool,
  plain: propTypes.bool
}

export default React.memo(IconButton)
