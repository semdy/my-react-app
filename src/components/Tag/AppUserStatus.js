import React, { useState, useEffect, useCallback } from 'react'
import { connect } from 'react-redux'
import { Tooltip } from 'antd'
import Icon from '@/components/Icon'
import './AppUserStatus.less'

const AppUserStatus = React.memo(({ userMuteTime }) => {
  const [show, setShow] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  const handleTimeLeft = useCallback(() => {
    const time = new Date().getTime()
    const imsMuteTime = userMuteTime
    const unitHour = 60 * 60 * 1000
    const unitMinute = 60 * 1000
    const remainderTime = imsMuteTime - time

    if (remainderTime > unitHour) {
      const hour = Math.floor(remainderTime / unitHour)
      const minute = Math.floor(remainderTime / unitMinute) - hour * 60
      setTimeLeft(`${hour}小时${minute}分钟`)
    } else {
      setTimeLeft(`${Math.round((imsMuteTime - time) / unitMinute)}分钟`)
    }
  }, [userMuteTime])

  useEffect(() => {
    setShow(userMuteTime !== 0)
  }, [userMuteTime])

  return show ? (
    <Tooltip
      placement="right"
      title={`通知暂停时间还有${timeLeft}`}
      onMouseEnter={() => handleTimeLeft()}
    >
      <span className="appBarAvatar-tag">
        <Icon name="userline-mute" size="10px" color="#fff" />
      </span>
    </Tooltip>
  ) : null
})

const mapStateToProps = ({ im: { user } }) => {
  return {
    userMuteTime: user.userMuteTime
  }
}

export default connect(mapStateToProps)(AppUserStatus)
