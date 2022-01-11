import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Tooltip } from 'antd'
import Icon from '@/components/Icon'
import './SessionMute.less'

const SessionMute = React.memo(({ userStatusPond, to }) => {
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
      <span className="tagSessionMute-mute-tag">
        <Icon name="userline-mute" size="9px" color="#fff" />
      </span>
    </Tooltip>
  ) : null
})

const mapStateToProps = ({ im: { user } }) => {
  return {
    userStatusPond: user.userStatusPond
  }
}

export default connect(mapStateToProps)(SessionMute)
