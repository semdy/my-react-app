import React, { useCallback, useState } from 'react'
import classNames from 'classnames'
import Draggable from 'react-draggable'
import Avatar from '@/components/Avatar'
import Icon from '@/components/Icon'
import IconButton from '@/components/IconButton'
import ControlSlider from '@/components/ControlSlider'
import { isImgUrl } from '@/utils/utils'
import { toggleMiniMode, useNetCallReducer } from './model'
import Duration from './Duration'
import './index.less'

function computeVolume(value) {
  return parseInt((255 * value) / 10, 10)
}

const P2pAudio = React.memo(() => {
  const [state, dispatch] = useNetCallReducer()
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })

  const handleHangUp = useCallback(() => {
    window.netcall.hangup()
  }, [])

  const switchToVideo = useCallback(() => {
    window.netcall.requestSwitchToVideo()
  }, [])

  const switchAudioIn = useCallback(() => {
    window.netcall.switchAudioIn()
  }, [])

  const switchAudioOut = useCallback(() => {
    window.netcall.switchAudioOut()
  }, [])

  const microphoneAfterChange = useCallback(value => {
    window.netcall.setCaptureVolume(computeVolume(value))
  }, [])

  const volumeAfterChange = useCallback(value => {
    window.netcall.setPlayVolume(computeVolume(value))
  }, [])

  const toggleFullScreen = useCallback(() => {
    window.netcall.toggleFullScreen()
    setLastPosition({ x: 0, y: 0 })
  }, [])

  const handleMinimize = useCallback(() => {
    dispatch(toggleMiniMode())
  }, [dispatch])

  const handleDragStop = useCallback((event, params) => {
    setLastPosition({ x: params.x, y: params.y })
  }, [])

  return (
    <Draggable
      disabled={state.fullScreen}
      position={lastPosition}
      onStop={handleDragStop}
      bounds={{
        top:
          -300 -
          (window.innerHeight - 300) / 2 +
          30 +
          (process.env.REACT_APP_TYPE === 'win' ? 25 : 0),
        left: -480 - (window.innerWidth - 480) / 2 + 30,
        right: 480 + (window.innerWidth - 480) / 2 - 30,
        bottom: 300 + (window.innerHeight - 300) / 2 - 30
      }}
    >
      <div
        className={classNames('netcall-panel', state.type, {
          fullscreen: state.fullScreen
        })}
      >
        {isImgUrl(state.avatar) && (
          <div
            className="netcall-blurView"
            style={{
              backgroundImage: `url(${state.avatar})`
            }}
          />
        )}
        <div className="netcall-info">
          <div className="netcall-avatar-wrap">
            <Avatar className="netcall-avatar" url={state.avatar} />
            {state.remoteMicrophoneDisabled && (
              <IconButton
                name="unvoice-f"
                title="对方关闭了麦克风"
                size="12px"
                className="netcall-button red small"
              />
            )}
          </div>
          <div className="netcall-nick">{state.nick}</div>
          <Duration className="netcall-timing" />
        </div>
        <div className="netcall-actions">
          <ControlSlider disabled={state.microphoneDisabled} onAfterChange={microphoneAfterChange}>
            <IconButton
              name={state.microphoneDisabled ? 'unvoice-f' : 'voice-f'}
              title={state.microphoneTitle}
              className={classNames('netcall-button microphone', {
                'no-device': state.microphoneNoDevice
              })}
              onClick={switchAudioIn}
            />
          </ControlSlider>
          <ControlSlider disabled={state.volumeDisabled} onAfterChange={volumeAfterChange}>
            <IconButton
              name={state.volumeDisabled ? 'unvolume-f' : 'volume-f'}
              title={state.volumeTitle}
              className={classNames('netcall-button volume', {
                'no-device': state.volumeNoDevice
              })}
              onClick={switchAudioOut}
            />
          </ControlSlider>
          <IconButton
            name="hangup-f"
            title="挂断"
            className="netcall-button red"
            onClick={handleHangUp}
          />
        </div>
        <div className="netcall-switch-actions">
          <div>
            <span className="netcall-switch-type" onClick={switchToVideo}>
              切换到视频聊天
            </span>
          </div>
          <div>
            <Icon
              name="downgrade"
              className="netcall-switch-view"
              title="迷你模式"
              onClick={handleMinimize}
            />
            <Icon
              name={state.fullScreen ? 'unfullscreen' : 'fullscreen'}
              className="netcall-switch-fullscreen"
              title="切换全屏"
              onClick={toggleFullScreen}
            />
          </div>
        </div>
      </div>
    </Draggable>
  )
})

export default P2pAudio
