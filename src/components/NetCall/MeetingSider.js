import React, { useCallback, useContext, useEffect, useState } from 'react'
import classNames from 'classnames'
import Icon from '@/components/Icon'
import GlobalContext from '@/context/GlobalContext'
import { useRelay } from '@/layouts/GlobalModals/hooks'
import MeetingSearch from './MeetingSearch'
import MeetingMembers from './MeetingMembers'
import MeetingTeamMembers from './MeetingTeamMembers'
import { setSiderShow, shareMeeting, useNetCallReducer } from './model'
import './MeetingSider.less'

const SiderSearch = React.memo(props => {
  const [state] = useNetCallReducer()
  const [isFocus, setFocus] = useState(false)

  const handleFocus = useCallback(() => {
    setFocus(true)
  }, [])

  const handleBlur = useCallback(() => {
    setFocus(false)
  }, [])

  return (
    <div className="meeting-search-wrapper">
      <div
        className={classNames('meeting-search-bd', {
          focus: isFocus
        })}
      >
        <MeetingSearch joinedMembers={state.members} onFocus={handleFocus} onBlur={handleBlur} />
        <Icon name="share" title="分享视频会议" className="meeting-share" onClick={props.onShare} />
      </div>
    </div>
  )
})

const MeetingSider = React.memo(() => {
  const [state, dispatch] = useNetCallReducer()
  const [miniMode, setMiniMode] = useState(false)
  const relayState = useRelay()
  const context = useContext(GlobalContext)

  const toggleMiniMode = useCallback(() => {
    setMiniMode(miniMode => !miniMode)
  }, [])

  const handleAutoExchange = useCallback(() => {
    window.netcall.switchAutoExchange()
  }, [])

  const hideSider = useCallback(() => {
    dispatch(setSiderShow(false))
  }, [dispatch])

  const showShare = useCallback(() => {
    context.showRelayModal(true, 'dark')
  }, [context])

  useEffect(() => {
    const disableList = state.members.map(member => member.account)
    context.setRelayDisabledList(disableList)
  }, [context, state.members])

  useEffect(() => {
    if (relayState.confirm && !state.miniMode && !state.gridMode) {
      const accounts = relayState.detail.map(member => member.id)
      dispatch(shareMeeting(accounts))
    }
  }, [relayState.confirm, state.miniMode, state.gridMode]) // eslint-disable-line

  return (
    <div
      className="meeting-sider"
      style={{ display: state.siderShow ? '' : 'none' }}
      onMouseMove={e => e.stopPropagation()}
    >
      <div className="meeting-sider-hd">
        <span>参会人</span>
        <Icon name="collapse-right" title="收起侧边栏" onClick={hideSider} />
      </div>
      <div className="meeting-sider-bd">
        <SiderSearch onShare={showShare} />
      </div>
      <div className="meeting-sider-hd">
        <span>已在会议中({state.members.length})</span>
        <div>
          <Icon
            name={state.autoExchange ? 'exchange' : 'unexchange'}
            title={state.autoExchange ? '关闭自动切换画面' : '开启自动切换画面'}
            style={{ marginRight: 10 }}
            onClick={handleAutoExchange}
          />
          <Icon
            name={miniMode ? 'grid-list' : 'list'}
            title={miniMode ? '视频模式' : '列表模式'}
            onClick={toggleMiniMode}
          />
        </div>
      </div>
      <div className="meeting-sider-bd meeting-members-wrapper">
        <MeetingMembers miniMode={miniMode} />
      </div>
      <MeetingTeamMembers />
    </div>
  )
})

export default MeetingSider
