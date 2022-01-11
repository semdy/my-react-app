import React, { useState, useCallback } from 'react'
import classNames from 'classnames'
import IconButton from '@/components/IconButton'
import Avatar from '@/components/Avatar'
import { isImgUrl } from '@/utils/utils'
import NetCallWindow from './NetCallWindow'
import MeetingToolbar from './MeetingToolbar'
import MeetingSider from './MeetingSider'
import GridView from './GridView'
import EndMeetingConfirm from './EndMeetingConfirm'
import { useNetCallReducer, toggleMiniMode } from './model'
import './Meeting.less'

const Meeting = React.memo(() => {
  const [state, dispatch] = useNetCallReducer()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleHangup = useCallback(() => {
    if (state.caller === state.myAccount) {
      const joinedMembers = state.members.filter(member => member.joined)
      if (joinedMembers.length > 1) {
        setShowConfirm(true)
        return false
      }
    }
  }, [state.caller, state.members, state.myAccount])

  const handleMinimize = useCallback(() => {
    dispatch(toggleMiniMode())
  }, [dispatch])

  const handleCancel = useCallback(() => {
    setShowConfirm(false)
  }, [])

  const curBigViewCameraDisabled = () => {
    return state.cameraStatus[state.currBigViewAccount] === false
  }

  const renderMicrophoneFlag = () => {
    const isSelf = state.myAccount === state.currBigViewAccount
    const itemMicrophoneDisabled = state.microphoneStatus[state.currBigViewAccount] === false
    if (isSelf) {
      return (
        state.microphoneDisabled && (
          <IconButton
            name="unvoice-f"
            title={state.microphoneTitle}
            size="12px"
            className="netcall-button red small"
            style={{ cursor: 'default' }}
          />
        )
      )
    }
    return (
      itemMicrophoneDisabled && (
        <IconButton
          name="unvoice-f"
          title="麦克风已关闭"
          size="12px"
          className="netcall-button red small"
          style={{ cursor: 'default' }}
        />
      )
    )
  }

  return (
    <NetCallWindow {...state} onHangup={handleHangup} onMinimize={handleMinimize}>
      <div className="meeting-container">
        <div className={classNames('meeting-bigView', { shareScreen: state.isShareScreen })}>
          {curBigViewCameraDisabled() ? (
            <div className="meeting-bigView-avatar">
              {isImgUrl(state.currBigViewAvatar) && (
                <div
                  className="meeting-bigView-blurView"
                  style={{
                    backgroundImage: `url(${state.currBigViewAvatar})`
                  }}
                />
              )}
              <Avatar url={state.currBigViewAvatar} />
            </div>
          ) : (
            <video
              id="meeting-video-bigView"
              className="meeting-video-bigView"
              x-webkit-airplay="x-webkit-airplay"
              playsInline="playsinline"
              webkit-playsinline="webkit-playsinline"
              muted
            >
              <track kind="captions" />
            </video>
          )}
          <MeetingToolbar />
          {state.meetingMuted && !state.gridMode && (
            <div className="meeting-video-all-tips">主持人已开启全员静音</div>
          )}
          {!!state.currBigViewNick && (
            <div className="netcall-video-info">
              <span>
                {state.currBigViewNick}（主持人/{state.callerNick || '空缺'}）
              </span>
              {renderMicrophoneFlag()}
            </div>
          )}
        </div>
        <MeetingSider />
      </div>
      {state.gridMode && (
        <>
          <span className="meeting-gridView-subject">{state.meetingSubject}</span>
          <GridView />
        </>
      )}
      {showConfirm && <EndMeetingConfirm onCancel={handleCancel} />}
    </NetCallWindow>
  )
})

export default Meeting
