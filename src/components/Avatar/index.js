import React, { isValidElement } from 'react'
import propTypes from 'prop-types'
import { isImgUrl, isBlobUrl } from '@/utils/utils'
import Badge from '../Badge'
import Icon from '../Icon'
import './index.less'

const Avatar = ({ className, url, icon, iconSize, background, badge, badgeMute, ...rest }) => {
  let slot
  url = url || ''
  if (isImgUrl(url) || isBlobUrl(url)) {
    slot = (
      <img
        src={url}
        alt=""
        onError={e => {
          e.target.src = require('@/assets/img/default-icon.png')
        }}
      />
    )
  } else if (isValidElement(url)) {
    slot = url
  } else {
    slot = (
      <span className="app-avatar-letter" style={{ background }}>
        {icon ? (
          <Icon name={icon} size={iconSize} />
        ) : (
          (url.default || url).substr(0, 1).toUpperCase()
        )}
      </span>
    )
  }
  return (
    <div {...rest} className={['app-avatar', className].join(' ')}>
      <div className="app-avatar-bd">{slot}</div>
      {badge > 0 && <Badge count={badge} className={badgeMute ? 'app-badge-mute' : null} />}
    </div>
  )
}

Avatar.defaultProps = {
  className: '',
  iconSize: '',
  background: '',
  badge: 0,
  badgeMute: false
}

Avatar.propTypes = {
  className: propTypes.string,
  style: propTypes.object,
  onClick: propTypes.func,
  url: propTypes.oneOfType([propTypes.string, propTypes.element, propTypes.object]),
  icon: propTypes.string,
  iconSize: propTypes.string,
  background: propTypes.string,
  badge: propTypes.number,
  badgeMute: propTypes.bool
}

export default React.memo(Avatar)
