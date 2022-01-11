import React, { useCallback, useEffect, useState, useRef } from 'react'
import classNames from 'classnames'
import Draggable from 'react-draggable'
import Icon from '@/components/Icon'
import IconButton from '@/components/IconButton'
import Avatar from '@/components/Avatar'
import ControlSlider from '@/components/ControlSlider'
import { isImgUrl } from '@/utils/utils'
import EndMeetingConfirm from './EndMeetingConfirm'
import Duration from './Duration'
import { useNetCallReducer, toggleMiniMode } from './model'
import './MiniView.less'

function computeVolume(value) {
  return parseInt((255 * value) / 10, 10)
}

const MiniView = React.memo(() => {
  const [state, dispatch] = useNetCallReducer()
  const [showConfirm, setShowConfirm] = useState(false)
  const videoRef = useRef(null)

  const switchAudioIn = useCallback(() => {
    window.netcall.switchAudioIn()
  }, [])

  const switchCamera = useCallback(() => {
    window.netcall.switchCamera()
  }, [])

  const microphoneAfterChange = useCallback(value => {
    window.netcall.setCaptureVolume(computeVolume(value))
  }, [])

  const handleHangup = useCallback(() => {
    if (state.status === 'meeting') {
      if (state.caller === state.myAccount && state.members.length > 1) {
        setShowConfirm(true)
      } else {
        window.netcall.leaveChannel()
      }
    } else {
      window.netcall.hangup()
    }
  }, [state.caller, state.myAccount, state.members.length, state.status])

  const handleCancel = useCallback(() => {
    setShowConfirm(false)
  }, [])

  const handleToggleMiniMode = useCallback(() => {
    dispatch(toggleMiniMode())
  }, [dispatch])

  const curBigViewCameraDisabled = () => {
    return state.cameraStatus[state.currBigViewAccount] === false
  }

  const renderMicphone = useCallback(() => {
    if (state.localBigView && state.microphoneDisabled) {
      return (
        <IconButton
          name="unvoice-f"
          title="您关闭了麦克风"
          size="12px"
          className="netcall-button red small"
        />
      )
    }
    if (state.remoteBigView && state.remoteMicrophoneDisabled) {
      return (
        <IconButton
          name="unvoice-f"
          title="对方关闭了麦克风"
          size="12px"
          className="netcall-button red small"
        />
      )
    }
  }, [
    state.localBigView,
    state.remoteBigView,
    state.microphoneDisabled,
    state.remoteMicrophoneDisabled
  ])

  const renderBlurAvatar = useCallback(avatar => {
    return (
      <div className="mini-view-avatar">
        {isImgUrl(avatar) && (
          <div
            className="mini-view-avatar-blurView"
            style={{
              backgroundImage: `url(${avatar})`
            }}
          />
        )}
        <Avatar url={avatar} />
      </div>
    )
  }, [])

  useEffect(() => {
    if (state.status !== 'audio') {
      const videoSrcObj =
        state.status === 'meeting'
          ? window.netcall.getMeetingBigVideoObject()
          : window.netcall.getP2pBigVideoObject()
      if (videoSrcObj) {
        videoRef.current.srcObject = videoSrcObj
        const playPromise = videoRef.current.play()
        if (playPromise) {
          playPromise.catch(() => {})
        }
      }
    }
  }, [state.status])

  return (
    <>
      <Draggable
        defaultPosition={{ x: -10, y: process.env.REACT_APP_TYPE === 'win' ? 35 : 10 }}
        bounds={{
          top: -216 + 30 + (process.env.REACT_APP_TYPE === 'win' ? 25 : 0),
          left: -window.innerWidth + 30,
          right: 280 - 30,
          bottom: window.innerHeight - 30
        }}
      >
        <div className={classNames('mini-view-wrapper', { audio: state.status === 'audio' })}>
          <div className="mini-view-heading">
            <Duration className="netcall-timing" />
          </div>
          {state.status !== 'audio' && (
            <div className="mini-view-video">
              <video
                id="mini-view-video"
                ref={videoRef}
                x-webkit-airplay="x-webkit-airplay"
                playsInline="playsinline"
                webkit-playsinline="webkit-playsinline"
                muted
              >
                <track kind="captions" />
              </video>
              {state.status === 'video'
                ? state.remoteEmpty && renderBlurAvatar(state.avatar)
                : curBigViewCameraDisabled() && renderBlurAvatar(state.currBigViewAvatar)}
            </div>
          )}
          <span className="mini-view-info">
            <span>
              {state.status === 'meeting'
                ? state.currBigViewNick +
                  (state.caller === state.currBigViewAccount ? '(主持人)' : '')
                : state.localBigView
                ? state.myNick
                : state.nick}
            </span>
            {renderMicphone()}
          </span>
          <div className="mini-view-footer">
            {state.status === 'audio' && renderBlurAvatar(state.avatar)}
            <div>
              <ControlSlider
                disabled={state.microphoneDisabled}
                onAfterChange={microphoneAfterChange}
              >
                <IconButton
                  name={state.microphoneDisabled ? 'unvoice-f' : 'voice-f'}
                  title={state.microphoneTitle}
                  className={classNames('netcall-button microphone', {
                    'no-device': state.microphoneNoDevice
                  })}
                  onClick={switchAudioIn}
                />
              </ControlSlider>
              {state.status === 'video' && (
                <IconButton
                  name={state.cameraDisabled ? 'unvideo-f' : 'video-f'}
                  title={state.cameraTitle}
                  className={classNames('netcall-button camera', {
                    'no-device': state.cameraNoDevice
                  })}
                  onClick={switchCamera}
                />
              )}
              <IconButton
                name="hangup-f"
                title="挂断"
                className="netcall-button red"
                onClick={handleHangup}
              />
            </div>
            <Icon
              name="fullscreen"
              size="16px"
              title="大窗口模式"
              className="mini-view-switch"
              onClick={handleToggleMiniMode}
            />
          </div>
        </div>
      </Draggable>
      {showConfirm && <EndMeetingConfirm onCancel={handleCancel} />}
    </>
  )
})

export default MiniView
