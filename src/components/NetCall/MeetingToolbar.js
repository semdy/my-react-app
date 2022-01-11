import React, { useCallback, useEffect, useState } from 'react'
import { Dropdown, Menu, message } from 'antd'
import Icon from '@/components/Icon'
import imUtils from '@/utils/im'
import { copyToClipboard } from '@/utils/utils'
import { useNetCallReducer, setSiderShow, showSetting, toggleGridView } from './model'
import Duration from './Duration'

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

const MeetingToolbar = React.memo(() => {
  const [state, dispatch] = useNetCallReducer()
  const [channelName, setChannelName] = useState(state.channelName)

  const handleCopy = useCallback(() => {
    copyToClipboard(channelName.replace(/\s/g, '')).then(() => {
      message.success('复制成功')
    })
  }, [channelName])

  const handleFullScreen = useCallback(() => {
    window.netcall.toggleAbsFullScreen()
  }, [])

  const handleSetting = useCallback(() => {
    dispatch(showSetting(true))
  }, [dispatch])

  const handleAddUser = useCallback(() => {
    dispatch(setSiderShow(!state.siderShow))
  }, [dispatch, state.siderShow])

  const handleChangeToGrid = useCallback(() => {
    dispatch(toggleGridView())
  }, [dispatch])

  useEffect(() => {
    setChannelName(imUtils.formatChannelName(state.channelName))
  }, [state.channelName])

  return (
    <div className="netcall-video-toolbar">
      <div className="meeting-info">
        <div className="meeting-info-top">
          <Duration className="netcall-timing" />
          <span className="netcall-divider" />
          <span>会议号: {channelName}</span>
          <Icon name="copy" title="复制房间号" className="netcall-copy" onClick={handleCopy} />
        </div>
        <div className="meeting-subject">{state.meetingSubject}</div>
      </div>
      <div className="netcall-video-actions">
        <div className="netcall-actions-wrap">
          <Icon
            name={state.absFullScreen ? 'unfullscreen' : 'fullscreen'}
            title={state.absFullScreen ? '退出全屏' : '全屏'}
            onClick={handleFullScreen}
          />
          <Icon name="setting-t" title="通话设定" onClick={handleSetting} />
          {state.myAccount === state.caller && (
            <AdjustActions locked={state.meetingLocked} muted={state.meetingMuted} />
          )}
          <Icon name="grid" title="列表模式" onClick={handleChangeToGrid} />
          <Icon
            name={state.siderShow ? 'collapse-right' : 'add-user-f'}
            title={state.siderShow ? '收起侧边栏' : '添加会议成员'}
            onClick={handleAddUser}
          />
        </div>
      </div>
    </div>
  )
})

export default MeetingToolbar
