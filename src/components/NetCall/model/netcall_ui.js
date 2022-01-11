import { message, Modal } from 'antd'
import platform from 'platform'
import imUtils from '@/utils/im'
import { requestFullscreen, exitFullScreen } from '@/utils/fullScreen'
import { store } from '@/index'
import rtcSupport from './rtcSupport'
import { updateNetCall, initialState } from './index'
import durationManager from '../hooks/DurationManager'

/*
 * 1. 点对点音视频通话中对应的ui相关逻辑
 * 2. 多人音视频相关UI逻辑
 */

function NetcallUI() {}

const fn = NetcallUI.prototype

/**
 * 每当设备信息发生变化时，调用此方法同步设备控制按钮状态和提示信息，更新设备输入,更新视频画面提示信息等
 */
fn.checkDeviceStateUI = function () {
  const { cameraNoDevice, microphoneNoDevice, volumeNoDevice } = this.getState()
  const p1 = this.netcall.getDevicesOfType(WebRTC.DEVICE_TYPE_VIDEO).then(obj => {
    if (obj.length || (obj.devices && obj.devices.length)) {
      // 摄像头从无到有的变化
      if (cameraNoDevice) {
        // 更新ui
        this.dispatch(
          updateNetCall({
            cameraNoDevice: false,
            cameraTitle: '',
            localEmpty: false,
            localMessage: ''
          })
        )

        if (this.isActived()) {
          // 开启摄像头
          this.setDeviceVideoIn(true)

          // 如果是群聊，转到多人脚本处理
          if (this.calling && this.meetingCall.channelName) {
            this.updateDeviceStatus(WebRTC.DEVICE_TYPE_VIDEO, true, true)
            if (this.isRtcSupported) {
              this.startLocalStreamMeeting()
              this.setVideoViewSize()
            }
          } else if (this.isRtcSupported) {
            this.startLocalStream()
            this.setVideoViewSize()
          }
        }
      }
    } else {
      this.onDeviceNoUsable(WebRTC.DEVICE_TYPE_VIDEO)

      // 如果是群聊，转到多人脚本处理
      if (this.calling && this.meetingCall.channelName) {
        this.updateDeviceStatus(WebRTC.DEVICE_TYPE_VIDEO, true, false)
      }
    }
  })

  const p2 = this.netcall.getDevicesOfType(WebRTC.DEVICE_TYPE_AUDIO_IN).then(obj => {
    if (obj.length || (obj.devices && obj.devices.length)) {
      if (microphoneNoDevice) {
        // 更新ui
        this.dispatch(
          updateNetCall({
            microphoneNoDevice: false,
            microphoneDisabled: false,
            microphoneTitle: ''
          })
        )
        if (this.isActived()) {
          this.setDeviceAudioIn(true)
        }
      }
    } else {
      this.onDeviceNoUsable(WebRTC.DEVICE_TYPE_AUDIO_IN)
    }
  })

  const p3 = this.netcall.getDevicesOfType(WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT).then(obj => {
    if (obj.length || (obj.devices && obj.devices.length)) {
      if (volumeNoDevice) {
        this.dispatch(
          updateNetCall({
            volumeNoDevice: false,
            volumeTitle: ''
          })
        )
        if (this.isActived()) {
          this.setDeviceAudioOut(true)
        }
      }
    } else {
      this.onDeviceNoUsable(WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT)
    }
  })

  return Promise.all([p1, p2, p3])
}

fn.onDeviceNoUsable = function (type) {
  if (type === WebRTC.DEVICE_TYPE_VIDEO) {
    // 通知对方，我方摄像头不可用
    this.netcall.control({
      command: WebRTC.NETCALL_CONTROL_COMMAND_SELF_CAMERA_INVALID
    })

    this.dispatch(
      updateNetCall({
        cameraNoDevice: true,
        cameraTitle: '摄像头不可用',
        localEmpty: true,
        localMessage: '摄像头不可用'
      })
    )
  } else if (type === WebRTC.DEVICE_TYPE_AUDIO_IN) {
    // 通知对方，我方麦克风不可用
    this.netcall.control({
      command: WebRTC.NETCALL_CONTROL_COMMAND_SELF_AUDIO_INVALID
    })
    this.dispatch(
      updateNetCall({
        microphoneNoDevice: true,
        microphoneDisabled: true,
        microphoneTitle: '麦克风不可用'
      })
    )
  } else if (type === WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT) {
    this.dispatch(
      updateNetCall({
        volumeNoDevice: true,
        volumeTitle: '扬声器不可用'
      })
    )
  }

  // 如果是群聊，转到多人脚本处理
  if (this.calling && this.meetingCall.channelName) {
    this.updateDeviceStatus(type, true, false)
  }
}

/**
 * 切换对方我方画面位置
 */
fn.switchViewPosition = function () {
  const { localBigView, remoteBigView, viewReverse } = this.getState()

  this.dispatch(
    updateNetCall({
      localBigView: !localBigView,
      remoteBigView: !remoteBigView,
      viewReverse: !viewReverse
    })
  )
  this.updateVideoShowSize(true, true, !localBigView, !remoteBigView)
}

/**
 * 切换全屏模式
 */
fn.toggleAbsFullScreen = function () {
  this.isAbsFullScreen = !this.isAbsFullScreen
  this.isFullScreen = this.isAbsFullScreen
  this.dispatch(
    updateNetCall({
      absFullScreen: this.isAbsFullScreen,
      fullScreen: this.isAbsFullScreen,
      siderShow: !this.isAbsFullScreen
    })
  )
  if (!this.isAbsFullScreen) {
    exitFullScreen()
  } else {
    requestFullscreen()
  }

  // p2p模式
  if (!this.netcall.channelName) {
    this.updateVideoShowFullSize()
  }
}

/**
 * 窗口最大化
 */
fn.toggleFullScreen = function (/* account */) {
  this.isFullScreen = !this.isFullScreen
  this.dispatch(
    updateNetCall({
      fullScreen: this.isFullScreen
    })
  )

  // p2p模式
  if (!this.netcall.channelName) {
    this.updateVideoShowSize(true, true)
  }
}

/**
 * 设置视频画面尺寸
 *
 */
fn.setVideoSize = function (sizeObj) {
  const bigSize = {
    width: this.isFullScreen ? 640 : 320,
    height: this.isFullScreen ? 480 : 240
  }
  const smallSize = {
    width: this.isFullScreen ? 240 : 160,
    height: this.isFullScreen ? 180 : 120
  }
  const size =
    sizeObj && sizeObj.constructor === Object ? sizeObj : this.isFullScreen ? bigSize : smallSize
  this.netcall.setVideoViewSize(size)
}

fn.setVideoRemoteSize = function (sizeObj) {
  const bigSize = {
    width: this.isFullScreen ? 640 : 320,
    height: this.isFullScreen ? 480 : 240
  }
  const smallSize = {
    width: this.isFullScreen ? 240 : 160,
    height: this.isFullScreen ? 180 : 120
  }

  const size =
    sizeObj && sizeObj.constructor === Object ? sizeObj : this.isFullScreen ? bigSize : smallSize
  this.netcall.setVideoViewRemoteSize(size)
}

// 更新视频画面显示尺寸
fn.updateVideoShowSize = function (local, remote, localBigView, remoteBigView) {
  const state = this.getState()

  if (localBigView === undefined) {
    localBigView = state.localBigView
  }

  if (remoteBigView === undefined) {
    remoteBigView = state.remoteBigView
  }

  const { small, big } = this.defaultVideoCaptureSize

  const bigSize = {
    cut: true,
    width: this.isFullScreen ? window.innerWidth : big.width,
    height: this.isFullScreen ? window.innerHeight : big.height
  }
  const smallSize = {
    cut: true,
    width: small.width,
    height: small.height
  }

  if (local) {
    this.netcall.setVideoViewSize(localBigView ? bigSize : smallSize)
  }
  if (remote) {
    this.netcall.setVideoViewRemoteSize(remoteBigView ? bigSize : smallSize)
  }
}

fn.updateVideoShowFullSize = function () {
  const state = this.getState()

  const { small, big, full } = this.defaultVideoCaptureSize

  const bigSize = {
    cut: true,
    width: this.isAbsFullScreen ? full.width : big.width,
    height: this.isAbsFullScreen ? full.height : big.height
  }
  const smallSize = {
    cut: true,
    width: small.width,
    height: small.height
  }

  if (state.localBigView) {
    this.netcall.setVideoViewSize(state.localBigView ? bigSize : smallSize)
  }
  if (state.remoteBigView) {
    this.netcall.setVideoViewRemoteSize(state.remoteBigView ? bigSize : smallSize)
  }
}

fn.hideAllNetCallUI = function () {
  this.dispatch(updateNetCall(initialState))
  Modal.destroyAll()
  // 重置为非全屏状态
  if (this.isFullScreen) {
    this.updateVideoShowSize(true, true)
  }
}

// 通话建立成功后，展示视频通话或者音频通话画面
fn.showConnectedUI = function (type) {
  imUtils.getUserByIdAsync(this.netcallAccount).then(user => {
    const callType =
      type === WebRTC.NETCALL_TYPE_AUDIO
        ? 'audio'
        : type === WebRTC.NETCALL_TYPE_VIDEO
        ? 'video'
        : ''

    this.dispatch(
      updateNetCall({
        visible: true,
        nick: user.nick,
        avatar: imUtils.getAvatar(user),
        canSwitchToAudio: !this.requestSwitchToVideoWaiting,
        type: callType,
        status: callType,
        channelName: this.channelId
      })
    )
  })
  this.checkDeviceStateUI()
}

/** 接收方显示来电界面，兼容多人音视频
 *
 * @param {string} type 通话类型，1： 音频，2：视频
 * @param {object} option 通话场景
 */
fn.showBeCallingUI = function (type, option = {}) {
  const {
    // session: { currSessionId },
    user: { myInfo }
  } = store.getState().im

  // const teamInfo = imUtils.getTeamInfo(currSessionId)

  this.type = type

  let info = {}
  const callTip = `邀请你${type === WebRTC.NETCALL_TYPE_VIDEO ? '视频' : '语音'}聊天...`
  const callType =
    this.type === WebRTC.NETCALL_TYPE_AUDIO
      ? 'audio'
      : this.type === WebRTC.NETCALL_TYPE_VIDEO
      ? 'video'
      : ''
  const showUI = info => {
    this.dispatch(
      updateNetCall({
        visible: true,
        type: callType,
        role: 'called',
        status: 'calling',
        nick: info.nick,
        myAccount: myInfo.account,
        myNick: myInfo.nick,
        avatar: imUtils.getAvatar(info),
        tip: callTip,
        channelId: this.channelId
      })
    )
  }

  // 群视频呼叫
  if (option.channelName) {
    // const user = imUtils.getTeamMember(to, option.caller) || {}
    // callTip = (user.nick || '') + callTip
    // info = { ...teamInfo, nick: teamInfo.name }
    info.nick = option.meetingSubject
    showUI(info)
  } else {
    imUtils.getUserByIdAsync(this.netcallAccount).then(user => {
      info = { ...user, nick: imUtils.getUserAlias(user) }
      showUI(info)
    })
  }
}

/** 发起方显示通话界面 */
fn.showCallingUI = function () {
  const {
    user: { myInfo }
  } = store.getState().im

  imUtils.getUserByIdAsync(this.netcallAccount).then(user => {
    this.dispatch(
      updateNetCall({
        nick: user.nick,
        myNick: myInfo.nick,
        avatar: imUtils.getAvatar(user),
        tip: '正在等待对方接听...',
        role: 'caller',
        status: 'calling',
        type:
          this.type === WebRTC.NETCALL_TYPE_AUDIO
            ? 'audio'
            : this.type === WebRTC.NETCALL_TYPE_VIDEO
            ? 'video'
            : ''
      })
    )
  })
}

/**
 * 点击发起音视频通话按钮
 * @param {number} type 通话类型
 * 1: NETCALL_TYPE_AUDIO
 * 2: NETCALL_TYPE_VIDEO
 */
fn.sendNetCall = function (type) {
  const { members, to } = this.getState()
  const isMeeting = members.length > 0

  // 已经处于音视频通话中，弹窗提示
  if (this.netcallActive && !isMeeting) {
    return message.error('正在通话中，无法发起新的通话')
  }

  // 下一步操作
  const next = () => {
    this.type = type
    if (!isMeeting) {
      return this.doCalling(type, to)
    }
    // team多人场景: 人数少于2人的多人视频
    if (members.length < 2) {
      return message.error('无法发起，人数少于2人')
    }
    // 多人音视频
    this.createChannel()
  }

  this.checkRtcSupport().then(next, () => this.reject())
}

/** 通话计时器
 * 场景：p2p音视频 / 多人音视频
 */
fn.startDurationTimer = function () {
  const keyName = this.netcall.channelName || this.channelId
  if (keyName) {
    durationManager.startDuration(keyName)
  }
}

/** 清除通话计时器
 * 场景：p2p音视频 / 多人音视频
 */
fn.clearDurationTimer = function () {}

/** *************多人音视频的UI部分***************************** */

/**
 * 选择通话方式
 */
fn.checkRtcSupport = function () {
  // 检查WebRTC支持情况
  return new Promise((resolve, reject) => {
    const versionSupport = this.checkRtcBrowser()
    this.isRtcSupported =
      versionSupport &&
      rtcSupport.supportGetUserMedia &&
      rtcSupport.supportRTCPeerConnection &&
      rtcSupport.supportMediaStream &&
      rtcSupport.supportWebAudio

    if (!this.isRtcSupported) {
      Modal.error({
        title: '提示信息',
        content:
          '当前浏览器不支持WebRTC或WebAudio功能, 无法使用音视频功能, 请使用最新版Chrome、Firefox浏览器。',
        okText: '知道了，挂断',
        centered: true,
        maskClosable: false,
        zIndex: 1205,
        style: {
          marginLeft: 60,
          marginTop: 20
        },
        onOk: () => {
          reject()
        }
      })
    } else {
      resolve()
    }
  })
}

fn.checkRtcBrowser = function () {
  const test = platform.ua.match(/(chrome|firefox)\/(\d+)/i)
  if (!test || /Edge\/([\d.]+)/.test(platform.ua)) return false
  const name = test[1]
  const version = test[2]
  return (/chrome/i.test(name) && version > 57) || (/firefox/i.test(name) && version > 56)
}

export default NetcallUI
