import React, { useEffect, useCallback } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { message } from 'antd'
import P2pCalling from './P2pCalling'
import MeetingCalling from './MeetingCalling'
import MeetingJoin from './MeetingJoin'
import P2pVideo from './P2pVideo'
import P2pAudio from './P2pAudio'
import Meeting from './Meeting'
import MiniView from './MiniView'
import CapturerSources from './CapturerSources'
import Setting from './Setting'
import Provider from './model/Provider'
import { netcallEvent, updateNetCall, showSetting, useNetCallReducer } from './model'
import initNetCallSDK from './model/initNetCallSDK'
import './index.less'

const NetCall = React.memo(() => {
  const [state, dispatch] = useNetCallReducer()

  const handleSettingClose = useCallback(() => {
    dispatch(showSetting(false))
  }, [dispatch])

  useEffect(() => {
    dispatch(initNetCallSDK())
    const unlisten = netcallEvent.listen(payload => {
      if (window.netcall && window.netcall.isActived()) {
        return message.info('您正在通话中，无法进行此操作。')
      }
      dispatch(
        updateNetCall({
          ...payload,
          visible: payload.visible,
          type: payload.type || '',
          role: payload.visible ? 'caller' : '',
          status: payload.status || 'calling',
          avatar: payload.avatar || '',
          members: payload.members || []
        })
      )
    })
    return unlisten
  }, []) // eslint-disable-line

  if (module.hot) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!state.visible && window.netcall) {
        window.netcall.hangupNetCall(true, true)
      }
    }, [state.visible])
  }

  return (
    state.visible && (
      <>
        <div
          className={classNames('netcall-wrapper', state.type, {
            calling: !!state.status && state.status !== 'meeting',
            fullscreen: state.fullScreen,
            hide: state.miniMode
          })}
        >
          {state.status === 'calling' && <P2pCalling />}
          {state.status === 'meetingCalling' && <MeetingCalling />}
          {state.status === 'meetingJoin' && <MeetingJoin />}
          {state.status === 'video' && <P2pVideo />}
          {state.status === 'audio' && <P2pAudio />}
          {state.status === 'meeting' && <Meeting />}
          {state.showCapturerSources && <CapturerSources />}
        </div>
        {state.miniMode && <MiniView />}
        <Setting
          visible={state.settingVisible}
          isMeeting={state.status === 'meeting'}
          onClose={handleSettingClose}
        />
      </>
    )
  )
})

const isEqual = (prevProps, nextProps) => {
  return nextProps.sdkReady === prevProps.sdkReady
}

const NetCallEntry = React.memo(({ sdkReady }) => {
  return (
    sdkReady && (
      <Provider>
        <NetCall />
      </Provider>
    )
  )
}, isEqual)

const mapStateToProps = ({ im: { sdkStatus } }) => {
  return {
    sdkReady: sdkStatus.ready
  }
}

export default connect(mapStateToProps)(NetCallEntry)
