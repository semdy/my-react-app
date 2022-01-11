import React, { useCallback } from 'react'
import './EndMeetingConfirm.less'

/* 结束会议弹窗 */
const EndMeetingConfirm = React.memo(props => {
  const handleLeaveMeeting = useCallback(() => {
    window.netcall.leaveChannel()
  }, [])

  const handleEndMeeting = useCallback(() => {
    window.netcall.leaveChannel(true)
  }, [])

  const handleCancel = useCallback(() => {
    props.onCancel()
  }, [props])

  return (
    <div className="meeting-end-confirm-modal">
      <div className="meeting-end-confirm-content">
        <h2>结束会议将解散所有参会人，是否结束？</h2>
        <h5>若仅自己离开，系统自动指派一名主持人.</h5>
        <div className="meeting-end-confirm-footer">
          <div>
            <button type="button" className="meeting-button" onClick={handleCancel}>
              取消
            </button>
          </div>
          <div>
            <button type="button" className="meeting-button" onClick={handleLeaveMeeting}>
              离开会议
            </button>
            <button type="button" className="meeting-button red" onClick={handleEndMeeting}>
              结束会议
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

export default EndMeetingConfirm
