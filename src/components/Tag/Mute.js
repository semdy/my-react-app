import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Tooltip } from 'antd'
import classNames from 'classnames'
import Icon from '@/components/Icon'
import './Mute.less'

const Mute = React.memo(({ userStatusPond, to, className }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (userStatusPond[to] && userStatusPond[to] === '1') {
      setShow(true)
    } else {
      setShow(false)
    }
  }, [to, userStatusPond])

  return show ? (
    <Tooltip placement="top" title="勿扰中，通知已暂停">
      <span className={classNames('msgItemMute-mute-tag', className)}>
        <Icon name="userline-mute" size="10px" color="#F24C4A" />
      </span>
    </Tooltip>
  ) : null
})

const mapStateToProps = ({ im: { user } }) => {
  return {
    userStatusPond: user.userStatusPond
  }
}

export default connect(mapStateToProps)(Mute)
