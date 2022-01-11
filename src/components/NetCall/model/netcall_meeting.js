// import platform from 'platform'
import { Modal } from 'antd'
import imUtils from '@/utils/im'
import { dispatchCustomEvent } from '@/utils/utils'
import { sendNetCallCustomMsg, sendTipMsg } from '@/models/im/msgs'
import { store } from '@/index'
import {
  createMeetingRoom,
  endMeetingRoom,
  // transferCaller,
  meetingManagerControl,
  meetingControlMulti
} from '@/services/netcall'
import durationManager from '../hooks/DurationManager'
import shareManager from '../hooks/ShareManager'
import { updateNetCall, shareMeetingToTeam, shareMeeting } from './index'
import config from '../config'

function NetcallMeeting() {}

const fn = NetcallMeeting.prototype

function sortMembersUtil(members, caller) {
  members = members.sort((a, b) => {
    const aValue = a.joined ? 1 : -1
    const bValue = b.joined ? 1 : -1
    return bValue - aValue
  })
  let callerInfo = []
  for (let i = 0; i < members.length; i++) {
    if (members[i].account === caller) {
      callerInfo = members.splice(i, 1)
      break
    }
  }
  return callerInfo.concat(members)
}

/**
 * 开始视频会议
 * @param [meetingName] {string} 会议主题, 如果缺省，则取当前群名称
 */
fn.startMeetingCall = function (meetingName) {
  const {
    user: { myInfo },
    session: { currSessionId }
  } = store.getState().im

  const { createChannelWaiting /* , newCreate */ } = this.getState()

  if (createChannelWaiting) return

  const next = () => {
    this.type = WebRTC.NETCALL_TYPE_VIDEO

    const { meetingSubject, teamMembers } = imUtils.getMeetingData(meetingName, currSessionId)

    this.meetingCall.meetingSubject = meetingSubject

    this.dispatch(
      updateNetCall({
        meetingSubject,
        teamMembers,
        members: [
          { account: myInfo.account, nick: myInfo.nick, avatar: myInfo.avatar, joined: true }
        ],
        myAccount: myInfo.account,
        myNick: myInfo.nick,
        currBigViewAccount: myInfo.account,
        createChannelWaiting: true
      })
    )
    this.createChannel()
    // if (!newCreate) {
    //   // 发送群视频tip
    //   this.sendTeamTip(`{${userUID}}发起了视频聊天`, false)
    // }
  }

  this.checkRtcSupport().then(next, () => this.reject())
}

/**
 * 拉人进会议
 * @param member {object | object[]} 被拉入群的用户对象 格式如： { account, nick, avatar }
 */
fn.joinMeeting = function (member) {
  if (this.isInMeeting(member.account)) {
    return
  }

  if (!Array.isArray(member)) {
    member = [member]
  }

  const { newCreate, myAccount } = this.getState()
  const { caller, channelName, meetingSubject } = this.meetingCall

  let teamId = ''
  let teamName = ''

  if (!newCreate) {
    const {
      session: { currSessionId }
    } = store.getState().im
    if (currSessionId) {
      teamId = imUtils.parseSession(currSessionId).to
      teamName = imUtils.getTeamName(currSessionId)
    }
  }

  // 给被邀请者发一条会议消息（方便进入会议）
  member.forEach(item => {
    // 从群外部创建的会议或不在当前群里才发消息
    if (newCreate || !this.isInCurTeam(item.account)) {
      this.dispatch(shareMeeting([`p2p-${item.account}`]))
    }
  })

  // eslint-disable-next-line
  const members = this.getState().members.concat(member)

  this.dispatch(
    updateNetCall({
      members
    })
  )

  // 向members成员发起会议邀请通知
  store.dispatch(
    sendNetCallCustomMsg(
      members.filter(member => member.account !== myAccount),
      {
        type: 2001,
        id: 3,
        caller,
        members,
        target: [member],
        channelName,
        channelId: this.channelId,
        meetingSubject,
        callType: this.type,
        teamId,
        teamName
      }
    )
  )
}

/**
 * 移出会议室
 * @param account {string} 被移出用户的账号
 */
fn.unJoinMeeting = function (account) {
  const { members } = this.getState()
  const member = members.find(member => member.account === account)
  const { channelName } = this.meetingCall

  if (!member) return
  if (member.joined) {
    meetingManagerControl({
      channelName,
      targetAccid: member.account,
      controlId: 4,
      controlData: JSON.stringify({
        type: 2001,
        id: 4,
        channelName,
        channelId: this.channelId
      })
    })

    // store.dispatch(
    //   sendNetCallCustomMsg([{ account }], {
    //     type: 2001,
    //     id: 4,
    //     targetAccount: account,
    //     channelName,
    //     channelId: this.channelId
    //   })
    // )
  } else {
    this.removeFromMeeting(account)
    store.dispatch(
      sendNetCallCustomMsg([{ account }], {
        type: 2001,
        id: 4,
        targetAccount: account,
        channelName,
        channelId: this.channelId
      })
    )
  }
  // 如果被移出的人为当前的大头照，则切回主持人的大头照
  const { currBigViewAccount, caller } = this.getState()
  if (currBigViewAccount === account) {
    this.setLocalStreamBigView(caller)
  }
}

/**
 * 通过房间号主动加入视频会议
 * @param channelName {string} 会议房间号
 */
fn.joinMeetingByChannelName = function (channelName) {
  if (this.isActived()) {
    return this.showTip('您正在通话中，无法进行此操作。', 'info')
  }
  const {
    user: { myInfo }
  } = store.getState().im

  this.type = WebRTC.NETCALL_TYPE_VIDEO
  this.netcall.channelName = channelName
  this.meetingCall.channelName = channelName
  this.beCalling = true

  this.dispatch(
    updateNetCall({
      members: [
        {
          account: myInfo.account,
          nick: myInfo.nick,
          avatar: myInfo.avatar,
          joined: true
        }
      ]
    })
  )

  this.accept()
}

/**
 * 通过房间号加入会议回调，由系统自定义消息触发
 * @param msg
 */
fn.onJoinMeetingByChannelName = function (msg) {
  // 更新通过房间号加入者的相关信息
  if (!this.meetingCall.meetingSubject) {
    const { caller, teamId, meetingSubject, shareDoc, shareDocRedPoint } = msg.content
    this.meetingCall.caller = caller
    this.meetingCall.teamId = teamId
    this.meetingCall.meetingSubject = meetingSubject
    const { callerNick } = this.getBigViewInfo(caller)
    const { members } = this.getState()
    this.dispatch(
      updateNetCall({
        members: sortMembersUtil(members, caller), // 按主持人->接通者->未接通者排序
        caller,
        callerNick,
        meetingSubject,
        shareDoc,
        shareDocRedPoint
      })
    )
  }
}

/**
 * 锁定会议
 * @param locked {boolean} 是否锁定会议
 */
fn.lockMeeting = function (locked) {
  const { members } = this.getState()
  store.dispatch(
    sendNetCallCustomMsg(members, {
      type: 2001,
      id: 9,
      locked,
      channelName: this.meetingCall.channelName,
      channelId: this.channelId
    })
  )
}

/**
 * 会议被锁定或解除锁定
 */
fn.onMeetingLocked = function (msg) {
  // const { myAccount } = this.getState()
  const { caller } = this.meetingCall
  const {
    content: { locked }
  } = msg
  this.dispatch(
    updateNetCall({
      meetingLocked: locked
    })
  )
  if (locked) {
    this.setLocalStreamBigView(caller)
  }
  // else {
  //   this.setLocalStreamBigView(myAccount)
  // }
}

/**
 * 会议结束了
 */
fn.onMeetingEnded = function (obj) {
  const { msg } = obj.content
  const { channelName } = JSON.parse(msg)
  durationManager.stopDuration(channelName)
  shareManager.clear(channelName)
}

/**
 * 被移出会议室
 * @param msg {object} 由自定义系统消息传递过来的数据
 */
fn.onUnJoinMeeting = function (msg) {
  const { myAccount, members } = this.getState()
  const obj = msg.content
  const newMembers = members.filter(member => member.account !== obj.targetAccount)

  // 自己把自己移出了会议室
  if (msg.from === myAccount && obj.targetAccount === myAccount) {
    this.leaveChannel()
    this.showTip('你被主持人移出了会议室')
    return
  }

  // 如果被移出者account为当前用户的myAccount，则退出会议室，否则刷新参会人列表
  if (obj.targetAccount === myAccount) {
    if (this.calling) {
      this.leaveChannel()
    } else {
      this.hangup()
    }
    this.showTip('你被主持人移出了会议室')
  } else {
    this.dispatch(
      updateNetCall({
        members: newMembers
      })
    )
  }
}

/**
 * 显示视频会议UI
 */
fn.showMeetingUI = function () {
  const {
    user: { myInfo }
  } = store.getState().im
  const { caller, channelName, meetingSubject } = this.meetingCall
  this.dispatch(
    updateNetCall({
      visible: true,
      type: 'video',
      status: 'meeting',
      myAccount: myInfo.account,
      myNick: myInfo.nick,
      caller,
      channelName,
      meetingSubject,
      createChannelWaiting: false,
      canDesktopShare: this.isRtcSupported /* && platform.name === 'Firefox' */
    })
  )

  // 要拿真实dom,加点延迟
  setTimeout(() => {
    this.initMeetingCall()
    this.joinChannel()
  })
}

/**
 * 设置禁言或解除禁言
 * @param account {string} 被禁言人账号
 * @param disabled {boolean} 是否禁言
 */
fn.disableSpeak = function (account, disabled) {
  if (disabled) {
    this.netcall.setAudioBlack(account)
  } else {
    this.netcall.setAudioStart(account)
  }
}

/**
 * 全体禁言或解除禁言
 * @param disabled {boolean} 是否禁言
 */
fn.disableSpeakAll = function (disabled) {
  const { members } = this.getState()
  // members.forEach(member => {
  //   this.disableSpeak(member.account, disabled)
  // })

  const memberIdList = members.map(item => item.account)
  meetingControlMulti({
    channelName: this.meetingCall.channelName,
    targetAccid: memberIdList,
    controlId: disabled ? 19 : 20,
    controlData: ''
  })

  this.dispatch(
    updateNetCall({
      meetingMuted: disabled
    })
  )
}

/**
 * 接收主持人全员静音状态
 * @param disabled {boolean} 是否全员静音true为静音false为开启
 */
fn.disableMeetingMuted = function (disabled) {
  const { meetingMuted } = this.getState()

  if (meetingMuted === disabled) return

  this.setDeviceAudioIn(!disabled)
  this.dispatch(
    updateNetCall({
      meetingMuted: disabled
    })
  )
}

/** 初始化多人音视频绑定事件 */
fn.initMeetingCall = function () {
  this.meetingCall.$box = this.meetingCall.$box || this.getNode('netcall-meeting-box')
}

/**
 * 多人音视频过程的控制处理
 * @param {object} obj 传递过来的控制对象属性
 */
fn.onMeetingControl = function (obj) {
  const { account, type } = obj

  if (!this.joinedMembers[account]) {
    return
  }

  switch (type) {
    // 通知对方自己打开了音频
    case WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_ON:
      console.log('对方打开了麦克风')
      this.setMicrophoneStatus(obj.account, true)
      break
    // 通知对方自己关闭了音频
    case WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_OFF:
      console.log('对方关闭了麦克风')
      this.setMicrophoneStatus(obj.account, false)
      break
    // 通知对方自己打开了视频
    case WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_ON:
      console.log('对方打开了摄像头')
      this.netcall.setVideoShow(obj.account)
      this.setLoadingStatus(obj.account, '')
      this.setCameraStatus(obj.account, true)
      break
    // 通知对方自己关闭了视频
    case WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_OFF:
      console.log('对方关闭了摄像头')
      this.netcall.setVideoBlack(obj.account)
      this.setLoadingStatus(obj.account, '对方关闭了摄像头')
      this.setCameraStatus(obj.account, false)
      if (this.getState().gridMode) {
        dispatchCustomEvent('onCameraControl', { account: obj.account, msg: '对方关闭了摄像头' })
      }
      break
    // 拒绝从音频切换到视频
    case WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO_REJECT:
      console.log('对方拒绝从音频切换到视频通话')
      break
    // 请求从音频切换到视频
    case WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO:
      console.log('对方请求从音频切换到视频通话')
      break
    // 同意从音频切换到视频
    case WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO_AGREE:
      console.log('对方同意从音频切换到视频通话')
      break
    // 从视频切换到音频
    case WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_VIDEO_TO_AUDIO:
      console.log('对方请求从视频切换为音频')
      break
    // 占线
    case WebRTC.NETCALL_CONTROL_COMMAND_BUSY:
      console.log('对方正在通话中')
      this.setLoadingStatus(obj.account, '对方正在通话中')
      break
    // 对方摄像头不可用
    case WebRTC.NETCALL_CONTROL_COMMAND_SELF_CAMERA_INVALID:
      console.log('对方摄像头不可用')
      this.setLoadingStatus(obj.account, '对方摄像头不可用')
      this.setCameraStatus(obj.account, false)
      this.netcall.setVideoBlack(obj.account)
      break
    // NETCALL_CONTROL_COMMAND_SELF_ON_BACKGROUND 自己处于后台
    // NETCALL_CONTROL_COMMAND_START_NOTIFY_RECEIVED 告诉发送方自己已经收到请求了（用于通知发送方开始播放提示音）
    // NETCALL_CONTROL_COMMAND_NOTIFY_RECORD_START 通知对方自己开始录制视频了
    // NETCALL_CONTROL_COMMAND_NOTIFY_RECORD_STOP 通知对方自己结束录制视频了
    default:
  }
}

/**
 * 更新音量状态显示
 * @param {object} obj 当前在房间的群成员的音量表 eg: {id1:{status:1000}}
 */
fn.updateVolumeBar = function (obj) {
  if (!this.meetingCall.channelName) return
  const { meetingCall } = this
  if (this.meetingCall.volumeStatus) {
    meetingCall.volumeStatus = obj
    return
  }

  const that = this
  const { myAccount } = this.getState()

  meetingCall.volumeStatus = obj
  meetingCall.volumeStatusTimer = requestAnimationFrame(refresh)

  function refresh() {
    // 先全部清空
    const volumes = meetingCall.$box.querySelectorAll('.volume-show')
    volumes.forEach(el => {
      el.style.width = '0%'
    })

    let id
    let val
    let percent
    let log10
    const tmp = meetingCall.volumeStatus

    // eslint-disable-next-line
    for (const i in tmp) {
      id = i === 'self' ? myAccount : i
      val = tmp[i].status

      // WebRTC模式
      if (that.isRtcSupported) {
        percent = val * 100
      } else {
        // webnet模式
        log10 = Math.log(val / 65535.0) / Math.LN10
        percent = val === 0 ? 0 : 20.0 * log10 + 96
      }

      const target = this.findAccountNode(id).querySelector('.volume-show')
      target.style.width = `${percent}%`
    }
    requestAnimationFrame(refresh)
  }
}

/** 更新禁言可用状态 */
fn.updateBanStatus = function () {
  // this.dispatch(
  //   updateNetCall({
  //     banDisabled: Object.keys(this.joinedMembers).length === 0
  //   })
  // )
}

/** 清除更新音量的timer */
fn.clearVolumeStatusTimer = function () {
  const timer = this.meetingCall.volumeStatusTimer
  if (timer) {
    window.cancelAnimationFrame(timer)
    this.meetingCall.volumeStatusTimer = null
  }
}

/**
 * 呼叫等待计时器
 * 60s呼叫倒计时，到点将所有未接入的用户设置为未连接
 * @param {string} type 倒计时类型
 *  - beCalling: 被呼叫中
 *  - calling: 进入房间通话中
 */
fn.waitingCallTimer = function (type) {
  type = type || 'beCalling'
  this.clearWaitingCallTimer()
  this.meetingCall.waitingTimer = setTimeout(() => {
    if (!this.meetingCall.channelName) return
    if (type === 'beCalling') {
      this.reject()
      this.showTip('会议视频呼叫无应答，自动挂断退出', 'info')
      return
    }
    const { $box } = this.meetingCall
    if ($box) {
      $box.querySelectorAll('.meeting-loading .meeting-tip').forEach(el => {
        el.innerHTML = '未接通'
      })
    }

    this.clearRingPlay()

    const { myAccount } = this.getState()
    // 如果是主叫，判断房间里是否还是没人加进来，如果是，自动挂断退出
    if (this.meetingCall.caller === myAccount && !this.meetingCall.ready) {
      this.leaveChannel()
      this.showTip('未接通')
    }
  }, config.callingTimeout)
}

/**
 * 清除呼叫等待计时器
 */
fn.clearWaitingCallTimer = function () {
  const timer = this.meetingCall.waitingTimer
  if (timer) {
    clearTimeout(timer)
    this.meetingCall.waitingTimer = null
  }
}

/** 根据帐号找到对应的节点，播放音视频
 * @param {string} account 唯一id帐号uid
 */
fn.findAccountNode = function (account) {
  const { $box } = this.meetingCall
  if ($box) {
    return $box.querySelector(`[data-account='${account}']`)
  }
}

/** 画面加载状态变化提示
 * @param {string} account 唯一id帐号uid
 * @param {string} message 加载状态的消息
 */
fn.setLoadingStatus = function (account, message = '') {
  const node = this.findAccountNode(account)
  if (node) {
    node.classList.remove('meeting-loading')
    node.querySelector('.meeting-tip').innerHTML = message
  }
}

/** 风格械下画面加载状态变化提示
 * @param {string} account 唯一id帐号uid
 * @param {string} message 加载状态的消息
 */
fn.setGridViewLoadingStatus = function (account, message = '') {
  const node = this.getNode(`meetingTip-${account}`)
  if (node) {
    node.innerHTML = message
  }
}

/** 摄像头状态切换的节点变化
 * @param {string} account 唯一id帐号uid
 * @param {boolean} isEnable 摄像头是否开启
 */
fn.setCameraStatus = function (account, isEnable = false) {
  // if (!isEnable) {
  //   const node = this.findAccountNode(account)
  //   if (node) {
  //     const canvas = node.querySelector('canvas')
  //     if (canvas) {
  //       canvas.style.display = isEnable ? '' : 'none'
  //     }
  //   }
  // }
  this.dispatch(
    updateNetCall({
      cameraStatus: {
        ...this.getState().cameraStatus,
        [account]: isEnable
      }
    })
  )
}

/**
 * 获取摄像头开启状态
 * @param account
 * @returns {boolean}
 */
fn.getCameraEnabled = function (account) {
  const { cameraStatus } = this.getState()
  return !!cameraStatus[account]
}

/** 麦克风状态切换的节点变化
 * @param {string} account 唯一id帐号uid
 * @param {boolean} isEnable 摄像头是否开启
 */
fn.setMicrophoneStatus = function (account, isEnable = false) {
  this.dispatch(
    updateNetCall({
      microphoneStatus: {
        ...this.getState().microphoneStatus,
        [account]: isEnable
      }
    })
  )
}

/**
 * 发送群视频提示消息
 * @param message {string} 消息文本内容
 * @param isLocal {boolean} 是否为本地消息，如果为true只有自己能收到该消息
 */
fn.sendTeamTip = function (message, isLocal) {
  const {
    session: { currSessionId }
  } = store.getState().im

  const { scene, to } = imUtils.parseSession(currSessionId)

  if (scene === 'team') {
    store.dispatch(
      sendTipMsg({
        scene,
        to,
        message: imUtils.getTeamMsgTip(to, message),
        isLocal
      })
    )
  }
}

/**
 * 主持人退出会议时，通知其它人退出会议
 */
fn.notifyLeaveChannel = function () {
  const { myAccount, members } = this.getState()
  const { caller, channelName } = this.meetingCall

  // 如果当前用户为主持人，则向其它用户发出通知
  if (caller === myAccount) {
    const notifyMembers = members.filter(member => member.account !== caller)
    store.dispatch(
      sendNetCallCustomMsg(notifyMembers, {
        type: 2001,
        id: 7,
        channelName,
        channelId: this.channelId
      })
    )
  }
}

/**
 * 设置某参会人为主持人
 * @param account {string} 被设置人的账号
 */
fn.setAsMeetingCaller = function (account) {
  const { channelName } = this.meetingCall
  // transferCaller({
  //   channelName,
  //   imAccid: account
  // })
  meetingManagerControl({
    channelName,
    targetAccid: account,
    controlId: 21,
    controlData: JSON.stringify({
      type: 2001,
      id: 21,
      channelName,
      channelId: this.channelId
    })
  })
}

/**
 * 控制参与者摄像头开关（主持人功能）
 * @param account {string} 被控制人的账号
 * @param deviceType {number} 设置类型 1: 摄像头，2：麦克风
 *
 * ↓new
 * @param id {number} 设置类型
 * 15 :主持人关闭指定人员摄像头
 * 16:主持人开启指定人员摄像头
 * 17:主持人关闭指定人员麦克风
 * 18:主持人开启指定人员麦克风
 */
fn.controlMemberDevice = function (account, deviceType, id) {
  // const members = [{ account }]
  const { channelName } = this.meetingCall
  meetingManagerControl({
    channelName,
    targetAccid: account,
    controlId: id,
    controlData: JSON.stringify({
      type: 2001,
      id,
      deviceType,
      channelName,
      channelId: this.channelId
    })
  })

  // store.dispatch(
  //   sendNetCallCustomMsg(members, {
  //     type: 2001,
  //     id: 12,
  //     deviceType,
  //     channelName: this.meetingCall.channelName,
  //     channelId: this.channelId
  //   })
  // )
}

/**
 * 设备被主持人控制
 * @param msg
 */
fn.onDeviceControled = function (msg) {
  const {
    content: { id }
  } = msg

  if (!this.isActived()) return

  if (id === 15) {
    this.switchCamera(false)
  } else if (id === 16) {
    this.switchCamera(true)
  }

  if (id === 17) {
    this.switchAudioIn(false)
  } else if (id === 18) {
    this.switchAudioIn(true)
  }
}

/**
 * 参会人被设置为主持人的自定认消息回调
 */
fn.onSetMeetingCaller = function (msg) {
  const { myAccount } = this.getState()
  const { caller, callerNick } = msg.content
  this.meetingCall.caller = caller
  this.dispatch(
    updateNetCall({
      caller,
      callerNick
    })
  )
  if (caller === myAccount) {
    this.showTip('你被设置为了主持人', 'info')
  }
}

/**
 * 当主持人退出会议
 */
fn.onCallerLeaveChannel = function () {
  if (this.isActived()) {
    this.leaveChannel()
    this.showTip('主持人结束了会议', 'info')
  }
}

/**
 * 当主持人退出时，接受新的主持人
 * @param msg
 */
fn.onAssignMeetingCaller = function (msg) {
  const { myAccount, caller } = this.getState()
  const { caller: newCaller, callerNick } = msg.content

  if (!this.netcallActive || (caller && caller === newCaller)) return

  this.meetingCall.caller = newCaller
  this.dispatch(
    updateNetCall({
      caller: newCaller,
      callerNick
    })
  )
  if (myAccount === newCaller) {
    this.showTip('你被分配为主持人了', 'info')
  }
}

/**
 * 接收被转移主持人
 * @param msg
 */
fn.onAssignMeetingAccount = function (msg) {
  const { myAccount, caller } = this.getState()
  const { targetAccount, targetName } = msg.content

  if (caller && caller === targetAccount) return

  this.meetingCall.caller = targetAccount
  this.dispatch(
    updateNetCall({
      caller: targetAccount,
      callerNick: targetName
    })
  )
  if (myAccount === targetAccount) {
    this.showTip('你被分配为主持人了', 'info')
  }
}

/**
 * 判断某人是否在房间内
 * @param account
 * @returns {boolean}
 */
fn.isInMeeting = function (account) {
  return !!this.getState().members.find(member => member.account === account)
}

/**
 * 判断某人是否在当前会议所在的群里
 * @param account
 * @returns {boolean}
 */
fn.isInCurTeam = function (account) {
  return !!this.getState().teamMembers.find(member => member.account === account)
}

/**
 * 向自己广播已加入会议事件，用于置灰消息列表中的加入按钮
 * @param joined 是否已加入会议
 */
fn.emitMeetingJoined = function (joined) {
  const { channelName } = this.meetingCall
  dispatchCustomEvent('netcall:meetingJoined', { channelName, joined })
}

/**
 * 开关根据参会者音量画面自动切换
 */
fn.switchAutoExchange = function () {
  this.dispatch(
    updateNetCall({
      autoExchange: !this.getState().autoExchange
    })
  )
}

/** 创建房间 */
fn.createChannel = function () {
  const {
    user: { userUID }
  } = store.getState().im

  const { meetingSubject } = this.meetingCall

  this.meetingCall.caller = userUID

  createMeetingRoom({
    theme: meetingSubject
  })
    .then(res => {
      console.log('createChannel', res)
      this.netcall.channelName = res.channelName
      this.meetingCall.channelName = res.channelName
      this.joinedMembers = {}
      this.showMeetingUI()
    })
    .catch(err => {
      console.log('createChannel error', err)
      this.hideAllNetCallUI()
      this.resetWhenHangup()
      this.sendTeamTip(`{${userUID}}发起视频通话失败`, true)
    })
}

/** 主动加入房间
 * 默认参数pushConfig
 * @param {boolean} isReConnect 是否是断网重连
 */
fn.joinChannel = function (isReConnect) {
  const {
    session: { currSessionId },
    user: { userUID }
  } = store.getState().im

  const that = this

  // 默认视频宽高
  this.videoCaptureSize = { ...this.defaultVideoCaptureSize.small }

  this.netcall
    .joinChannel({
      channelName: this.netcall.channelName,
      type: this.type,
      custom: this.netcall.channelCustom || '',
      sessionConfig: this.sessionConfig
    })
    .then(
      obj => {
        console.log('joinChannel', obj)
        this.channelId = obj.channelId
        // 设置自己在通话中
        this.calling = true
        this.netcallActive = true

        this.dispatch(
          updateNetCall({
            type: 'video',
            callWaiting: true,
            channelId: this.channelId,
            nick: '',
            tip: this.meetingCall.caller === userUID ? '等待接听...' : '接听中...'
          })
        )

        function next() {
          // 断网重连不再做其他设置
          if (isReConnect) return

          that.netcallAccount = that.meetingCall.teamId

          that.dispatch(
            updateNetCall({
              callWaiting: false
            })
          )

          // 通话时长显示
          that.startDurationTimer()

          // 如果是视频发起者，需要发送呼叫声音，tip和点对点通知
          if (that.meetingCall.caller === userUID) {
            const { scene, to } = imUtils.parseSession(currSessionId)
            const { newCreate } = that.getState()
            if (!newCreate && scene === 'team') {
              // 分享视频会议
              that.dispatch(shareMeetingToTeam(to))
            }
          }
          that.emitMeetingJoined(true)
        }

        // WebRTC模式
        if (this.isRtcSupported) {
          const { microphoneDisabled, cameraDisabled } = this.getState()
          // 设置为互动者
          this.netcall.changeRoleToPlayer()
          Promise.resolve()
            .then(() => {
              console.log('开始webrtc连接')
              return this.netcall.startRtc()
            })
            .then(() => {
              if (microphoneDisabled) {
                // 不开启麦克风
                return Promise.resolve()
              }
              return this.setDeviceAudioIn(true)
            })
            .then(() => {
              // this.startLocalStreamMeeting()
              // this.setVideoViewSize()
              this.setCaptureVolume(this.captureVolume)
            })
            .then(() => {
              if (cameraDisabled) {
                // 不开启摄像头
                this.updateDeviceStatus(WebRTC.DEVICE_TYPE_VIDEO, false, true)
                this.setLocalStreamBigView(userUID)
                return Promise.resolve()
              }
              if (obj.type === WebRTC.NETCALL_TYPE_VIDEO) {
                return this.setDeviceVideoIn(true)
              }
              return this.setDeviceVideoIn(false)
            })
            .then(() => {
              console.log('webrtc连接成功')
              next()
              return this.setDeviceAudioOut(true)
            })
            .catch(e => {
              console.error('连接出错', e)
              if (/webrtc兼容开关/i.test(e)) {
                Modal.error({
                  title: '提示信息',
                  content: '无法加入房间!请让呼叫方打开"WebRTC兼容开关"，方可正常通话',
                  okText: ' 知道了，挂断',
                  maskClosable: false,
                  zIndex: 1205,
                  onOk: () => this.leaveChannel()
                })
              } else {
                this.showTip('音视频服务连接出错')
                this.hideAllNetCallUI()
                this.resetWhenHangup()
              }
            })
        }
      },
      err => {
        this.hideAllNetCallUI()
        this.resetWhenHangup()
        console.error('joinChannel error', err)

        // 断网重连失败处理
        if (isReConnect) {
          this.showTip('重新加入视频通话失败')
          return
        }

        if (err) {
          this.showTip(err.reason ? err.reason : err.desc || '视频通话错误')
        }
      }
    )
}

/**
 * 主动离开房间
 * @param isEnd {boolean} 是否结束会议
 * @param isHotDev {boolean} 是否是热更新开发模式
 */
fn.leaveChannel = function (isEnd, isHotDev) {
  if (!this.isActived()) {
    return Promise.resolve()
  }

  const { caller, myAccount } = this.getState()
  const { channelName } = this.netcall

  return this.netcall
    .leaveChannel()
    .then(() => {
      if (isEnd && caller && caller === myAccount && channelName) {
        this.notifyLeaveChannel()
        endMeetingRoom({ channelName }, true)
      }
    })
    .catch(() => {
      // console.error('leaveChannel error:', err)
    })
    .finally(() => {
      this.emitMeetingJoined(false)
      if (!isHotDev) {
        this.hideAllNetCallUI()
      }
      this.resetWhenHangup()
    })
}

/**
 * 有用户加入频道的通知
 * @param obj {object} 加入者对象
 */
fn.onUserJoinChannel = function (obj) {
  if (this[`unJoinTimer_${obj.account}`]) {
    clearTimeout(this[`unJoinTimer_${obj.account}`])
    delete this[`unJoinTimer_${obj.account}`]
  }

  if (!this.joinedMembers[obj.account]) {
    this.updateMeetingWhenUserJoined(obj)
  }

  // 将加入者加入自己的列表里
  this.joinedMembers[obj.account] = 1
  // 是否已经有人进来的标志，给倒计时使用
  this.meetingCall.ready = true

  // 刷新禁言状态
  this.updateBanStatus()
  // 播放提示音
  this.playRingWhenUserJoinOrLeave()
}

/**
 * 有第三方加入房间
 * @param obj {object} 加入者对象
 */
fn.onJoinChannel = function (obj) {
  console.log('onJoinChannel', obj)
  const { volumeNoDevice, volumeDisabled } = this.getState()
  if (!volumeNoDevice && !volumeDisabled) {
    this.startDeviceAudioOutChat()
  }
  this.startRemoteStreamMeeting(obj)
  this.setCaptureVolume(this.captureVolume)
  // this.setVideoViewSize()
  this.setVideoViewRemoteSize()
  // this.updateVideoShowSize(true, false)
  this.setVideoScale()
}

/**
 * 有第三方离开房间
 * @param obj {object} 离开者对象
 */
fn.onLeaveChannel = function (obj) {
  const { gridMode, myAccount, caller } = this.getState()
  delete this.joinedMembers[obj.account]
  this.setLoadingStatus(obj.account, '已挂断')
  if (gridMode) {
    this.setGridViewLoadingStatus(obj.account, '已挂断')
  }
  this.stopRemoteStreamMeeting(obj.account)
  this.updateMemberJoinedStatus(obj.account)
  // 刷新禁言状态
  this.updateBanStatus()
  // 会议结束了，检测到自己退出了，关闭会议界面
  if (obj.account === myAccount) {
    this.hideAllNetCallUI()
    this.resetWhenHangup()
  }
  // 退出者如果是主持人，清除主持人信息
  if (obj.account === caller) {
    this.dispatch(
      updateNetCall({
        caller: null,
        callerNick: ''
      })
    )
  }
  // 播放提示音
  this.playRingWhenUserJoinOrLeave()
  ;(account => {
    this[`unJoinTimer_${account}`] = setTimeout(() => {
      this.removeFromMeeting(account)
      delete this[`unJoinTimer_${account}`]
    }, config.leaveHoldTime)
  })(obj.account)
}

/**
 * 更新会议加入状态
 * @param account {string} 退出者的账号
 */
fn.updateMemberJoinedStatus = function (account) {
  // eslint-disable-next-line
  let { members, teamMembers, currBigViewAccount, caller, myAccount } = this.getState()
  members = members.map(member => {
    if (member.account === account) {
      return { ...member, joined: false }
    }
    return member
  })
  teamMembers = teamMembers.map(member => {
    if (member.account === account) {
      return { ...member, joined: false }
    }
    return member
  })
  this.dispatch(
    updateNetCall({
      members,
      teamMembers
    })
  )
  // 如果退出者为当前的大头照，若退出者不为主持人则切回主持人的大头照，否则切回自己
  if (currBigViewAccount === account) {
    if (account !== caller) {
      this.setLocalStreamBigView(caller)
    } else {
      this.setLocalStreamBigView(myAccount)
    }
  }
}

/**
 * 从本地移出会议室
 * @param account {string} 被移出人的账号
 */
fn.removeFromMeeting = function (account) {
  const { members } = this.getState()
  this.dispatch(
    updateNetCall({
      members: members.filter(member => member.account !== account)
    })
  )
}

/** 清除有人挂断自动移出会议的timer */
fn.clearUnJoinTimer = function () {
  if (this.unJoinTimer) {
    clearTimeout(this.unJoinTimer)
    this.unJoinTimer = null
  }
}

/**
 * 更新新加入者的昵称和头像
 * @param account {string} 加入者账号
 */
fn.updateMemberInfo = function (account) {
  imUtils.getUserByIdAsync(account).then(user => {
    let { members } = this.getState()
    members = members.map(member => {
      if (member.account === account) {
        return { ...member, nick: user.nick, avatar: user.avatar }
      }
      return member
    })
    this.dispatch(
      updateNetCall({
        members
      })
    )
  })
}

/**
 * 通过房间号加入时，更新参会人列表，并向加入者发送会议信息，如“会议主题、主持人accid”等。
 */
fn.updateMeetingWhenUserJoined = function (obj) {
  const {
    user: { userUID },
    session: { currSessionId }
  } = store.getState().im

  const { members, teamMembers, cameraDisabled, microphoneDisabled, shareDoc } = this.getState()
  const isInMeeting = members.some(member => member.account === obj.account)

  let tmpTeamMembers = []
  if (currSessionId) {
    if (!teamMembers.length) {
      const { members } = imUtils.getTeamInfoAndMembers(currSessionId)
      tmpTeamMembers = members
    } else {
      tmpTeamMembers = teamMembers
    }
  }

  tmpTeamMembers = tmpTeamMembers.map(member => {
    if (member.account === obj.account) {
      return { ...member, joined: true }
    }
    return member
  })

  const { caller, channelName, meetingSubject } = this.meetingCall

  const target = {
    account: obj.account,
    nick: '',
    avatar: '',
    joined: true
  }

  // 通过房间号加入的用户
  if (!isInMeeting) {
    this.dispatch(
      updateNetCall({
        members: members.concat([target]),
        teamMembers: tmpTeamMembers
      })
    )
    // 更新新加入者的昵称和头像
    this.updateMemberInfo(obj.account)
  } else {
    const rebuildMembers = members.map(member =>
      member.account === obj.account ? { ...member, joined: true } : member
    )
    this.dispatch(
      updateNetCall({
        teamMembers: tmpTeamMembers,
        members: sortMembersUtil(rebuildMembers, caller)
      })
    )
  }

  // 发起者同步更新通过房间号加入者的会议信息
  if (caller === userUID) {
    store.dispatch(
      sendNetCallCustomMsg([target], {
        type: 2001,
        id: 5,
        teamId: currSessionId,
        caller,
        meetingSubject,
        channelName,
        channelId: this.channelId,
        shareDoc: {
          sharing: shareDoc.sharing,
          fileId: shareDoc.fileId,
          isTeacher: false,
          fileName: shareDoc.fileName,
          inviter: shareDoc.inviter
        },
        shareDocRedPoint: shareDoc.sharing
      })
    )
  }

  // 如果在发起界面关闭了摄像头，则向其它人发起通知
  if (cameraDisabled) {
    // 通知对方自己关闭了摄像头
    this.netcall.control({
      command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_OFF
    })
  }

  // 如果在发起界面关闭了麦克风，则向其它人发起通知
  if (microphoneDisabled) {
    // 通知对方自己关闭了麦克风
    this.netcall.control({
      command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_OFF
    })
  }
}

/** 音视频通信状态重置 */
fn.resetWhenHangup = function () {
  // 关闭呼叫响铃
  this.clearRingPlay()
  this.clearDurationTimer()
  this.clearCallTimer()
  this.clearBeCallTimer()
  this.clearWaitingCallTimer()
  this.clearVolumeStatusTimer()
  this.clearUnJoinTimer()
  this.clearOnJoinChannelTimer()

  if (this.meetingCall.channelName) {
    this.stopCallingVideoPreview()
  }

  if (this.netcall && this.netcall.stopSignal) {
    this.netcall.stopSignal()
  }

  // if (this.meetingCall.channelName) {
  //   this.stopLocalStreamMeeting()
  //   this.stopRemoteStreamMeeting()
  // } else {
  //   this.stopLocalStream()
  //   this.stopRemoteStream()
  // }
  // this.stopLocalStreamMeeting()
  // this.stopRemoteStreamMeeting()
  // this.stopDeviceAudioIn()
  // this.stopDeviceAudioOutLocal()
  // this.stopDeviceAudioOutChat()
  // this.stopDeviceVideo()

  if (this.netcall) {
    this.netcall.channelName = null
  }
  this.channelId = null
  this.signalInited = false
  this.calling = false
  this.beCalling = false
  this.beCalledInfo = null
  this.netcallActive = false
  // this.netcallAccount = ''
  this.isFullScreen = false
  this.isAbsFullScreen = false
  this.videoType = null
  this.videoCallModal = null
  this.requestSwitchToVideoWaiting = false
  this.meetingCall = {}
  this.joinedMembers = {}
}

/** 收到群视频呼叫
 * 1. 首先判断呼叫team是否是自己所属team
 * 2. 判断当前是否在视频会话中
 * 3. 判断当前会话窗口是否是呼叫群窗口
 * @param msg {object} 由自定义系统消息传递过来的数据
 */
fn.onMeetingCalling = function (msg) {
  // 正在通话中
  // if (this.isActived()) {
  //   // this.netcall.control({
  //   //   command: WebRTC.NETCALL_CONTROL_COMMAND_BUSY
  //   // })
  //   return
  // }

  const {
    user: { userUID }
    // session: { currSessionId }
  } = store.getState().im

  // 如果收到的消息是自己发的，忽略
  if (msg.from === userUID) return

  console.log('收到群视频呼叫', msg)

  // 判断是否在所属team中
  // const isInTeam = !!imUtils.getTeamInfo(obj.to)
  //
  // if (!isInTeam) return

  // const { to, scene } = imUtils.parseSession(currSessionId)
  const obj = msg.content

  // 默认是视频呼叫
  const type = obj.callType || 2

  // 非呼叫群窗口, 切换到该窗口
  // if (!to || scene === 'p2p' || to !== obj.to) {
  //   this.openChat(`team-${obj.to}`)
  // }

  // 发起呼叫窗口
  this.meetingCall = {
    ...this.meetingCall,
    caller: obj.caller,
    channelName: obj.channelName,
    meetingSubject: obj.meetingSubject
  }

  this.type = type
  this.netcall.channelName = obj.channelName
  this.netcallAccount = this.meetingCall.teamId

  // 把本人排到第一位
  // const sortMembers = members => {
  //   for (let i = 0; i < members.length; i++) {
  //     if (members[i].account === userUID) {
  //       const myInfo = members.splice(i, 1).map(item => ({ ...item, joined: true }))
  //       return myInfo.concat(members)
  //     }
  //   }
  // }

  // 按主持人->接通者 -> 未接通者排序
  const sortMembers = members => {
    members = members.map(member => {
      if (member.account === userUID) {
        return { ...member, joined: true }
      }
      return member
    })
    return sortMembersUtil(members, obj.caller)
  }

  // let teamMembers = []
  //
  // if (currSessionId) {
  //   const { members } = imUtils.getTeamInfoAndMembers(currSessionId)
  //   teamMembers = members
  // }

  this.dispatch(
    updateNetCall({
      members: sortMembers(obj.members),
      caller: obj.caller
      // currBigViewAccount: obj.caller
      // teamMembers
    })
  )

  // 中途加人
  if (this.isActived()) {
    return
  }

  // this.dispatch(
  //   updateNetCall({
  //     visible: true,
  //     status: 'calling',
  //     nick: this.meetingCall.teamName,
  //     tip: '待接听...',
  //     type:
  //       this.type === WebRTC.NETCALL_TYPE_AUDIO
  //         ? 'audio'
  //         : this.type === WebRTC.NETCALL_TYPE_VIDEO
  //         ? 'video'
  //         : ''
  //   })
  // )

  this.onBeCalling(msg)
  // 开启被叫倒计时
  this.waitingCallTimer('beCalling')
}

/**
 * 会议被邀请时，通知对方我方正忙（会议）
 * @param msg
 */
fn.setBusyInMeeting = function (msg) {
  const members = [{ account: msg.from }]
  store.dispatch(
    sendNetCallCustomMsg(members, {
      type: 2001,
      id: 13,
      account: msg.to
      // channelName: this.meetingCall.channelName,
      // channelId: this.channelId
    })
  )
}

/**
 * 会议邀请别人正忙时，通知我方（会议）
 * @param msg
 */
fn.onBusyInMeeting = function (msg) {
  const {
    content: { account }
  } = msg
  this.showTip('对方正忙，请稍候再试！', 'warn')
  this.unJoinMeeting(account)
}

/**
 * 多端接听或拒绝同步
 * @param msg
 * @param isForce 是否强制关闭
 */
fn.onSelfAcceptOrReject = function (msg, isForce) {
  if (isForce && this.isActived()) {
    this.hideAllNetCallUI()
    this.resetWhenHangup()
    this.showTip('已在其它端处理', 'info')
    return
  }
  const { fromClient } = msg.content
  const isDiffrentPcClient =
    process.env.REACT_APP_ENV === 'electron' ? fromClient === 'web' : fromClient === 'electron'
  if (
    this.isActived() &&
    (fromClient === 'ios' || fromClient === 'android' || isDiffrentPcClient)
  ) {
    this.hideAllNetCallUI()
    this.resetWhenHangup()
    this.showTip('已在其它端处理', 'info')
  }
}

/** 群视频离线信息列表 */
fn.offlineMeetingCall = function (messages) {
  messages = messages || []
  const now = Date.now()
  for (let i = 0; i < messages.length; i++) {
    const item = messages[i]
    if (now - item.time < 45 * 1000) {
      this.onMeetingCalling(item)
    }
  }
}

/** 主动同意通话 */
fn.meetingCallAccept = function () {
  const {
    user: { userUID }
  } = store.getState().im

  this.netcall.channelName = this.meetingCall.channelName

  // 停止呼叫音乐
  this.clearRingPlay()
  this.showMeetingUI()

  // 给自己发一条系统消息，告诉其它终端本端已接听或已拒绝
  store.dispatch(
    sendNetCallCustomMsg([{ account: userUID }], {
      type: 2001,
      id: 14,
      actionType: 'accept',
      fromClient: process.env.REACT_APP_ENV === 'electron' ? 'electron' : 'web',
      channelName: this.meetingCall.channelName,
      channelId: this.channelId
    })
  )
}

/** 主动拒绝通话
 * @param {string} rejectType 拒绝类型：正忙 / 不想接
 */
fn.meetingCallReject = function (/* rejectType */) {
  const {
    user: { userUID }
  } = store.getState().im

  this.netcall.control({
    command: WebRTC.NETCALL_CONTROL_COMMAND_BUSY
  })

  const { members } = this.getState()
  store.dispatch(
    sendNetCallCustomMsg(members, {
      type: 2001,
      id: 6,
      account: userUID,
      channelName: this.meetingCall.channelName,
      channelId: this.channelId
    })
  )

  // 给自己发一条系统消息，告诉其它终端本端已接听或已拒绝
  store.dispatch(
    sendNetCallCustomMsg([{ account: userUID }], {
      type: 2001,
      id: 14,
      actionType: 'reject',
      fromClient: process.env.REACT_APP_ENV === 'electron' ? 'electron' : 'web',
      channelName: this.meetingCall.channelName,
      channelId: this.channelId
    })
  )

  this.hideAllNetCallUI()
  this.resetWhenHangup()
}

/**
 * 对方拒绝群视频邀请
 */
fn.onMeetingCallRejected = function (obj) {
  const { content } = obj
  if (content) {
    this.onLeaveChannel(content)
  }
}

/** ================== 音视频相关操作 ================ */
/** 打开自己麦克风 */
fn.startDeviceAudioIn = function () {
  this.netcall
    .startDevice({
      type: WebRTC.DEVICE_TYPE_AUDIO_IN,
      device: { deviceId: this.devices.currentAudioIn }
    })
    .then(() => {
      // 通知对方自己开启了麦克风
      this.netcall.control({
        command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_ON
      })
    })
    .catch(() => {
      console.error('启动麦克风失败')
      this.dispatch(
        updateNetCall({
          microphoneNoDevice: true,
          microphoneDisabled: true,
          microphoneTitle: '麦克风不可用'
        })
      )
    })
}

/** 关闭自己麦克风 */
fn.stopDeviceAudioIn = function () {
  this.netcall.stopDevice(WebRTC.DEVICE_TYPE_AUDIO_IN).then(() => {
    // 通知对方自己关闭了麦克风
    this.netcall.control({
      command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_OFF
    })
  })
}

/** 打开摄像头
 * 默认设置采集大小是全屏状态下的采集大小
 */
fn.startDeviceVideo = function () {
  const defaultWidth = 210
  const defaultHeight = 210
  const {
    user: { userUID }
  } = store.getState().im

  this.netcall
    .startDevice({
      type: WebRTC.DEVICE_TYPE_VIDEO,
      device: { deviceId: this.devices.currentVideo },
      width: defaultWidth,
      height: defaultHeight,
      cut: 1
    })
    .then(() => {
      // 通知对方自己开启了摄像头
      this.netcall.control({
        command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_ON
      })
    })
    .catch(() => {
      // 通知对方自己的摄像头不可用
      this.netcall.control({
        command: WebRTC.NETCALL_CONTROL_COMMAND_SELF_CAMERA_INVALID
      })
      console.log('启动摄像头失败')
      this.setLoadingStatus(userUID, '摄像头不可用')
      this.setCameraStatus(userUID, false)

      this.dispatch(
        updateNetCall({
          cameraNoDevice: true,
          cameraDisabled: true,
          cameraTitle: '摄像头不可用',
          localEmpty: true,
          localMessage: '摄像头不可用'
        })
      )
      // this.updateDeviceStatus(WebRTC.DEVICE_TYPE_VIDEO, true, false)
    })
}

/** 关闭摄像头 */
fn.stopDeviceVideo = function () {
  const {
    user: { userUID }
  } = store.getState().im

  this.netcall.stopDevice({ type: WebRTC.DEVICE_TYPE_VIDEO }).then(() => {
    // 通知对方自己关闭了摄像头
    this.netcall.control({
      command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_OFF
    })
    this.setLoadingStatus(userUID, '摄像头已关闭')
    this.setCameraStatus(userUID, false)
  })
}

fn.getBigViewInfo = function (account) {
  const { members, myAccount } = this.getState()
  const { caller } = this.meetingCall
  let currBigViewNick = ''
  let currBigViewAvatar = ''
  let callerNick = ''
  members.forEach(member => {
    if (member.account === account) {
      currBigViewNick = member.nick
      currBigViewAvatar = member.avatar || member.nick
    }
    if (myAccount === caller) {
      callerNick = '我'
    } else if (member.account === caller) {
      callerNick = member.nick
    }
  })

  return {
    currBigViewNick,
    currBigViewAvatar,
    callerNick
  }
}

/**
 * 获取侧边栏列表某一用户相关节点信息
 * @param account {string} accId
 */
fn.getMemberObjectByAccount = function (account) {
  const node = this.findAccountNode(account)
  const video = node.querySelector('video')
  const tipNode = node.querySelector('.meeting-tip')

  return {
    node,
    videoObject: video ? video.srcObject : null,
    tip: tipNode ? tipNode.textContent : ''
  }
}

/**
 * 大视图视频流显示
 * @param account {string} 用户小视图accId
 * @param closeGridMode {boolean} 是否关闭网格模式
 */
fn.setLocalStreamBigView = function (account, closeGridMode) {
  const playVideos = () => {
    const node = this.findAccountNode(account)
    if (!node) return
    const smallVideo = node.querySelector('video')
    const bigVideo = this.getNode('meeting-video-bigView')
    const miniModeVideo = this.getNode('mini-view-video')

    if (smallVideo) {
      if (bigVideo) {
        bigVideo.srcObject = smallVideo.srcObject
        const playPromise = bigVideo.play()
        if (playPromise) {
          playPromise.catch(() => {})
        }
      }
      if (miniModeVideo) {
        miniModeVideo.srcObject = smallVideo.srcObject
        const playPromise = miniModeVideo.play()
        if (playPromise) {
          playPromise.catch(() => {})
        }
      }
    } else {
      if (bigVideo) {
        bigVideo.pause()
        bigVideo.srcObject = null
      }
      if (miniModeVideo) {
        miniModeVideo.pause()
        miniModeVideo.srcObject = null
      }
    }
  }

  const { gridMode } = this.getState()

  this.dispatch(
    updateNetCall({
      gridMode: closeGridMode ? false : gridMode,
      currBigViewAccount: account,
      ...this.getBigViewInfo(account)
    })
  )

  // 要拿真实dom
  setTimeout(playVideos)
}

/**
 * 获取会议当前大屏的视频流
 * @return {*}
 */
fn.getMeetingBigVideoObject = function () {
  const node = this.getNode('meeting-video-bigView')
  if (node) {
    return node.srcObject
  }
}

/** 开启自己本地音视频流 */
fn.startLocalStreamMeeting = function () {
  const {
    user: { userUID }
  } = store.getState().im
  const { meetingLocked, currBigViewAccount } = this.getState()
  const node = this.findAccountNode(userUID)
  if (this.netcall && node) {
    this.netcall.startLocalStream(node)
    this.setLoadingStatus(userUID)
    if (!meetingLocked && currBigViewAccount === userUID) {
      this.setLocalStreamBigView(userUID)
    }
    this.setSettingVideoView(node)
  }
}

/** 关闭本地视频流 */
fn.stopLocalStreamMeeting = function () {
  if (this.netcall) {
    this.netcall.stopLocalStream()
  }
}

/** 开启远程音视频流 */
fn.startRemoteStreamMeeting = function (obj) {
  const { cameraStatus, meetingLocked, caller, currBigViewAccount, gridMode, members } =
    this.getState()
  const { account } = obj
  // 远程摄像头不可用
  if (cameraStatus[account] === false) {
    if (gridMode) {
      dispatchCustomEvent('onCameraControl', { account, msg: '对方摄像头不可用' })
    }
    if (!meetingLocked && (caller === account || currBigViewAccount === account)) {
      this.setLocalStreamBigView(account)
    }
    return
  }
  if (!obj.account && !obj.uid) {
    console.error('远程流错误，缺少account或者uid：', obj)
  }
  // if (!obj.account) {
  //   obj.account = this.netcall.getAccountWithUid ? this.netcall.getAccountWithUid(obj.uid) : ''
  // }
  obj.node = this.findAccountNode(account)

  if (!obj.node) return

  this.setLoadingStatus(account)
  if (this.netcall) {
    this.netcall.startRemoteStream(obj)
    if (!meetingLocked && (caller === account || currBigViewAccount === account)) {
      this.setLocalStreamBigView(account)
    }
    if (gridMode) {
      dispatchCustomEvent('onCameraControl', { account, msg: '' })
    }
    // 如果当前用户不在列表可见范围内，掐掉视频流, 10人以内不做可视范围检测
    if (members.length > config.disableObserveLength && !obj.node.appeared) {
      ;(account => {
        setTimeout(() => {
          this.stopRemoteStreamMeeting(account)
        }, 200)
      })(account)
    }
  }
}

/**
 *  开启远程音视频流(简单方式)
 *  @param {object} obj 格式如: {account, node}
 * */
fn.startRemoteStreamMeetingSimply = function (obj) {
  const { cameraStatus, gridMode } = this.getState()
  const { account } = obj
  // 远程摄像头不可用
  if (cameraStatus[account] === false) {
    if (gridMode) {
      dispatchCustomEvent('onCameraControl', { account, msg: '对方摄像头不可用' })
    }
    return
  }
  this.setLoadingStatus(account)
  if (this.netcall) {
    this.netcall.startRemoteStream(obj)
    if (gridMode) {
      dispatchCustomEvent('onCameraControl', { account, msg: '' })
    }
  }
}

/** 关闭远程视频流 */
fn.stopRemoteStreamMeeting = function (account) {
  if (this.netcall) {
    this.netcall.stopRemoteStream(account)
  }
}

/** 设置自己视频大小尺寸
 */
fn.setVideoViewSize = function () {
  const { localBigView } = this.getState()
  const { big } = this.defaultVideoCaptureSize
  const bigSize = {
    cut: true,
    width: big.width,
    height: big.height
  }
  this.netcall.setVideoViewSize(localBigView ? bigSize : this.videoCaptureSize)
}

/** 设置远程视频尺寸大小 */
fn.setVideoViewRemoteSize = function () {
  this.netcall.setVideoViewRemoteSize(this.videoCaptureSize)
}

/** 设置视频裁剪尺寸 */
fn.setVideoScale = function () {
  if (this.netcall.setVideoScale) {
    this.netcall.setVideoScale({ type: 1 })
  }
}

/** 播放自己的声音 */
fn.startDeviceAudioOutLocal = function () {
  this.netcall
    .startDevice({
      type: WebRTC.DEVICE_TYPE_AUDIO_OUT_LOCAL,
      device: { deviceId: this.devices.currentAudioOut }
    })
    .catch(() => {
      console.error('播放自己的声音失败')
    })
}

/** 关闭自己的声音 */
fn.stopDeviceAudioOutLocal = function () {
  this.netcall.stopDevice(WebRTC.DEVICE_TYPE_AUDIO_OUT_LOCAL)
}

/** 播放远程声音 */
fn.startDeviceAudioOutChat = function () {
  this.netcall
    .startDevice({
      type: WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT,
      device: { deviceId: this.devices.currentAudioOut }
    })
    .catch(() => {
      console.log('播放对方的声音失败')
    })
}

/** 关闭远程声音 */
fn.stopDeviceAudioOutChat = function () {
  this.netcall.stopDevice(WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT)
}

/** 自己本地设备状态变化的通知
 * @param {string} type 类型：视频 / 音频（默认）
 * @param {boolean} isOn 状态：开（默认） / 关
 * @param {boolean} isEnable 状态：设备可用（默认） / 设备不可用
 */
fn.updateDeviceStatus = function (type, isOn, isEnable) {
  const {
    user: { userUID }
  } = store.getState().im
  type = type || WebRTC.DEVICE_TYPE_AUDIO_IN
  const map = {}
  map[WebRTC.DEVICE_TYPE_AUDIO_IN] = '麦克风'
  map[WebRTC.DEVICE_TYPE_VIDEO] = '摄像头'
  let text = isEnable ? (isOn ? '' : '已关闭') : '不可用'
  text = text ? map[type] + text : ''
  if (type === WebRTC.DEVICE_TYPE_VIDEO) {
    this.setLoadingStatus(userUID, text)
    this.setCameraStatus(userUID, isEnable && isOn)
  }
}

/**
 * 获取桌面窗口资源
 */
fn.getCapturerSources = function () {
  if (process.env.REACT_APP_ENV === 'electron') {
    const { desktopCapturer } = require('electron').remote
    return desktopCapturer
      .getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 160, height: 160 },
        fetchWindowIcons: true
      })
      .then(sources => {
        return sources.map(source => ({
          display_id: source.display_id,
          id: source.id,
          name: source.name,
          appIcon: source.appIcon
            ? source.appIcon.toDataURL()
            : require('@/assets/img/desktop.svg'),
          thumbnail: source.thumbnail.toDataURL()
        }))
      })
      .catch(() => {
        Modal.error({
          title: '提示信息',
          content: '获取共享窗口资源时出错，请重试。',
          zIndex: 1205
        })
      })
  }
  return Promise.resolve([])
}

/**
 * 开始屏幕录制
 * @param sourceId 窗口或桌面id
 */
fn.startDesktopCapturer = function (sourceId) {
  return navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId
        }
      }
    })
    .then(stream => {
      return this.netcall.startDevice({
        type: WebRTC.DEVICE_TYPE_CUSTOM_VIDEO,
        videoSource: stream.getVideoTracks()[0]
      })
    })
}

/**
 * 关闭屏幕录制窗口选择框
 */
fn.showCapturerSources = function () {
  this.dispatch(
    updateNetCall({
      showCapturerSources: true
    })
  )
}

/**
 * 关闭屏幕录制窗口选择框
 */
fn.closeCapturerSources = function () {
  this.dispatch(
    updateNetCall({
      showCapturerSources: false
    })
  )
}

/**
 * 是否处于屏幕共享状态
 */
fn.setIsShareScreen = function (bool) {
  this.dispatch(
    updateNetCall({
      isShareScreen: bool
    })
  )
}

/** 桌面共享 */
fn.shareScreen = function (sourceId) {
  if (!this.isRtcSupported || this.videoType === 'screen') return

  const { status } = this.getState()

  let promise
  if (process.env.REACT_APP_ENV === 'electron') {
    // 不传sourceId时把窗口选择框展示出来
    if (!sourceId) {
      return this.showCapturerSources()
    }
    // 开始屏幕时，隐藏窗口选择框
    this.closeCapturerSources()
    promise = this.startDesktopCapturer(sourceId)
  } else {
    promise = this.netcall.startDevice({
      type: WebRTC.DEVICE_TYPE_DESKTOP_CHROME_SCREEN
    })
  }

  return promise
    .then(() => {
      this.videoType = 'screen'
      if (status !== 'meeting') {
        this.startLocalStream()
      } else {
        this.startLocalStreamMeeting()
      }
      this.setVideoViewSize()
      this.setIsShareScreen(true)
    })
    .catch(error => {
      this.videoType = null
      console.warn('屏幕共享启动失败', error)
      // Modal.error({
      //   title: '提示信息',
      //   content: '桌面共享启动失败，请确保您的系统已开启屏幕录制权限。',
      //   zIndex: 1205
      // })
    })
}

/** 关闭桌面共享 */
fn.stopShareScreen = function () {
  if (!this.isRtcSupported || this.videoType === null) return
  this.videoType = null
  let promise
  if (process.env.REACT_APP_ENV === 'electron') {
    promise = this.netcall.stopDevice(WebRTC.DEVICE_TYPE_CUSTOM_VIDEO)
  } else {
    promise = this.netcall.stopDevice(WebRTC.DEVICE_TYPE_DESKTOP_CHROME_SCREEN)
  }
  return promise.then(() => {
    this.setDeviceVideoIn(true).then(() => {
      this.startLocalStreamMeeting()
      this.setVideoViewSize()
      this.closeCapturerSources()
      this.setIsShareScreen(false)
    })
  })
}

export default NetcallMeeting
