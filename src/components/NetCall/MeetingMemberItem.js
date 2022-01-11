import React, { useCallback, useEffect, useState } from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import { Dropdown, Menu, message } from 'antd'
import Avatar from '@/components/Avatar'
import Icon from '@/components/Icon'
import IconButton from '@/components/IconButton'
import { useNetCallReducer } from './model'
import './MeetingMemberItem.less'

const MoreActions = React.memo(props => {
  const [menuData, setMenuData] = useState([])

  const handleMenuCallback = useCallback(
    action => {
      props.onAction(action)
    },
    [props]
  )

  useEffect(() => {
    setMenuData(
      [
        { icon: 'voice-f', text: '移出当前会议', action: 'unjoinMeeting' },
        props.joined && { icon: 'lock', text: '设置为主持人', action: 'setAsCaller' }
      ].filter(Boolean)
    )
  }, [props.joined])

  const menu = useCallback(() => {
    return (
      <Menu>
        {menuData.map(menu => (
          <Menu.Item key={menu.action} onClick={() => handleMenuCallback(menu.action)}>
            <Icon name={menu.icon} />
            <span>{menu.text}</span>
          </Menu.Item>
        ))}
      </Menu>
    )
  }, [handleMenuCallback, menuData])

  return (
    <Dropdown
      trigger={['hover']}
      placement="bottomRight"
      overlayClassName="netcall-dropdown"
      overlay={menu}
    >
      <IconButton name="ellipsis" size="12px" className="netcall-button item-control" />
    </Dropdown>
  )
})

const MeetingMemberItem = React.memo(props => {
  const [state] = useNetCallReducer()

  const switchCamera = useCallback(() => {
    window.netcall.switchCamera()
  }, [])

  const switchAudioIn = useCallback(() => {
    if (state.caller !== state.myAccount) {
      if (state.meetingMuted) {
        message.info('主持人已开启全员静音')
        return
      }
    }

    window.netcall.switchAudioIn()
  }, [state.meetingMuted, state.caller, state.myAccount])

  const controlCamera = useCallback(() => {
    const id = props.itemCameraDisabled ? 16 : 15
    window.netcall.controlMemberDevice(props.member.account, 1, id)
  }, [props.member.account, props.itemCameraDisabled])

  const controlMicrophone = useCallback(() => {
    const id = props.itemMicrophoneDisabled ? 18 : 17
    window.netcall.controlMemberDevice(props.member.account, 2, id)
  }, [props.member.account, props.itemMicrophoneDisabled])

  const handleLockMeeting = useCallback(() => {
    if (!props.isCaller) return
    window.netcall.lockMeeting(!props.meetingLocked)
  }, [props.meetingLocked, props.isCaller])

  const handleBigView = useCallback(() => {
    if (!props.isCaller && props.meetingLocked) return
    window.netcall.setLocalStreamBigView(props.member.account, true)
  }, [props.member.account, props.meetingLocked, props.isCaller])

  const handleAction = useCallback(
    action => {
      switch (action) {
        case 'unjoinMeeting':
          window.netcall.unJoinMeeting(props.member.account)
          break
        case 'setAsCaller':
          window.netcall.setAsMeetingCaller(props.member.account)
          break
        default:
      }
    },
    [props.member.account]
  )

  const renderControls = () => {
    if (props.isCaller && !props.isSelf) {
      return (
        <>
          <IconButton
            name={props.itemMicrophoneDisabled ? 'unvoice-f' : 'voice-f'}
            title={props.itemMicrophoneDisabled ? '取消禁言' : '禁言'}
            size="12px"
            className="netcall-button item-control"
            onClick={controlMicrophone}
          />
          <IconButton
            name={props.itemCameraDisabled ? 'unvideo-f' : 'video-f'}
            title={props.itemCameraDisabled ? '打开视频' : '关闭视频'}
            size="12px"
            className="netcall-button item-control"
            onClick={controlCamera}
          />
          <MoreActions onAction={handleAction} joined={props.member.joined} />
        </>
      )
    }

    if (props.isSelf) {
      return (
        <>
          <IconButton
            name={props.microphoneDisabled ? 'unvoice-f' : 'voice-f'}
            title={props.microphoneTitle}
            size="12px"
            className={classNames('netcall-button  item-control', {
              'no-device': props.microphoneNoDevice
            })}
            onClick={switchAudioIn}
          />
          <IconButton
            name={props.cameraDisabled ? 'unvideo-f' : 'video-f'}
            title={props.cameraTitle}
            size="12px"
            className={classNames('netcall-button  item-control', {
              'no-device': props.cameraNoDevice
            })}
            onClick={switchCamera}
          />
        </>
      )
    }
  }

  const renderMicrophoneFlag = () => {
    if (props.isSelf) {
      return (
        props.microphoneDisabled && (
          <IconButton
            name="unvoice-f"
            title={props.microphoneTitle}
            size="12px"
            className="netcall-button red small"
            style={{ cursor: 'default' }}
          />
        )
      )
    }
    return (
      props.itemMicrophoneDisabled && (
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
    <div
      className={classNames('meeting-member-item', {
        mini: props.miniMode,
        actived: props.currBigViewAccount === props.member.account
      })}
      data-account={props.member.account}
    >
      {props.children}
      {props.isItemCaller && props.meetingLocked && (
        <IconButton
          name="lock"
          title={props.isCaller ? '解除锁定' : '会议已被主持人锁定'}
          size="12px"
          className="netcall-button item-control lock-button"
          style={{ cursor: props.isCaller ? 'pointer' : 'default' }}
          onClick={handleLockMeeting}
        />
      )}
      <div className="meeting-member-item-switch">
        <IconButton
          name="fullscreen"
          size="12px"
          className="netcall-button item-control"
          title={!props.isCaller && props.meetingLocked ? '已被主持人锁定' : '大视图'}
          onClick={handleBigView}
          style={{ cursor: !props.isCaller && props.meetingLocked ? 'default' : '' }}
        />
        {renderControls()}
      </div>
      {props.miniMode && (
        <>
          <div className="meeting-member-item-avatar">
            <Avatar url={props.member.avatar} />
            {renderMicrophoneFlag()}
          </div>
          <span>
            {props.member.nick}
            {props.isItemCaller ? '（主持人）' : ''}
          </span>
        </>
      )}
      <div className="meeting-member-item-bottom">
        <div>
          {!props.miniMode && (
            <>
              <span>
                {props.member.nick}
                {props.isItemCaller ? '(主持人)' : ''}
              </span>
              {renderMicrophoneFlag()}
            </>
          )}
        </div>
        {/* <div className="meeting-member-item-actions">
           <IconButton
            name={props.lockDisabled ? 'unpin' : 'pin'}
            title={props.lockTitle}
            size="12px"
            className="netcall-button small"
          />
          {renderControls()}
        </div> */}
      </div>
    </div>
  )
})

MeetingMemberItem.defaultProps = {
  miniMode: false
}

MeetingMemberItem.propTypes = {
  miniMode: propTypes.bool
}

export default MeetingMemberItem
