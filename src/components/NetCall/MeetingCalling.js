import React, { useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'
import { message } from 'antd'
import Icon from '@/components/Icon'
import { isImgUrl } from '@/utils/utils'
import { useNetCallReducer } from './model'
import './index.less'

/* 会议呼叫界面 */
const MeetingCalling = React.memo(() => {
  const [state] = useNetCallReducer()

  const [subject, setSubject] = useState('')

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

  const handleSubjectChange = useCallback(e => {
    setSubject(e.target.value)
  }, [])

  const handleStart = useCallback(
    e => {
      e.preventDefault()
      if (state.newCreate && !subject) {
        return message.error('请填写会议主题')
      }
      window.netcall.startMeetingCall(subject)
    },
    [subject, state.newCreate]
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
            placeholder="您的会议主题是？"
            value={subject}
            autoFocus
            onChange={handleSubjectChange}
          />
          <button
            type="submit"
            className={classNames('netcall-meetingCalling-button', {
              loading: state.createChannelWaiting
            })}
          >
            {state.createChannelWaiting ? (
              <>
                <Icon name="spinner" size="18px" />
                会议创建中...
              </>
            ) : (
              '开始会议'
            )}
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

export default MeetingCalling
