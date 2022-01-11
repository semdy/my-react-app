import React, { useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'
import { message } from 'antd'
import Icon from '@/components/Icon'
import { isImgUrl } from '@/utils/utils'
import { useNetCallReducer } from './model'
import './index.less'

/* 加入会议界面 */
const MeetingJoin = React.memo(() => {
  const [state] = useNetCallReducer()

  const [channelName, setChannelName] = useState('')

  const handleClose = useCallback(() => {
    window.netcall.hideAllNetCallUI()
    window.netcall.resetWhenHangup()
  }, [])

  const switchAudioInOn = useCallback(() => {
    window.netcall.switchAudioInOn()
  }, [])

  const switchCameraOn = useCallback(() => {
    window.netcall.switchCameraOn()
  }, [])

  const handleChannelChange = useCallback(e => {
    setChannelName(e.target.value)
  }, [])

  const handleStart = useCallback(
    e => {
      e.preventDefault()
      const value = channelName.replace(/\s/g, '')
      if (!value) {
        return message.error('房间号不能为空')
      }
      if (!/^\d{9}$/.test(value)) {
        return message.error('房间号为9位纯数字')
      }
      window.netcall.joinMeetingByChannelName(value)
    },
    [channelName]
  )

  useEffect(() => {
    if (!state.cameraDisabled) {
      window.netcall.startCallingVideoPreview()
    }

    return () => {
      window.netcall.stopCallingVideoPreview()
    }
  }, []) // eslint-disable-line

  return (
    <div className={classNames('netcall-panel', state.type)}>
      {state.type === 'audio' && isImgUrl(state.avatar) && (
        <div
          className="netcall-calling-bg"
          style={{
            backgroundImage: `url(${state.avatar})`
          }}
        />
      )}
      {state.type === 'video' && (
        <div id="netcall-calling-videobg" className="netcall-calling-videobg" />
      )}
      <Icon
        name="close"
        title="关闭"
        className="netcall-meetingCalling-close"
        onClick={handleClose}
      />
      <div className="netcall-meetingCalling">
        <form onSubmit={handleStart} className="netcall-meetingCalling-form">
          <input
            type="text"
            className="netcall-meetingCalling-input"
            placeholder="请输入会议房间号"
            value={channelName}
            autoFocus
            onChange={handleChannelChange}
          />
          <button type="submit" className="netcall-meetingCalling-button">
            加入会议
          </button>
        </form>
        <div className="netcall-meetingCalling-actions">
          <Icon
            name={state.microphoneDisabled ? 'unvoice-f' : 'voice-f'}
            title={state.microphoneDisabled ? '开启麦克风' : '关闭麦克风'}
            size="16px"
            onClick={switchAudioInOn}
          />
          <Icon
            name={state.cameraDisabled ? 'unvideo-f' : 'video-f'}
            title={state.cameraDisabled ? '开启摄像头' : '关闭摄像头'}
            size="16px"
            onClick={switchCameraOn}
          />
        </div>
      </div>
    </div>
  )
})

export default MeetingJoin
