import React, { useCallback, useContext, useEffect, useState } from 'react'
import GlobalContext from '@/context/GlobalContext'
import { dispatchCustomEvent } from '@/utils/utils'
import CreateGroupModal from './CreateGroupModal'
import RelayModal from './RelayModal'
import TransmitModal from './TransmitModal'
import FileInfoModal from './FileInfoModal'

const GlobalModals = React.memo(() => {
  const [state, setState] = useState({
    relayVisible: false,
    createGroupVisible: false,
    transmitVisible: false,
    fileInfoVisible: false,
    canJoinExternal: true,
    createGroupDisabledList: [],
    createGroupCheckedList: [],
    createGroupSessionType: 'all',
    relayDisabledList: [],
    relayCheckedList: [],
    relaySessionType: 'all',
    singleSelect: false,
    transmitDisabledList: [],
    transmitCheckedList: [],
    transmitSessionType: 'all',
    scene: 'p2p',
    to: null,
    theme: 'default', // enum 'default' | 'dark'
    relayTitle: '转发',
    isCalendarSubscriber: false
  })

  const context = useContext(GlobalContext)

  useEffect(() => {
    context.showCreateGroupModal = (value, scene, theme) => {
      setState(state => ({ ...state, createGroupVisible: value, scene, theme: theme || 'default' }))
    }

    context.showRelayModal = (value, theme, title) => {
      setState(state => ({
        ...state,
        relayVisible: value,
        theme: theme || 'default',
        relayTitle: title || '转发'
      }))
    }

    context.showTransmitModal = (value, to, scene, dispatch, theme) => {
      setState(state => ({
        ...state,
        transmitVisible: value,
        to: to || null,
        scene: scene || null,
        theme: theme || 'default'
      }))
    }

    context.showFileInfoModal = (visible, fileId) => {
      setState(state => ({
        ...state,
        fileInfoVisible: visible,
        fileId
      }))
    }

    context.resetFileInfoModal = () => {
      setState(state => ({
        ...state,
        fileInfoVisible: false
      }))
    }

    context.setTheme = value => {
      setState(state => ({ ...state, theme: value }))
    }

    context.setCreateGroupDisabledList = (disabledList, canJoinExternal = true) => {
      setState(state => ({ ...state, createGroupDisabledList: disabledList, canJoinExternal }))
    }

    context.setCreateGroupCheckedList = checkedList => {
      setState(state => ({ ...state, createGroupCheckedList: checkedList }))
    }

    context.setCreateGroupSessionType = type => {
      setState(state => ({ ...state, createGroupSessionType: type }))
    }

    context.setCreateGroupSingleSelect = type => {
      setState(state => ({ ...state, singleSelect: type }))
    }

    context.resetCreateGroup = () => {
      setState(state => ({
        ...state,
        createGroupDisabledList: [],
        createGroupCheckedList: [],
        createGroupSessionType: 'all',
        singleSelect: false,
        isCalendarSubscriber: false
      }))
    }

    context.setRelayDisabledList = disabledList => {
      setState(state => ({ ...state, relayDisabledList: disabledList }))
    }

    context.setRelayCheckedList = checkedList => {
      setState(state => ({ ...state, relayCheckedList: checkedList }))
    }

    context.setRelaySessionType = type => {
      setState(state => ({ ...state, relaySessionType: type }))
    }

    context.setRelaySingleSelect = type => {
      setState(state => ({ ...state, singleSelect: type }))
    }

    context.setRelayCalendarSubscriber = bool => {
      setState(state => ({ ...state, isCalendarSubscriber: bool }))
    }

    context.resetRelay = () => {
      setState(state => ({
        ...state,
        relayDisabledList: [],
        relayCheckedList: [],
        relaySessionType: 'all',
        singleSelect: false,
        isCalendarSubscriber: false
      }))
    }

    context.setTransmitDisabledList = disabledList => {
      setState(state => ({ ...state, transmitDisabledList: disabledList }))
    }

    context.setTransmitCheckedList = checkedList => {
      setState(state => ({ ...state, transmitCheckedList: checkedList }))
    }

    context.setTransmitSessionType = type => {
      setState(state => ({ ...state, transmitSessionType: type }))
    }

    context.setTransmitSingleSelect = type => {
      setState(state => ({ ...state, singleSelect: type }))
    }

    context.resetTransmit = () => {
      setState(state => ({
        ...state,
        transmitDisabledList: [],
        transmitCheckedList: [],
        transmitSessionType: 'all',
        singleSelect: false,
        isCalendarSubscriber: false
      }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateGroup = useCallback(
    (confirm, list, teamName) => {
      context.showCreateGroupModal(false)
      if (confirm) {
        dispatchCustomEvent('createGroupConfirm', {
          list,
          teamName
        })
      } else {
        context.resetCreateGroup()
        dispatchCustomEvent('createGroupCancel')
      }
    },
    [context]
  )

  const handleRelay = useCallback(
    (confirm, list) => {
      context.showRelayModal(false)
      if (confirm) {
        dispatchCustomEvent('relayConfirm', list)
      } else {
        context.resetRelay()
        dispatchCustomEvent('relayCancel')
      }
    },
    [context]
  )

  const handleTransmit = useCallback(
    (confirm, list) => {
      context.showTransmitModal(false)
      if (confirm) {
        dispatchCustomEvent('transmitConfirm', list)
      } else {
        context.resetTransmit()
        dispatchCustomEvent('transmitCancel')
      }
    },
    [context]
  )

  return (
    <>
      <CreateGroupModal
        theme={state.theme}
        scene={state.scene}
        visible={state.createGroupVisible}
        disabledList={state.createGroupDisabledList}
        checkedList={state.createGroupCheckedList}
        showSessionType={state.createGroupSessionType}
        singleSelect={state.singleSelect}
        canJoinExternal={state.canJoinExternal}
        onConfirm={(list, teamName) => handleCreateGroup(true, list, teamName)}
        onCancel={() => handleCreateGroup(false)}
      />
      <RelayModal
        theme={state.theme}
        visible={state.relayVisible}
        disabledList={state.relayDisabledList}
        checkedList={state.relayCheckedList}
        showSessionType={state.relaySessionType}
        singleSelect={state.singleSelect}
        canJoinExternal={state.canJoinExternal}
        onConfirm={list => handleRelay(true, list)}
        onCancel={() => handleRelay(false)}
        title={state.relayTitle}
        isCalendarSubscriber={state.isCalendarSubscriber}
      />
      <TransmitModal
        scene={state.scene}
        to={state.to}
        theme={state.theme}
        visible={state.transmitVisible}
        disabledList={state.transmitDisabledList}
        checkedList={state.transmitCheckedList}
        showSessionType={state.transmitSessionType}
        singleSelect={state.singleSelect}
        onConfirm={list => handleTransmit(true, list)}
        onCancel={() => handleTransmit(false)}
      />
      <FileInfoModal
        visible={state.fileInfoVisible}
        fileId={state.fileId}
        onCancel={context.resetFileInfoModal}
      />
    </>
  )
})

export default GlobalModals
