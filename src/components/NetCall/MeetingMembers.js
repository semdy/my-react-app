import React from 'react'
import propTypes from 'prop-types'
import Icon from '@/components/Icon'
import { Provider } from '@/components/AppearWrapper'
import MeetingMemberItemWrapper from './MeetingMemberItemWrapper'
import MeetingMemberItem from './MeetingMemberItem'
import { useNetCallReducer } from './model'
import config from './config'
import './MeetingMembers.less'

const MeetingMembers = React.memo(props => {
  const [state] = useNetCallReducer()
  const observerDisabled = state.members.length <= config.disableObserveLength

  return (
    <Provider threshold={1} rootMargin="200px 10px 200px 10px" disabled={observerDisabled}>
      <div id="netcall-meeting-box" className="meeting-members">
        {state.members.map(member => (
          <MeetingMemberItemWrapper
            key={member.account}
            account={member.account}
            myAccount={state.myAccount}
            joined={member.joined}
            isCaller={state.caller === member.account}
          >
            <MeetingMemberItem
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
              <span className="meeting-tip meeting-loading">
                <Icon name="spinner" size="16px" style={{ marginRight: 5 }} />
                <span>接通中...</span>
              </span>
            </MeetingMemberItem>
          </MeetingMemberItemWrapper>
        ))}
      </div>
    </Provider>
  )
})

MeetingMembers.defaultProps = {
  miniMode: false
}

MeetingMembers.propTypes = {
  miniMode: propTypes.bool
}

export default MeetingMembers
