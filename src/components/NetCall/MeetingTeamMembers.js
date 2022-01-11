import React, { useCallback, useState } from 'react'
import classNames from 'classnames'
import Icon from '@/components/Icon'
import IconButton from '@/components/IconButton'
import Avatar from '@/components/Avatar'
import { useNetCallReducer } from './model'
import './MeetingTeamMembers.less'

const MeetingTeamMembers = React.memo(() => {
  const [showList, setShowList] = useState(false)
  const [state] = useNetCallReducer()

  const toggleList = useCallback(() => {
    setShowList(showList => !showList)
  }, [])

  const isInMeeting = useCallback(
    account => {
      return (
        state.members.map(item => item.account).includes(account) && state.myAccount !== account
      )
    },
    [state.members, state.myAccount]
  )

  const isSelf = useCallback(
    account => {
      return state.myAccount === account
    },
    [state.myAccount]
  )

  const getUnJoinCount = useCallback(() => {
    // return state.teamMembers.filter(item => {
    //   return (
    //     item.account !== state.myAccount &&
    //     !state.members.find(member => member.account === item.account)
    //   )
    // }).length
    return state.teamMembers.filter(item => item.account !== state.myAccount && !item.joined).length
  }, [state.myAccount, state.teamMembers])

  const handleJoin = useCallback(member => {
    window.netcall.joinMeeting({
      account: member.account,
      nick: member.nick,
      avatar: member.avatar
    })
  }, [])

  const renderActions = member => {
    if (isSelf(member.account)) return null
    return member.joined ? (
      <span className="meeting-teamUsers-item-extra">已加入</span>
    ) : isInMeeting(member.account) ? (
      <span className="meeting-teamUsers-item-extra">等待接通...</span>
    ) : (
      <IconButton
        name="phone-connect-f"
        size="12px"
        className="netcall-button green"
        onClick={() => handleJoin(member)}
      />
    )
  }

  return (
    <div
      className={classNames('meeting-teamUsers-wrapper', {
        open: showList
      })}
    >
      <div className="meeting-teamUsers-backdrop" onClick={toggleList} />
      <div className="meeting-teamUsers-content">
        <div className="meeting-teamUsers-hd" onClick={toggleList}>
          <span>未加入({getUnJoinCount()})</span>
          <Icon name="angle-up" className="meeting-teamUsers-angle" />
        </div>
        <div className="meeting-teamUsers-list">
          {state.teamMembers.map(member => (
            <div key={member.account} className="meeting-teamUsers-item">
              <Avatar url={member.avatar} />
              <span>{member.nick}</span>
              {renderActions(member)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default MeetingTeamMembers
