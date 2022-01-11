import React, { useCallback, useEffect } from 'react'
import classNames from 'classnames'
import Avatar from '@/components/Avatar'
import IconButton from '@/components/IconButton'
import { isImgUrl } from '@/utils/utils'
import { useNetCallReducer } from './model'
import './index.less'

/* p2p呼叫界面 */
const P2pCalling = React.memo(() => {
  const [state] = useNetCallReducer()

  const handleHangUp = useCallback(() => {
    window.netcall.cancelCalling()
  }, [])

  const handleReject = useCallback(() => {
    window.netcall.reject()
  }, [])

  const handleAccept = useCallback(() => {
    window.netcall.accept()
  }, [])

  const switchAudioInOn = useCallback(() => {
    window.netcall.switchAudioInOn()
  }, [])

  const switchCameraOn = useCallback(() => {
    window.netcall.switchCameraOn()
  }, [])

  useEffect(() => {
    if (state.role === 'caller') {
      const map = {
        audio: window.WebRTC.NETCALL_TYPE_AUDIO,
        video: window.WebRTC.NETCALL_TYPE_VIDEO
      }
      const callType = map[state.type]
      window.netcall.sendNetCall(callType)
    }
  }, [state.role, state.type])

  return (
    <div className={classNames('netcall-panel', state.type)}>
      {isImgUrl(state.avatar) && (
        <div
          className="netcall-blurView"
          style={{
            backgroundImage: `url(${state.avatar})`
          }}
        />
      )}
      <div className="netcall-info">
        <Avatar className="netcall-avatar" url={state.avatar} />
        <div className="netcall-nick">{state.nick}</div>
        <div className="netcall-tip">{state.tip}</div>
      </div>
      <div className="netcall-calling-actions">
        {state.role === 'caller' && (
          <>
            <IconButton
              name={state.microphoneDisabled ? 'unvoice-f' : 'voice-f'}
              title={state.microphoneDisabled ? '开启麦克风' : '关闭麦克风'}
              className="netcall-button"
              onClick={switchAudioInOn}
            />
            {state.type === 'video' && (
              <IconButton
                name={state.cameraDisabled ? 'unvideo-f' : 'video-f'}
                title={state.cameraDisabled ? '开启摄像头' : '关闭摄像头'}
                className="netcall-button"
                onClick={switchCameraOn}
              />
            )}
            <IconButton
              name="hangup-f"
              title="挂断"
              className="netcall-button red"
              onClick={handleHangUp}
            />
          </>
        )}
        {state.role === 'called' && (
          <>
            <IconButton
              name="hangup-f"
              title="拒绝"
              className="netcall-button red"
              onClick={handleReject}
            />
            <IconButton
              name={state.acceptWaiting ? 'spinner' : 'phone-connect-f'}
              title={state.acceptWaiting ? '接通中...' : '接通'}
              className={classNames('netcall-button green', {
                loading: state.acceptWaiting
              })}
              onClick={handleAccept}
            />
          </>
        )}
      </div>
    </div>
  )
})

export default P2pCalling
