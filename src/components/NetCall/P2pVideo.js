import React, { useCallback } from 'react'
import classNames from 'classnames'
import IconButton from '@/components/IconButton'
import Icon from '@/components/Icon'
import { isImgUrl } from '@/utils/utils'
import Avatar from '@/components/Avatar'
import NetCallWindow from './NetCallWindow'
import { toggleMiniMode, useNetCallReducer, showSetting } from './model'
import Duration from './Duration'
import './index.less'

/* p2p视频界面 */
const P2pVideo = React.memo(() => {
  const [state, dispatch] = useNetCallReducer()

  const switchToAudio = useCallback(() => {
    window.netcall.requestSwitchToAudio()
  }, [])

  const handleFullScreen = useCallback(() => {
    window.netcall.toggleAbsFullScreen()
  }, [])

  const handleSetting = useCallback(() => {
    dispatch(showSetting(true))
  }, [dispatch])

  const switchViewPosition = useCallback(() => {
    window.netcall.switchViewPosition()
  }, [])

  const handleMinimize = useCallback(() => {
    dispatch(toggleMiniMode())
  }, [dispatch])

  return (
    <NetCallWindow {...state} onMinimize={handleMinimize}>
      <div className="netcall-video-toolbar">
        <Duration className="netcall-timing" />
        <div className="netcall-video-actions">
          <div className="netcall-actions-wrap">
            <Icon
              name={state.absFullScreen ? 'unfullscreen' : 'fullscreen'}
              title={state.absFullScreen ? '退出全屏' : '全屏'}
              onClick={handleFullScreen}
            />
            <Icon name="setting" title="通话设定" onClick={handleSetting} />
            <Icon name="voice-f" title="切换到语音通话" onClick={switchToAudio} />
          </div>
        </div>
      </div>
      <div className={classNames('netcall-video-viewport', { reverse: state.viewReverse })}>
        <div
          id="netcall-video-remote"
          className={classNames('netcall-video-main', {
            bigView: state.remoteBigView,
            smallView: !state.remoteBigView,
            empty: state.remoteEmpty,
            shareScreen: state.isShareScreen
          })}
        >
          {state.remoteEmpty && (
            <div className="netcall-video-avatar">
              {isImgUrl(state.avatar) && (
                <div
                  className="netcall-blurView"
                  style={{
                    backgroundImage: `url(${state.avatar})`
                  }}
                />
              )}
              <Avatar className="netcall-avatar" url={state.avatar} />
            </div>
          )}
          <div className="netcall-video-tip">{state.remoteMessage}</div>
          <div className="netcall-video-info">
            <span>{state.nick}</span>
            {state.remoteMicrophoneDisabled && (
              <IconButton
                name="unvoice-f"
                title="对方关闭了麦克风"
                size="12px"
                className="netcall-button red small"
              />
            )}
          </div>
          {!state.remoteBigView && (
            <IconButton
              name="fullscreen"
              size="12px"
              className="netcall-button small netcall-video-switch-position"
              title="切换大视图"
              onClick={switchViewPosition}
            />
          )}
        </div>

        <div
          id="netcall-video-local"
          className={classNames('netcall-video-thumb', {
            bigView: state.localBigView,
            smallView: !state.localBigView,
            empty: state.localEmpty,
            shareScreen: state.isShareScreen
          })}
        >
          <div className="netcall-video-tip">{state.localMessage}</div>
          <div className="netcall-video-info">
            <span>{state.myNick}</span>
            {state.microphoneDisabled && (
              <IconButton
                name="unvoice-f"
                title="您关闭了麦克风"
                size="12px"
                className="netcall-button red small"
              />
            )}
          </div>
          {!state.localBigView && (
            <IconButton
              name="fullscreen"
              size="12px"
              className="netcall-button small netcall-video-switch-position"
              title="切换大视图"
              onClick={switchViewPosition}
            />
          )}
        </div>
      </div>
    </NetCallWindow>
  )
})

export default P2pVideo
