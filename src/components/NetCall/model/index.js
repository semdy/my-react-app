import { useContext } from 'react'
import { message } from 'antd'
import MSG_TYPE from '@/constants/MSG_TYPE'
import NetCallContext from '@/context/NetCallContext'
import { sendMsg } from '@/models/im/msgs'
import { saveTransmitAccounts } from '@/services/netcall'
import imUtils from '@/utils/im'
import { store } from '@/index'
import durationManager from '../hooks/DurationManager'
import shareManager from '../hooks/ShareManager'

export const useNetCallReducer = () => {
  return useContext(NetCallContext)
}

export const initialState = {
  visible: false,
  status: '',
  type: '',
  role: '',
  members: [],
  teamMembers: [],
  cameraStatus: {},
  microphoneStatus: {},
  showCapturerSources: false,
  newCreate: false,
  siderShow: true,
  absFullScreen: false,
  fullScreen: false,
  cameraDisabled: false,
  microphoneDisabled: false,
  volumeDisabled: false,
  lockDisabled: false,
  localEmpty: false,
  localMessage: '',
  remoteEmpty: false,
  remoteMessage: '',
  cameraNoDevice: false,
  cameraTitle: '开启摄像头',
  microphoneNoDevice: false,
  microphoneTitle: '关闭麦克风',
  remoteMicrophoneDisabled: false,
  volumeNoDevice: false,
  volumeTitle: '关闭扬声器',
  lockTitle: '锁定该视频',
  canSwitchToAudio: true,
  canHangup: true,
  acceptWaiting: false,
  acceptDisabled: false,
  banDisabled: true,
  localBigView: false,
  remoteBigView: true,
  viewReverse: false,
  canDesktopShare: false,
  callWaiting: true,
  isShareScreen: false,
  miniMode: false,
  gridMode: false,
  settingVisible: false,
  durationTiming: '00 : 00',
  meetingSubject: '',
  channelName: '',
  channelId: '',
  to: '',
  nick: '',
  avatar: '',
  tip: '',
  myAccount: null,
  myNick: '',
  currBigViewAccount: null,
  currBigViewAvatar: null,
  currBigViewNick: '',
  caller: null,
  callerNick: '',
  meetingLocked: false,
  meetingMuted: false,
  autoExchange: false,
  createChannelWaiting: false,
  shareDoc: { sharing: false, inviter: '', fileId: '', isTeacher: false, fileName: '' },
  shareDocRedPoint: false
}

export function updateNetCall(payload) {
  return {
    type: 'updateNetCall',
    payload
  }
}

export function showNetCall(payload = {}, win) {
  // let avatar = ''
  // if (payload.status === 'meetingJoin') {
  //   const {
  //     user: { myInfo }
  //   } = store.getState().im
  //   avatar = imUtils.getAvatar(myInfo)
  // }
  imUtils.postMessage(
    'showNetCall',
    {
      visible: true,
      // avatar,
      ...payload
    },
    win
  )
}

export const netcallEvent = {
  listen: callback => {
    const listener = event => {
      if (event.origin !== window.location.origin || typeof event.data !== 'object') {
        return
      }
      const { command, payload } = event.data
      if (command === 'showNetCall' && typeof callback === 'function') {
        if (!window.netcall) {
          return message.warn('音视频尚未初始化完成，请稍候重试！')
        }
        callback(payload)
      }
    }

    window.addEventListener('message', listener, false)

    return () => {
      window.removeEventListener('message', listener, false)
    }
  }
}

// 显示或隐藏会议侧边栏
export const setSiderShow = visible => {
  return {
    type: 'setSiderShow',
    payload: visible
  }
}

// 显示或隐藏音视频设置界面
export const showSetting = visible => {
  return {
    type: 'showSetting',
    payload: visible
  }
}

// 显示或隐藏会议侧边栏
export const toggleGridView = () => {
  return {
    type: 'toggleGridMode'
  }
}

function parseAccount(account, type) {
  const ret = account.split('-')
  if (ret.length === 2) {
    return account
  }
  return `${type}-${account}`
}

function saveShareAccountsToServer(channelId, accounts) {
  return saveTransmitAccounts({
    channelId,
    toList: accounts.map(account => {
      const { scene, to } = imUtils.parseSession(account)
      return {
        type: scene === 'p2p' ? 0 : 1,
        id: to
      }
    })
  })
}

// 判断目标对象是否已经分享过该会议消息
function isMeetingSharedTo(channelName, account) {
  return shareManager.hasItem(channelName, account)
}

// 分享会议到个人
export const shareMeeting = accounts => {
  return (dispatch, getState) => {
    const { channelName, channelId, meetingSubject, myAccount, myNick } = getState()
    const duration = durationManager.getDuration(channelName)
    const durationText = durationManager.getDurationText(channelName)
    accounts.forEach(account => {
      if (isMeetingSharedTo(channelName, account)) return
      shareManager.addItem(channelName, account)
      const { scene, to } = imUtils.parseSession(account)
      store.dispatch(
        sendMsg({
          type: MSG_TYPE.CUSTOM,
          scene,
          to,
          pushContent: '[视频会议]',
          content: {
            type: 1004,
            data: {
              channelId,
              channelName,
              meetingSubject,
              duration,
              durationText,
              from: myAccount,
              fromNick: myNick
            }
          }
        })
      )
    })
    saveShareAccountsToServer(channelId, accounts)
  }
}

// 分享会议到team
export const shareMeetingToTeam = teamId => {
  return (dispatch, getState) => {
    const { channelName, channelId, meetingSubject, myAccount, myNick } = getState()
    const account = parseAccount(teamId, 'team')
    shareManager.addItem(channelName, account)
    store.dispatch(
      sendMsg({
        type: MSG_TYPE.CUSTOM,
        scene: 'team',
        to: teamId,
        pushContent: '[视频会议]',
        content: {
          type: 1004,
          data: {
            channelId,
            teamId,
            channelName,
            meetingSubject,
            duration: Date.now(),
            from: myAccount,
            fromNick: myNick,
            scene: 'team'
          }
        }
      })
    )
    saveShareAccountsToServer(channelId, [account])
  }
}

// 切换为迷你模式
export function toggleMiniMode() {
  return {
    type: 'toggleMiniMode'
  }
}

export default (state, { type, payload }) => {
  switch (type) {
    case 'setSiderShow':
      return {
        ...state,
        siderShow: payload
      }
    case 'showSetting':
      return {
        ...state,
        settingVisible: payload
      }
    case 'updateNetCall':
      return {
        ...state,
        ...payload
      }
    case 'toggleMiniMode':
      return {
        ...state,
        miniMode: !state.miniMode
      }
    case 'toggleGridMode':
      return {
        ...state,
        gridMode: !state.gridMode
      }
    default:
      return state
  }
}
