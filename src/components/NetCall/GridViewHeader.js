import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Dropdown, Menu, message } from 'antd'
import Icon from '@/components/Icon'
import { useRelay } from '@/layouts/GlobalModals/hooks'
import GlobalContext from '@/context/GlobalContext'
import imUtils from '@/utils/im'
import { copyToClipboard } from '@/utils/utils'
import MeetingSearch from './MeetingSearch'
import Duration from './Duration'
import { useNetCallReducer, showSetting, toggleGridView, shareMeeting } from './model'

const AdjustActions = React.memo(({ locked, muted }) => {
  const handleMenuCallback = useCallback(
    action => {
      switch (action) {
        case 'muteMeeting':
          window.netcall.disableSpeakAll(!muted)
          break
        case 'lockMeeting':
          window.netcall.lockMeeting(!locked)
          break
        default:
      }
    },
    [locked, muted]
  )

  const createMenu = useCallback(() => {
    const adjustMenuData = [
      { icon: 'voice-f', text: muted ? '解除静音' : '全员静音', action: 'muteMeeting' },
      { icon: 'lock', text: locked ? '解除锁定' : '锁定会议', action: 'lockMeeting' }
    ]
    return (
      <Menu>
        {adjustMenuData.map((menu, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Menu.Item key={i} onClick={() => handleMenuCallback(menu.action)}>
            <Icon name={menu.icon} />
            <span>{menu.text}</span>
          </Menu.Item>
        ))}
      </Menu>
    )
  }, [handleMenuCallback, locked, muted])

  return (
    <Dropdown
      trigger={['hover']}
      placement="bottomCenter"
      overlayClassName="netcall-dropdown"
      overlay={createMenu()}
    >
      <Icon name="adjust" />
    </Dropdown>
  )
})

const GridViewHeader = React.memo(() => {
  const [state, dispatch] = useNetCallReducer()
  const [channelName, setChannelName] = useState(state.channelName)
  const relayState = useRelay()
  const context = useContext(GlobalContext)

  const handleSetting = useCallback(() => {
    dispatch(showSetting(true))
  }, [dispatch])

  const handleChangeToVideo = useCallback(() => {
    dispatch(toggleGridView())
  }, [dispatch])

  const showShare = useCallback(() => {
    context.showRelayModal(true, 'dark')
  }, [context])

  const handleCopy = useCallback(() => {
    copyToClipboard(channelName).then(() => {
      message.success('复制成功')
    })
  }, [channelName])

  useEffect(() => {
    const disableList = state.members.map(member => member.account)
    context.setRelayDisabledList(disableList)
  }, [context, state.members])

  useEffect(() => {
    if (relayState.confirm) {
      const accounts = relayState.detail.map(member => member.id)
      dispatch(shareMeeting(accounts))
    }
  }, [relayState.confirm]) // eslint-disable-line

  useEffect(() => {
    setChannelName(imUtils.formatChannelName(state.channelName))
  }, [state.channelName])

  return (
    <div className="meeting-gridView-header">
      <div>
        <Duration className="netcall-timing" />
        <span className="netcall-divider" />
        <span>会议号: {channelName}</span>
        <Icon name="copy" title="复制房间号" className="netcall-copy" onClick={handleCopy} />
      </div>
      <MeetingSearch joinedMembers={state.members} />
      <div className="netcall-video-actions">
        <Icon name="share" title="分享视频会议" onClick={showShare} />
        <Icon name="setting-t" title="通话设定" onClick={handleSetting} />
        {state.myAccount === state.caller && (
          <AdjustActions locked={state.meetingLocked} muted={state.meetingMuted} />
        )}
        <Icon name="netcall-list" title="视频模式" onClick={handleChangeToVideo} />
      </div>
    </div>
  )
})

export default GridViewHeader
