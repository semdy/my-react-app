import React from 'react'
import propTypes from 'prop-types'
import { Provider } from '@/components/AppearWrapper'
import GridViewHeader from './GridViewHeader'
import MeetingMemberItem from './MeetingMemberItem'
import GridViewItemContent from './GridViewItemContent'
import { useNetCallReducer } from './model'
import config from './config'
import './GridView.less'

const MeetingMembers = React.memo(props => {
  const [state] = useNetCallReducer()
  const observerDisabled = state.members.length <= config.disableObserveLength

  return (
    <div className="meeting-gridView">
      <GridViewHeader />
      <Provider threshold={0.99} disabled={observerDisabled}>
        <div id="meeting-gridview-box" className="meeting-gridView-container">
          {state.meetingMuted && (
            <div className="meeting-gridView-all-tips">主持人已开启全员静音</div>
          )}
          {state.members.map(member => (
            <MeetingMemberItem
              key={member.account}
              member={member}
              miniMode={props.miniMode}
              microphoneDisabled={state.microphoneDisabled}
              microphoneTitle={state.microphoneTitle}
              lockDisabled={state.lockDisabled}
              lockTitle={state.lockTitle}
              meetingLocked={state.meetingLocked}
              cameraDisabled={state.cameraDisabled}
              cameraTitle={state.cameraTitle}
              cameraNoDevice={state.cameraNoDevice}
              microphoneNoDevice={state.microphoneNoDevice}
              isCaller={state.caller === state.myAccount}
              isItemCaller={state.caller === member.account}
              isSelf={state.myAccount === member.account}
              currBigViewAccount={state.currBigViewAccount}
              itemCameraDisabled={state.cameraStatus[member.account] === false}
              itemMicrophoneDisabled={state.microphoneStatus[member.account] === false}
            >
              <GridViewItemContent
                account={member.account}
                myAccount={state.myAccount}
                joined={member.joined}
                observerDisabled={observerDisabled}
              />
            </MeetingMemberItem>
          ))}
        </div>
      </Provider>
    </div>
  )
})

MeetingMembers.defaultProps = {
  miniMode: false
}

MeetingMembers.propTypes = {
  miniMode: propTypes.bool
}

export default MeetingMembers
