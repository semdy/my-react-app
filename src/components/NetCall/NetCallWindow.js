import React, { useCallback, useEffect, useRef, useState } from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import Draggable from 'react-draggable'
import Icon from '@/components/Icon'
import { isFullScreen, exitFullScreen } from '@/utils/fullScreen'
import MeetingVideoControls from './MeetingVideoControls'
import NetStatus from './NetStatus'
import './NetCallWindow.less'

const NetCallWindow = React.memo(props => {
  const [showControl, setShowControl] = useState(true)
  const [lastPosition, setLastPosition] = useState({ x: -15, y: 0 })
  const timer = useRef(null)

  const handleHangUp = useCallback(() => {
    const result = props.onHangup()
    const doHangup = () => {
      if (!window.netcall) return
      if (props.status === 'meeting') {
        window.netcall.leaveChannel(true)
      } else {
        window.netcall.hangup()
      }
      if (isFullScreen()) {
        exitFullScreen()
      }
    }

    if (result instanceof Promise) {
      result.then(doHangup)
    } else if (result !== false) {
      doHangup()
    }
  }, [props])

  const handleMinimize = useCallback(() => {
    props.onMinimize()
  }, [props])

  const toggleFullScreen = useCallback(() => {
    window.netcall.toggleFullScreen()
    props.onToggleFullScreen()
  }, [props])

  const handleClose = useCallback(() => {
    if (props.onClose() !== false) {
      handleHangUp()
    }
  }, [handleHangUp, props])

  const showControlHandle = useCallback(() => {
    timer.current = setTimeout(() => {
      setShowControl(false)
      timer.current = null
    }, 5000)
  }, [])

  const clearControlTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
  }, [])

  const handleMouseMove = useCallback(() => {
    if (!showControl) {
      setShowControl(true)
    }
    clearControlTimer()
    showControlHandle()
  }, [clearControlTimer, showControl, showControlHandle])

  const handleControlMouseMove = useCallback(
    e => {
      e.stopPropagation()
      clearControlTimer()
    },
    [clearControlTimer]
  )

  const handleDragStop = useCallback((event, params) => {
    setLastPosition({ x: params.x, y: params.y })
  }, [])

  const getDragBounds = useCallback(() => {
    return {
      top: -(window.innerHeight - 600) / 2 + (process.env.REACT_APP_TYPE === 'win' ? 25 : 0),
      left: -962 - (window.innerWidth - 962) / 2 + 120,
      right: 962 + (window.innerWidth - 962) / 2 - 60,
      bottom: 602 + (window.innerHeight - 602) / 2 - 30
    }
  }, [])

  useEffect(() => {
    showControlHandle()
    return clearControlTimer
  }, []) // eslint-disable-line

  useEffect(() => {
    if (props.fullScreen) {
      setLastPosition({ x: 0, y: 0 })
    }
  }, [props.fullScreen])

  return (
    <Draggable
      disabled={props.fullScreen}
      position={lastPosition}
      bounds={getDragBounds()}
      handle=".netcall-window-header-p"
      onStop={handleDragStop}
    >
      <div
        className={classNames('netcall-window', props.type, {
          fullscreen: props.fullScreen
        })}
      >
        <div className="netcall-window-header">
          <div className="netcall-window-header-p" onDoubleClick={toggleFullScreen}>
            <NetStatus />
          </div>
          <div className="netcall-window-toolbar">
            <Icon name="win-min" onClick={handleMinimize} />
            <Icon name={props.fullScreen ? 'win-restore' : 'win-max'} onClick={toggleFullScreen} />
            <Icon name="close" className="win-close" onClick={handleClose} />
          </div>
        </div>
        <div className="netcall-window-content" onMouseMove={handleMouseMove}>
          {props.children}
          <MeetingVideoControls
            hasSider={props.siderShow && props.status === 'meeting'}
            visible={showControl}
            onMouseMove={handleControlMouseMove}
            onHangUp={handleHangUp}
            microphoneDisabled={props.microphoneDisabled}
            microphoneTitle={props.microphoneTitle}
            microphoneNoDevice={props.microphoneNoDevice}
            volumeDisabled={props.volumeDisabled}
            volumeTitle={props.volumeTitle}
            volumeNoDevice={props.volumeNoDevice}
            cameraDisabled={props.cameraDisabled}
            cameraTitle={props.cameraTitle}
            cameraNoDevice={props.cameraNoDevice}
            isShareScreen={props.isShareScreen}
          />
        </div>
      </div>
    </Draggable>
  )
})

NetCallWindow.defaultProps = {
  onMinimize: () => {},
  onToggleFullScreen: () => {},
  onClose: () => {},
  onHangup: () => {}
}

NetCallWindow.propTypes = {
  onMinimize: propTypes.func,
  onToggleFullScreen: propTypes.func,
  onClose: propTypes.func,
  onHangup: propTypes.func
}

export default NetCallWindow
