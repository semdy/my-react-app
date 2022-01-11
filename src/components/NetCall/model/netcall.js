import React from 'react'
import { message, Modal } from 'antd'
import Icon from '@/components/Icon'
import MSG_TYPE from '@/constants/MSG_TYPE'
import { sendMsg } from '@/models/im/msgs'
import { store, history } from '@/index'
import imUtils from '@/utils/im'
import appWindow from '@/utils/appWindow'
import { openNewCloudWindowCenter } from '@/utils/space'
import { checkAutoPlay, dispatchCustomEvent } from '@/utils/utils'
import { checkSharingDocLock } from '@/services/space'
import styles from './netcall.module.less'
import NetCallUI from './netcall_ui'
import NetCallMeeting from './netcall_meeting'
import { updateNetCall } from './index'
import config from '../config'

export default function NetcallBridge(dispatch, getState) {
  // useReducer
  this.dispatch = dispatch
  // useReducer 自己实现的一个方法
  this.getState = getState
  // Netcall 实例
  this.netcall = null
  // 呼叫超时检查定时器
  this.callTimer = null
  // 被呼叫超时检查定时器
  this.beCallTimer = null
  // 有用户加入房间定时器
  this.onJoinChannelTimer = null
  // 音频或视频通话
  this.type = null
  // 是否处于通话流程中
  this.netcallActive = false
  // 是否正在通话（主叫方）
  this.calling = false
  // 是否正在通话（被叫方）
  this.beCalling = false
  // 通话的channelId
  this.channelId = null
  // 通话流程的另一方账户
  this.netcallAccount = ''
  // 进出会议时是否播放提示音，默认为true
  this.isPlayRingWhenJoinOrLeave = JSON.parse(localStorage.getItem('ims_netall_playRing') || true)
  // 本机设备，摄像头、麦克风、扬声器
  this.devices = {
    audioIn: [],
    currentAudioIn: localStorage.getItem('ims_currentAudioIn'),
    audioOut: [],
    currentAudioOut: localStorage.getItem('ims_currentAudioOut'),
    video: [],
    currentVideo: localStorage.getItem('ims_currentVideo')
  }
  // 音视频流配置
  this.sessionConfig = {
    videoQuality: WebRTC.CHAT_VIDEO_QUALITY_720P,
    videoFrameRate: WebRTC.CHAT_VIDEO_FRAME_RATE_NORMAL,
    videoBitrate: 0,
    recordVideo: false,
    recordAudio: false,
    highAudio: false
  }
  this.defaultVideoCaptureSize = {
    small: {
      width: 210,
      height: 120
    },
    big: {
      width: 960,
      height: 570
    },
    full: {
      width: window.screen.width,
      height: window.screen.height
    }
  }
  // 窗口是否处于最大化状态
  this.isFullScreen = false
  // 是否全屏状态
  this.isAbsFullScreen = false
  // 本地agent连接状态
  this.signalInited = false
  // 多人音视频的缓存对象
  this.meetingCall = {}
  // 已加入的用户缓存对象
  this.joinedMembers = {}
  // 当前视频状态，是桌面共享还是视频: video / window / screen
  this.videoType = 'video'
  // 是否支持webrtc
  this.isRtcSupported = false
  // 麦克风和扬扬声器默认音量，最大
  this.captureVolume = 255
  this.playVolume = 255
  // 对方邀请我视频聊天弹窗实例
  this.videoCallModal = null

  // 开始初始化
  this.init()
}

const fn = NetcallBridge.prototype

fn.init = function () {
  this.initNetCall()
  this.initEvent()
}

/** 初始化p2p音视频响应事件 */
fn.initNetCall = function () {
  const { nim, SDK, WebRTC, netcall } = window
  if (!nim || !SDK || !WebRTC) return

  const { NIM } = SDK

  // window.WebRTC = WebRTC
  NIM.use(WebRTC)

  if (netcall) {
    netcall.destroy()
  }

  // 初始化webrtc
  this.netcall = WebRTC.getInstance({
    container: null,
    remoteContainer: null,
    nim,
    debug: sessionStorage.getItem('netcallDebug') || false
  })

  // this.setMixConf(true)
  this.initWebRTCEvent()
  this.getDevices()
}

/**
 * 视频与屏幕共享混屏设置
 * @param enable {boolean} 是否开启混屏
 */
fn.setMixConf = function (enable) {
  const mixParams = {
    enableMixVideo: enable, // 是否开启混屏
    videoLayout: WebRTC.LAYOUT_TOP_RIGHT, // 混屏时视频画面的布局位置
    videoCompressSize: WebRTC.CHAT_VIDEO_QUALITY_MEDIUM // 混屏时视频画面的压缩比例
  }
  this.netcall.setMixConf(mixParams) // webrtc表示音视频实例名称
}

/** 初始化webrtc事件 */
fn.initWebRTCEvent = function () {
  const { netcall } = this
  // 对方接受通话 或者 我方接受通话，都会触发
  netcall.on('callAccepted', obj => {
    this.onCallAccepted(obj)
  })

  netcall.on('callRejected', obj => {
    this.onCallingRejected(obj)
  })

  netcall.on('signalClosed', () => {
    this.signalInited = false
    this.hangupNetCall()
    this.showTip('信令断开了')
  })

  netcall.on('rtcConnectFailed', () => {
    this.hangup()
    this.showTip('通话连接断开了')
  })

  netcall.on('deviceStatus', () => {
    // console.log('on deviceStatus:', obj)
    this.getDevices()
    this.checkDeviceStateUI()
  })

  netcall.on('beCalling', obj => {
    this.onBeCalling(obj)
  })

  netcall.on('control', obj => {
    this.onControl(obj)
  })

  netcall.on('hangup', obj => {
    this.onHangup(obj)
  })

  netcall.on('heartBeatError', () => {
    console.error('heartBeatError, 要重建信令啦')
  })

  netcall.on('callerAckSync', obj => {
    this.onCallerAckSync(obj)
  })

  netcall.on('netStatus', obj => {
    dispatchCustomEvent('netcallNetStatus', obj)
  })

  // netcall.on('statistics', obj => {
  //   console.log('on statistics:', obj)
  // })

  netcall.on('audioVolume', obj => {
    // 如果是群聊，转到多人脚本处理
    if (this.calling && this.meetingCall.channelName) {
      this.updateVolumeBar(obj)
    }
  })

  netcall.on('speaker', data => {
    const { meetingLocked, autoExchange, currBigViewAccount } = this.getState()
    if (meetingLocked || !autoExchange) return

    // 取出说话声最大者
    let maxAccount = null
    const minVolume = 10 // 最小阈值
    data.forEach((item, i) => {
      // eslint-disable-next-line
      if (isNaN(item.volume) || item.volume < minVolume) return
      const prevItem = data[i - 1]
      if (item.volume > prevItem ? prevItem.volume : minVolume) {
        maxAccount = item.account
      }
    })

    if (maxAccount && maxAccount !== currBigViewAccount) {
      this.setLocalStreamBigView(maxAccount)
    }
  })

  // // 收到自己加入频道的通知
  // netcall.on('joinChannel', obj => {
  //   console.log('joinChannel', obj)
  //   // this.onJoinChannel(obj)
  // })

  // 有用户加入频道的通知
  netcall.on('userJoined', obj => {
    console.log('userJoined', obj)
    this.onUserJoinChannel(obj)
  })

  // // 有用户离开频道的通知
  // netcall.on('userLeft', obj => {
  //   console.log('userLeft', obj)
  // })

  netcall.on('remoteTrack', obj => {
    if (this.netcall.channelName) {
      ;(obj => {
        // 保证在userJoined之后执行，并且要拿到真实dom
        this.onJoinChannelTimer = setTimeout(() => {
          this.onJoinChannel(obj)
        }, 600)
      })(obj)
      return
    }

    console.log('on remoteTrack', obj)

    obj.node = this.findAccountNode(obj.account)

    if (obj.track && obj.track.kind === 'audio') {
      this.setDeviceAudioOut(true)
    }

    if (obj.track && obj.track.kind === 'video') {
      this.startRemoteStream(obj)
      this.updateVideoShowSize(true, true)
    }
  })

  netcall.on('leaveChannel', obj => {
    console.log('leaveChannel', obj)
    this.onLeaveChannel(obj)
    if (obj.type === -1 || obj.desc === 'Network error') {
      this.showTip('音视频服务连接超时')
    }
  })

  // 通话计时完成的通知
  // netcall.on('sessionDuration', obj => {
  //   console.log('sessionDuration', obj)
  // })

  netcall.on('streamEnded', obj => {
    console.log('streamEnded', obj)
    if (obj && obj.type === 'screen') {
      // 屏幕共享的媒体流已经停止了，此处做关闭屏幕共享处理
      this.stopShareScreen()
    }
  })
}

fn.clearOnJoinChannelTimer = function () {
  if (this.onJoinChannelTimer) {
    clearTimeout(this.onJoinChannelTimer)
    this.onJoinChannelTimer = null
  }
}

fn.initEvent = function () {
  this.beforeunload = this.beforeunload.bind(this)
  this.online = this.online.bind(this)
  this.offline = this.offline.bind(this)
  window.addEventListener('beforeunload', this.beforeunload, false)
  window.addEventListener('online', this.online)
  window.addEventListener('offline', this.offline)
}

/** 页面卸载事件 */
fn.beforeunload = function () {
  // this.hangupNetCall()
  // const confirmMessage = '当前正在通话中，确定要关闭窗口吗 '
  // e.returnValue = confirmMessage // Gecko, Trident, Chrome 34+
  // return confirmMessage
}

/** 在线事件 */
fn.online = function () {
  if (this.meetingCall.offlineTimer) {
    clearTimeout(this.meetingCall.offlineTimer)
  }
}

/** 离线事件, 启动倒计时30s后自动挂断 */
fn.offline = function () {
  if (this.isActived()) {
    this.meetingCall.offlineTimer = setTimeout(() => {
      this.showTip('超时掉线，通话结束')
      this.hangupNetCall(false)
    }, config.offlineTimeout)
  }
}

/**
 * 销毁音视频实例并卸载相关事件
 */
fn.destroy = function () {
  return this.hangupNetCall().then(() => {
    if (this.netcall) {
      this.netcall.removeAllListeners()
      this.netcall.destroy()
      this.netcall = null
    }
    window.removeEventListener('beforeunload', this.beforeunload)
    window.removeEventListener('online', this.online)
    window.removeEventListener('offline', this.offline)
  })
}

/**
 * 关闭音视频（单人或多人）
 * @param endMeeting {boolean} 是否结束会议
 * @param isHotDev {boolean} 是否是热更新开发模式
 */
fn.hangupNetCall = function (endMeeting = true, isHotDev) {
  if (!this.isActived()) return Promise.resolve(true)
  if (this.meetingCall.channelName) {
    return this.leaveChannel(endMeeting, isHotDev)
  }
  return this.hangup(isHotDev)
}

/**
 * 获得本机设备列表，如：摄像头、麦克风、扬声器等
 */
fn.getDevices = function () {
  this.netcall.getDevices().then(deviceInfos => {
    // console.log('devices：', deviceInfos)
    const audioIn = deviceInfos.audioIn || []
    const audioOut = deviceInfos.audioOut || []
    const video = deviceInfos.video || []

    let { currentAudioIn, currentAudioOut, currentVideo } = this.devices

    if (audioOut.length > 0 && !audioOut.some(audio => audio.deviceId === currentAudioOut)) {
      currentAudioOut = audioOut[0].deviceId
    }
    if (audioIn.length > 0 && !audioIn.some(audio => audio.deviceId === currentAudioIn)) {
      currentAudioIn = audioIn[0].deviceId
    }
    if (video.length > 0 && !video.some(v => v.deviceId === currentVideo)) {
      currentVideo = video[0].deviceId
    }

    this.devices = {
      audioIn,
      currentAudioIn,
      audioOut,
      currentAudioOut,
      video,
      currentVideo
    }
  })
}

/**
 * 返回本机设备数据
 * @return {*}
 */
fn.getMediaDevices = function () {
  return this.devices
}

/**
 * 选择并设置当前设备
 * @param deviceId {string} 设备id
 * @param type {string} 设备类型
 */
fn.selectDevice = function (deviceId, type) {
  switch (type) {
    case 'video':
      this.devices.currentVideo = deviceId
      localStorage.setItem('ims_currentVideo', deviceId)
      this.setDeviceVideoIn(false).then(() => {
        this.setDeviceVideoIn(true)
      })
      break
    case 'audioIn':
      this.devices.currentAudioIn = deviceId
      localStorage.setItem('ims_currentAudioIn', deviceId)
      this.setDeviceAudioIn(false).then(() => {
        this.setDeviceAudioIn(true)
      })
      break
    case 'audioOut':
      this.devices.currentAudioOut = deviceId
      localStorage.setItem('ims_currentAudioOut', deviceId)
      this.setDeviceAudioOut(false).then(() => {
        this.setDeviceAudioOut(true)
      })
      break
    default:
  }
}

/**
 * 设置进出会议时是否播放提示音
 * @param value
 */
fn.setIsPlayRing = function (value) {
  this.isPlayRingWhenJoinOrLeave = value
  localStorage.setItem('ims_netall_playRing', value)
}

/**
 * 通话是否正在进行中
 * @return {boolean}
 */
fn.isActived = function () {
  return this.netcallActive
}

/**
 * 被控制回调
 * @param obj {Object}
 */
fn.onControl = function (obj) {
  const { netcall } = this
  const isMeeting = !!netcall.channelName

  try {
    // 如果不是当前通话的指令, 直接丢掉
    if (netcall.notCurrentChannelId(obj)) {
      this.onSelfAcceptOrReject(null, true)
      console.log('非当前通话的控制信息')
      return
    }
  } catch (e) {
    console.warn(e)
  }

  // 如果是多人音视频会话，转到多人脚本处理
  if (isMeeting) {
    this.onMeetingControl(obj)
    return
  }

  const { type } = obj

  const doEnd = () => {
    this.cancelCalling(false, true)
  }

  switch (type) {
    // 通知对方自己打开了麦克风
    case WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_ON:
      console.log('对方打开了麦克风')
      this.dispatch(
        updateNetCall({
          remoteMicrophoneDisabled: false
        })
      )
      break
    // 通知对方自己关闭了音频
    case WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_OFF:
      console.log('对方关闭了麦克风')
      this.dispatch(
        updateNetCall({
          remoteMicrophoneDisabled: true
        })
      )
      break
    // 通知对方自己打开了视频
    case WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_ON:
      console.log('对方打开了摄像头')
      this.dispatch(
        updateNetCall({
          remoteEmpty: false,
          remoteMessage: ''
        })
      )
      if (this.isRtcSupported) {
        if (isMeeting) {
          this.startRemoteStreamMeeting(obj)
        } else {
          this.startRemoteStream()
        }
      }
      this.updateVideoShowSize(true, true)
      break
    // 通知对方自己关闭了视频
    case WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_OFF:
      console.log('对方关闭了摄像头')
      this.dispatch(
        updateNetCall({
          remoteEmpty: true,
          remoteMessage: '对方关闭了摄像头'
        })
      )
      if (this.isRtcSupported) {
        if (!isMeeting) {
          return this.stopRemoteStream()
        }
        this.stopRemoteStreamMeeting(obj.account)
      }
      break
    // 拒绝从音频切换到视频
    case WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO_REJECT:
      console.log('对方拒绝从音频切换到视频通话')
      this.requestSwitchToVideoRejected()
      break
    // 请求从音频切换到视频
    case WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO:
      console.log('对方请求从音频切换到视频通话')
      if (this.requestSwitchToVideoWaiting) {
        this.doSwitchToVideo()
      } else {
        this.beingAskSwitchToVideo(obj)
      }
      break
    // 同意从音频切换到视频
    case WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO_AGREE:
      console.log('对方同意从音频切换到视频通话')
      if (this.requestSwitchToVideoWaiting) {
        this.doSwitchToVideo()
      }
      break
    // 从视频切换到音频
    case WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_VIDEO_TO_AUDIO:
      console.log('对方请求从视频切换为音频')
      this.doSwitchToAudio()
      break
    // 占线
    case WebRTC.NETCALL_CONTROL_COMMAND_BUSY:
      console.log('对方正在通话中, 取消通话')
      this.netcall.hangup()
      this.clearCallTimer()
      if (this.afterPlayRingA) {
        this.afterPlayRingA = () => {
          this.playRing('C', doEnd)
        }
      } else {
        this.playRing('C', doEnd)
      }
      break
    // 自己的摄像头不可用
    case WebRTC.NETCALL_CONTROL_COMMAND_SELF_CAMERA_INVALID:
      console.log('对方摄像头不可用')
      this.dispatch(
        updateNetCall({
          remoteEmpty: true,
          remoteMessage: '对方摄像头不可用'
        })
      )
      if (this.isRtcSupported) {
        if (!isMeeting) {
          return this.stopRemoteStream()
        }
        this.stopRemoteStreamMeeting(obj.account)
      }
      break
    // NETCALL_CONTROL_COMMAND_SELF_ON_BACKGROUND 自己处于后台
    // NETCALL_CONTROL_COMMAND_START_NOTIFY_RECEIVED 告诉发送方自己已经收到请求了（用于通知发送方开始播放提示音）
    // NETCALL_CONTROL_COMMAND_NOTIFY_RECORD_START 通知对方自己开始录制视频了
    // NETCALL_CONTROL_COMMAND_NOTIFY_RECORD_STOP 通知对方自己结束录制视频了
    default:
  }
}

/** 设置采集音量大小
 * 默认值255
 */
fn.setCaptureVolume = function (value) {
  this.captureVolume = value
  const { netcall } = this
  if (netcall) {
    netcall.setCaptureVolume(this.captureVolume)
  }
}

/** 获取采集音量大小 */
fn.getCaptureVolume = function () {
  return this.captureVolume
}

/** 设置播放音量大小 */
fn.setPlayVolume = function (value) {
  this.playVolume = value
  const { netcall } = this
  if (netcall) {
    netcall.setPlayVolume({ volume: this.playVolume })
  }
}

/** 获取播放音量大小 */
fn.getPlayVolume = function () {
  return this.playVolume
}

/**
 * 扬声器控制
 */
fn.switchAudioOut = function () {
  const { volumeNoDevice, volumeDisabled } = this.getState()
  if (volumeNoDevice) return
  // eslint-disable-next-line
  const volumeEnabled = volumeDisabled ? true : false
  this.dispatch(
    updateNetCall({
      volumeDisabled: !volumeEnabled
    })
  )
  if (this.volumeStateTimer) clearTimeout(this.volumeStateTimer)
  this.volumeStateTimer = setTimeout(() => {
    this.volumeStateTimer = null
    this.setDeviceAudioOut(volumeEnabled)
  }, 300)
}

/**
 * 麦克风开关控制
 */
fn.switchAudioIn = function (enabled) {
  const { microphoneNoDevice, microphoneDisabled } = this.getState()
  if (microphoneNoDevice) return
  // eslint-disable-next-line
  const microphoneEnabled = enabled !== undefined ? enabled : microphoneDisabled ? true : false
  if (microphoneEnabled === !microphoneDisabled) return
  this.dispatch(
    updateNetCall({
      microphoneDisabled: !microphoneEnabled
    })
  )
  if (this.microStateTimer) clearTimeout(this.microStateTimer)
  this.microStateTimer = setTimeout(() => {
    this.microStateTimer = null
    this.setDeviceAudioIn(microphoneEnabled)
  }, 300)
}

/**
 * 摄像头开关控制
 */
fn.switchCamera = function (enabled) {
  const { cameraNoDevice, cameraDisabled } = this.getState()
  if (cameraNoDevice) return
  // eslint-disable-next-line
  const cameraEnabled = enabled !== undefined ? enabled : cameraDisabled ? true : false
  if (cameraEnabled === !cameraDisabled) return
  this.dispatch(
    updateNetCall({
      cameraDisabled: !cameraEnabled
    })
  )
  if (this.cameraStateTimer) clearTimeout(this.cameraStateTimer)
  this.cameraStateTimer = setTimeout(() => {
    this.cameraStateTimer = null
    this.setDeviceVideoIn(cameraEnabled)
  }, 300)
}

/**
 * 发起界面摄像头开关
 */
fn.switchCameraOn = function () {
  const { cameraDisabled, status } = this.getState()
  this.dispatch(
    updateNetCall({
      cameraDisabled: !cameraDisabled,
      cameraTitle: !cameraDisabled ? '开启摄像头' : '关闭摄像头'
    })
  )
  if (status === 'meetingCalling' || status === 'meetingJoin') {
    if (cameraDisabled) {
      this.startCallingVideoPreview()
    } else {
      this.stopCallingVideoPreview()
    }
  }
}

/**
 * 发起界面麦克风开关
 */
fn.switchAudioInOn = function () {
  const { microphoneDisabled } = this.getState()
  this.dispatch(
    updateNetCall({
      microphoneDisabled: !microphoneDisabled,
      microphoneTitle: !microphoneDisabled ? '开启麦克风' : '关闭麦克风'
    })
  )
}

/**
 * 屏幕分享开关控制
 */
fn.switchShareScreen = function () {
  const { isShareScreen, cameraDisabled, myAccount } = this.getState()
  if (cameraDisabled) return
  if (this.netcall.channelName && !this.getCameraEnabled(myAccount)) return
  if (this.shareScreenTimer) clearTimeout(this.shareScreenTimer)
  this.shareScreenTimer = setTimeout(() => {
    this.shareScreenTimer = null
    if (isShareScreen) {
      this.stopShareScreen()
    } else {
      this.shareScreen()
    }
  }, 300)
}

/**
 * 对方请求音频切换为视频
 */
fn.beingAskSwitchToVideo = function (obj) {
  function agree() {
    console.log('同意切换到视频通话')
    this.videoCallModal = null
    this.netcall.control({
      command: WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO_AGREE
    })

    if (this.isRtcSupported) {
      this.setDeviceVideoIn(true)
        .then(() => {
          this.startLocalStream()
        })
        .then(() => {
          return this.netcall.switchAudioToVideo()
        })
        .then(() => {
          this.startRemoteStream()
          this.updateVideoShowSize(true, true)
        })
        .catch(e => {
          console.error(e)
        })
    } else {
      this.netcall.switchAudioToVideo()
      this.setDeviceVideoIn(true)
      this.startLocalStream()
      this.startRemoteStream()
    }
    this.dispatch(
      updateNetCall({
        remoteEmpty: false,
        remoteMessage: '',
        canSwitchToAudio: true,
        type:
          this.type === WebRTC.NETCALL_TYPE_AUDIO
            ? 'audio'
            : this.type === WebRTC.NETCALL_TYPE_VIDEO
            ? 'video'
            : ''
      })
    )
    this.updateVideoShowSize(true, true)
    this.type = WebRTC.NETCALL_TYPE_VIDEO
    this.showConnectedUI(WebRTC.NETCALL_TYPE_VIDEO)
  }

  function reject() {
    console.log('拒绝切换到视频通话')
    this.videoCallModal = null
    this.netcall.control({
      command: WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO_REJECT
    })
  }

  // 弹窗提示用户
  if (this.videoCallModal || obj.account === store.getState().im.user.userUID) {
    return
  }
  this.videoCallModal = Modal.confirm({
    title: '提示信息',
    content: '对方邀请你开始视频聊天',
    okText: '开始视频',
    cancelText: '拒绝',
    centered: true,
    maskClosable: false,
    zIndex: 1205,
    onOk: agree.bind(this),
    onCancel: reject.bind(this)
  })
}

/**
 * 我方请求音频切换到视频通话，对方同意时
 */
fn.doSwitchToVideo = function () {
  console.log('切换到视频通话')
  this.requestSwitchToVideoWaiting = false
  this.type = WebRTC.NETCALL_TYPE_VIDEO

  this.dispatch(
    updateNetCall({
      canSwitchToAudio: true
    })
  )

  if (this.isRtcSupported) {
    let promise
    if (!this.requestSwitchToVideoWaiting) {
      promise = this.setDeviceVideoIn(true).then(() => {
        this.startLocalStream()
      })
    } else {
      promise = Promise.resolve()
    }

    promise
      .then(() => {
        return this.netcall.switchAudioToVideo()
      })
      .then(() => {
        this.startRemoteStream()
        this.updateVideoShowSize(true, true)
      })
      .catch(e => {
        console.log(e)
      })
  } else {
    this.netcall.switchAudioToVideo()
    this.setDeviceVideoIn(true)
    this.startLocalStream()
    this.startRemoteStream()
  }

  this.dispatch(
    updateNetCall({
      remoteEmpty: false,
      remoteMessage: '',
      type:
        this.type === WebRTC.NETCALL_TYPE_AUDIO
          ? 'audio'
          : this.type === WebRTC.NETCALL_TYPE_VIDEO
          ? 'video'
          : ''
    })
  )
  this.updateVideoShowSize(true, true)
  this.checkDeviceStateUI()
}

/**
 * 对方拒绝切换为视频聊天
 */
fn.requestSwitchToVideoRejected = function () {
  this.requestSwitchToVideoWaiting = false
  this.dispatch(
    updateNetCall({
      remoteMessage: ''
    })
  )
  this.showTip('对方拒绝切换为视频聊天')
  this.showConnectedUI(WebRTC.NETCALL_TYPE_AUDIO)
  this.setDeviceVideoIn(false)
  this.stopLocalStream()
}

/**
 * 请求切换为视频
 */
fn.requestSwitchToVideo = function () {
  if (this.requestSwitchToVideoWaiting) return
  this.requestSwitchToVideoWaiting = true // 标志请求中的状态
  console.log('请求切换到视频通话')
  this.setDeviceVideoIn(true)
    .then(() => {
      this.startLocalStream()
    })
    .then(() => {
      // this.requestSwitchToVideoWaiting = true // 标志请求中的状态
      this.netcall.control({
        command: WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_AUDIO_TO_VIDEO
      })
      this.showConnectedUI(WebRTC.NETCALL_TYPE_VIDEO)
      this.updateVideoShowSize(true)
      this.dispatch(
        updateNetCall({
          remoteEmpty: true,
          remoteMessage: '正在等待对方开启摄像头'
        })
      )
    })
    .catch(() => {
      this.requestSwitchToVideoWaiting = false
    })
}

/**
 * 请求切换为音频
 */
fn.requestSwitchToAudio = function () {
  const { canSwitchToAudio } = this.getState()
  console.log('请求切换到音频流')
  if (!canSwitchToAudio) return
  this.netcall.control({
    command: WebRTC.NETCALL_CONTROL_COMMAND_SWITCH_VIDEO_TO_AUDIO
  })
  this.doSwitchToAudio()
}

/**
 * 切换到音频通话
 */
fn.doSwitchToAudio = function () {
  console.log('切换到音频通话')
  this.type = WebRTC.NETCALL_TYPE_AUDIO
  this.setDeviceVideoIn(false).then(() => {
    this.netcall.switchVideoToAudio()
    setTimeout(() => {
      this.stopLocalStream()
      this.stopRemoteStream()
    }, 100)
  })
  this.showConnectedUI(WebRTC.NETCALL_TYPE_AUDIO)
}

/**
 * 停止本地流显示
 */
fn.stopLocalStream = function () {
  console.log('停止本地流显示 stopLocalStream')
  try {
    this.netcall.stopLocalStream()
  } catch (e) {
    console.log('停止本地流失败', e)
  }
}

/**
 * 停止远端流显示
 */
fn.stopRemoteStream = function () {
  console.log('停止远端流显示 stopRemoteStream')
  try {
    this.netcall.stopRemoteStream()
  } catch (e) {
    console.log('停止远端流失败', e)
  }
}

/**
 * 开始本地流显示
 */
fn.startLocalStream = function (node) {
  node = node || this.getNode('netcall-video-local')
  console.log('开启本地流显示 startLocalStream')
  try {
    this.netcall.startLocalStream(node)
    this.setMiniViewStream()
    this.setSettingVideoView(node)
  } catch (e) {
    console.log('开启本地流失败', e)
  }
}

/**
 * 开始远端流显示
 */
fn.startRemoteStream = function (obj) {
  obj = obj || {}
  obj.node = obj.node || this.getNode('netcall-video-remote')
  console.log('开启远端流显示 startRemoteStream')
  try {
    this.netcall.startRemoteStream(obj)
  } catch (e) {
    console.log('开启远端流失败', e)
  }
}

/**
 * 设置mini模式下的视频流（单聊）
 */
fn.setMiniViewStream = function () {
  const miniModeVideo = this.getNode('mini-view-video')
  if (miniModeVideo) {
    const { localBigView } = this.getState()
    const id = localBigView ? 'netcall-video-local' : 'netcall-video-remote'
    const remoteVideo = this.findNode(id, 'video')
    if (remoteVideo) {
      miniModeVideo.srcObject = remoteVideo.srcObject
      const playPromise = miniModeVideo.play()
      if (playPromise) {
        playPromise.catch(() => {})
      }
    }
  }
}

/**
 * 获取单聊大屏的视频流
 * @return {*}
 */
fn.getP2pBigVideoObject = function () {
  const { localBigView } = this.getState()
  const id = localBigView ? 'netcall-video-local' : 'netcall-video-remote'
  const video = this.findNode(id, 'video')
  if (video) {
    return video.srcObject
  }
}

/** 同意音视频通话, 兼容多人音视频 */
fn.accept = function () {
  const { acceptWaiting } = this.getState()
  // 如果在接受等待的状态，忽略
  if (acceptWaiting || !this.beCalling) return

  const next = () => {
    this.dispatch(
      updateNetCall({
        acceptWaiting: true
      })
    )
    this.callAcceptedResponse()
  }

  // 发起通话选择UI
  this.checkRtcSupport().then(next, () => this.reject())
}

/** 同意通话的操作 */
fn.callAcceptedResponse = function () {
  console.log('同意对方音视频请求')

  this.beCalling = false
  this.clearBeCallTimer()
  this.clearWaitingCallTimer()

  // 检查声音是否支持自动播放
  checkAutoPlay()
    .then(() => {
      console.log('audio autoplay supported!')
    })
    .catch(() => {
      console.log('audio autoplay not supported!')
      this.startDeviceAudioOutLocal()
      this.startDeviceAudioOutChat()
    })

  // 群视频通话
  if (this.meetingCall.channelName) {
    // this.hideAllNetCallUI()
    // this.resetWhenHangup()
    this.meetingCallAccept()
    return
  }

  this.netcall
    .response({
      accepted: true,
      beCalledInfo: this.beCalledInfo,
      sessionConfig: this.sessionConfig
    })
    .then(() => {
      console.log('同意对方音视频请求成功')
      // 加个定时器 处理点击接听了 实际上对方杀进程了，没有callAccepted回调
      this.acceptAndWait = true
      setTimeout(() => {
        if (this.acceptAndWait) {
          console.log('通话建立过程超时')
          this.hangup()
          this.acceptAndWait = false
        }
      }, config.responseTimeout)
    })
    .catch((/* err */) => {
      console.log('同意对方音视频通话失败，转为拒绝')
      this.dispatch(
        updateNetCall({
          acceptWaiting: false
        })
      )
      this.reject()
    })
}

/** 拒绝音视频通话, 兼容多人音视频 */
fn.reject = function () {
  // 如果是多人视频通话
  if (this.meetingCall.channelName) {
    this.meetingCallReject()
    return
  }

  if (!this.beCalling) {
    this.hideAllNetCallUI()
    this.resetWhenHangup()
    return
  }

  this.clearBeCallTimer()
  console.log('拒绝对方音视频通话请求')

  this.netcall
    .response({
      accepted: false,
      beCalledInfo: this.beCalledInfo
    })
    .then(() => {
      console.log('拒绝对方音视频通话请求成功')
      const callType =
        this.type === window.WebRTC.NETCALL_TYPE_AUDIO
          ? '音频'
          : this.type === window.WebRTC.NETCALL_TYPE_VIDEO
          ? '视频'
          : ''
      this.sendLocalMessage(`你已拒绝本次${callType}通话`)
    })
    .catch((/* err */) => {
      // 自己断网了
      console.log('拒绝对方音视频通话请求失败')
    })
    .finally(() => {
      this.hideAllNetCallUI()
      this.resetWhenHangup()
    })
}

/**
 * 取消呼叫
 * @param {boolean} isAutoHangup 是否是超时自动挂断
 * @param {boolean} isBusy 是否忙线中
 */
fn.cancelCalling = function (isAutoHangup, isBusy) {
  if (isBusy) {
    this.sendLocalMessage('对方正在通话中')
  } else {
    this.sendLocalMessage(isAutoHangup ? '超时未接通' : '你已取消通话')
  }
  this.hangup()
}

/**
 * 聊天窗口添加本地消息
 * @param text {string} 发送的消息内容
 * @param to {string} 被发送者的accId
 */
fn.sendLocalMessage = function (text, to) {
  if (!to) to = this.netcallAccount
  setTimeout(() => {
    store.dispatch(
      sendMsg({
        type: 'text',
        scene: 'p2p',
        to,
        isLocal: true,
        text
      })
    )
  }, 100)
}

/**
 * 挂断通话过程
 * @param isHotDev {boolean} 是否是热更新开发模式
 */
fn.hangup = function (isHotDev) {
  if (!this.isActived()) {
    return Promise.resolve()
  }
  this.netcall.hangup()
  if (!isHotDev) {
    this.hideAllNetCallUI()
  }
  this.resetWhenHangup()
  return Promise.resolve()
  // this.setDeviceAudioIn(false)
  // this.setDeviceAudioOut(false)
  // this.setDeviceVideoIn(false)
  // this.stopRemoteStream()
  // this.stopLocalStream()
}

/**
 * 其它端已处理
 * @param obj {object}
 */
fn.onCallerAckSync = function (obj) {
  if (this.beCalledInfo && obj.channelId === this.beCalledInfo.channelId) {
    console.log('on caller ack async:', obj)
    this.hideAllNetCallUI()
    this.resetWhenHangup()
    this.sendLocalMessage('已在其它端处理')
    this.showTip('已在其它端处理', 'info')
  }
}

/**
 * 对方挂断通话过程(单人)
 * 1. 通话中挂断
 * 2. 请求通话中挂断
 * @param obj
 */
fn.onHangup = function (obj) {
  const close = () => {
    if (!this.isActived()) return
    this.netcall.hangup()
    this.hideAllNetCallUI()
    this.resetWhenHangup()
    this.showTip('对方已挂断', 'info')
    // this.setDeviceVideoIn(false)
    // this.setDeviceAudioIn(false)
    // this.setDeviceAudioOut(false)

    // if (this.netcallDurationTimer !== null) {
    //   this.sendLocalMessage(`通话拨打时长${this.getDurationText(this.netcallDuration)}`)
    // } else {
    //   this.sendLocalMessage('未接听', obj.account)
    // }
  }

  // 是否挂断当前通话
  if (obj.account && obj.account === this.netcallAccount) {
    return close()
  }

  if (this.meetingCall.channelName) {
    return console.log('挂断消息不属于当前群视频通话，忽略')
  }

  try {
    if (this.isActived() && this.netcall.notCurrentChannelId(obj)) {
      return console.log('挂断消息不属于当前活动通话，忽略1')
    }
  } catch (e) {
    console.warn(e)
  }

  if (!this.isActived() && this.beCalling && this.beCalledInfo.channelId !== obj.channelId) {
    return console.log('挂断消息不属于当前活动通话，忽略2')
  }

  if (!this.isActived() && !this.beCalling) {
    return console.log('挂断消息不属于当前活动通话，忽略3，当前无通话活动')
  }

  close()
}

fn.openChat = function (sessionId) {
  history.push(`/chat/board/${sessionId}`)
}

/**
 * 打开当前音视频通话对象的聊天窗口
 */
fn.doOpenChatBox = function () {
  // 群视频处理
  if (this.meetingCall.channelName) {
    this.openChat(`team-${this.meetingCall.teamId}`)
    return
  }
  const account = this.netcallAccount
  if (account) {
    this.openChat(`p2p-${account}`)
  }
}

/**
 * 音视频桌面消息通知
 * @param obj
 */
fn.netcallNotify = function (obj) {
  const { content = {}, type, account, from } = obj
  // 判断用户是否在当前页面
  if (!appWindow.isFocused()) {
    const getNotifyText = () => {
      if (type === MSG_TYPE.CUSTOM) {
        return `邀请你参与${content.meetingSubject || '视频会议'}`
      }
      if (type === WebRTC.NETCALL_TYPE_VIDEO) {
        return '请求与您视频通话'
      }
      if (type === WebRTC.NETCALL_TYPE_AUDIO) {
        return '请求与您语音通话'
      }
    }

    const notify = () => {
      imUtils.getUserByIdAsync(account || from).then(user => {
        imUtils.notification(
          {
            type: 'text',
            fromNick: user.nick,
            text: getNotifyText()
          },
          true
        )
      })
    }
    if (process.env.REACT_APP_ENV === 'electron') {
      const { ipcRenderer } = require('electron')
      ipcRenderer.send('ipcMain:onMsg')
      notify()
    } else {
      notify()
    }
  }
}

/** 被呼叫，兼容多人音视频
 * @param {object} obj 主叫信息
 */
fn.onBeCalling = function (obj) {
  // 如果是同一通呼叫，直接丢掉
  if (obj.channelId === this.channelId) return

  console.log('beCalling', obj)

  const { channelId, content, type, account /* , from */ } = obj
  const { netcall } = this
  const isMeeting = content && content.channelName

  // p2p场景，先通知对方自己收到音视频通知
  // if (!isMeeting) {
  //     netcall.control({
  //         channelId: channelId,
  //         command: WebRTC.NETCALL_CONTROL_COMMAND_START_NOTIFY_RECEIVED
  //     })
  // }

  // 自己正在通话或者被叫中, 告知对方忙并拒绝通话
  if (this.isActived()) {
    const option = { command: WebRTC.NETCALL_CONTROL_COMMAND_BUSY }
    if (!isMeeting) {
      option.channelId = channelId
    }

    // 通知呼叫方我方没空
    netcall.control(option)
    return
  }

  // 正常发起通话请求
  this.type = type
  this.channelId = channelId
  this.beCalling = true

  // team场景
  if (isMeeting) {
    this.netcallActive = true
    this.showBeCallingUI(content.callType, content)
    this.playRing('E')
    this.netcallNotify(obj)
    // 打开主窗口
    // imUtils.showMainWindow()
    return
  }

  /**
   * 考虑被呼叫时，呼叫方断网，被呼叫方不能收到hangup消息，因此设置一个超时时间
   * 在通话连接建立后，停掉这个计时器
   */
  this.beCallTimer = setTimeout(() => {
    if (!this.beCallTimer) return
    console.log('呼叫方可能已经掉线，挂断通话')
    this.beCallTimer = null
    this.reject()
  }, config.noAnswerTimeout)

  // p2p场景
  this.beCalledInfo = obj
  this.netcallActive = true
  this.netcallAccount = account
  // this.doOpenChatBox(account)
  this.showBeCallingUI(type)
  this.playRing('E')
  this.netcallNotify(obj)
  // 打开主窗口
  // imUtils.showMainWindow()
}

/**
 * 对方接受通话 或者 我方接受通话，都会触发(单聊)
 * @param obj {object}
 */
fn.onCallAccepted = function (obj) {
  const { channelId, type } = obj
  const { cameraDisabled, microphoneDisabled } = this.getState()

  this.channelId = channelId

  const changeState = () => {
    this.acceptAndWait = false
    this.type = type
    this.showConnectedUI(type)
    // 通话时长显示
    this.startDurationTimer()
    this.clearCallTimer()
    this.clearRingPlay()
  }

  changeState()

  // WebRTC模式
  if (this.isRtcSupported) {
    Promise.resolve()
      .then(() => {
        console.log('开始webrtc连接')
        return this.netcall.startRtc()
      })
      .then(() => {
        if (microphoneDisabled) {
          // 不开启麦克风
          // 通知对方自己关闭了麦克风
          this.netcall.control({
            command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_OFF
          })
          return Promise.resolve()
        }
        return this.setDeviceAudioIn(true)
      })
      .then(() => {
        if (cameraDisabled) {
          // 不开启摄像头
          // 通知对方自己关闭了摄像头
          this.netcall.control({
            command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_OFF
          })
          return Promise.resolve()
        }
        return this.setDeviceVideoIn(obj.type === WebRTC.NETCALL_TYPE_VIDEO)
      })
      .then(() => {
        console.log('webrtc连接成功')
      })
      .catch(e => {
        console.error('连接出错', e)
        if (/webrtc兼容开关/i.test(e)) {
          Modal.error({
            title: '提示信息',
            content: '无法接通!请让呼叫方打开"WebRTC兼容开关"，方可正常通话',
            okText: '知道了，挂断',
            maskClosable: false,
            zIndex: 1205,
            onOk: this.hangup.bind(this)
          })
        }
      })
  } else {
    changeState()
    if (obj.type === WebRTC.NETCALL_TYPE_VIDEO) {
      this.setDeviceAudioIn(true)
      this.setDeviceAudioOut(true)
      this.setDeviceVideoIn(true)
      this.netcall.startLocalStream()
      this.netcall.startRemoteStream()
      this.updateVideoShowSize(true, true)
    } else {
      this.setDeviceAudioIn(true)
      this.setDeviceAudioOut(true)
      this.setDeviceVideoIn(false)
    }
    // 设置采集和播放音量
    this.setCaptureVolume(this.captureVolume)
    this.setPlayVolume(this.playVolume)
  }
  // 关闭被呼叫倒计时
  this.beCallTimer = null
}

/**
 * 对方拒绝通话, 兼容多人音视频
 * 先判断是否是群视频，如果是群视频，交给群视频的脚本处理
 */
fn.onCallingRejected = function (/* obj */) {
  // const {
  //   session: { currSessionId }
  // } = store.getState().im
  // const { scene } = imUtils.parseSession(currSessionId)
  //
  // if (scene === 'team') {
  //   this.onMeetingCallRejected(obj)
  //   return
  // }
  this.hideAllNetCallUI()
  this.resetWhenHangup()
  this.showTip('对方已拒绝', 'warn')
  this.sendLocalMessage('对方已拒绝')
}

/**
 * 发起音视频呼叫
 * @param type {number} 呼叫类型
 * @param to {string} 呼叫对象account
 */
fn.doCalling = function (type, to) {
  // this.type = type
  this.netcallAccount = to
  this.netcallActive = true
  this.calling = true
  // 默认视频宽高
  this.videoCaptureSize = { ...this.defaultVideoCaptureSize.small }
  this.showCallingUI()
  this.afterPlayRingA = function () {}

  this.playRing('A', () => {
    if (this.afterPlayRingA) {
      this.afterPlayRingA()
    }
    this.afterPlayRingA = null
  })

  this.netcall
    .call({
      type,
      account: to,
      pushConfig: {
        enable: true,
        needBadge: true,
        needPushNick: true,
        // 持续呼叫，不管对方是否在线
        forceKeepCalling: true,
        pushContent: '',
        custom: '',
        pushPayload: '',
        sound: ''
      },
      sessionConfig: this.sessionConfig
    })
    .then((/* obj */) => {
      console.log('发起通话成功，等待对方接听')
      // 设置超时计时器
      this.callTimer = setTimeout(() => {
        if (!this.netcall.callAccepted) {
          this.cancelCalling(true)
        }
      }, config.callingTimeout)

      if (this.afterPlayRingA) {
        this.afterPlayRingA = () => {
          this.playRing('E')
        }
      } else {
        this.playRing('E')
      }
    })
    .catch(err => {
      console.error('发起音视频通话请求失败:', err)
      if (err) {
        if (err.code === 11000) {
          this.hangup()
          this.showTip('网络断开了，请检查网络连接。')
        }
        if (err.code === 11001) {
          const errCallback = () => {
            this.hangup()
            this.showTip('对方不在线')
          }
          if (this.afterPlayRingA) {
            this.afterPlayRingA = errCallback
          } else {
            errCallback()
          }
        }
      } else {
        this.hangup()
        this.showTip('发生未知错')
      }
    })
}

/**
 * UI消息提醒
 * @param msg 消息内容
 * @param type 消息类型
 * @return {MessageType}
 */
fn.showTip = function (msg, type = 'error') {
  if (type === 'error') {
    return message.error(msg)
  }
  if (type === 'info') {
    return message.info(msg)
  }
  if (type === 'warn') {
    return message.warning(msg)
  }
  if (type === 'sucess') {
    return message.sucess(msg)
  }
}

/**
 * 开启或关闭麦克风
 * @param enable {boolean} true开启，false关闭
 * @return {Promise<T>}
 */
fn.setDeviceAudioIn = function (enable) {
  this.dispatch(
    updateNetCall({
      microphoneDisabled: !enable,
      microphoneTitle: enable ? '关闭麦克风' : '开启麦克风'
    })
  )

  if (enable) {
    console.log('开启麦克风...')
    return this.netcall
      .startDevice({
        type: WebRTC.DEVICE_TYPE_AUDIO_IN,
        device: { deviceId: this.devices.currentAudioIn }
      })
      .then(() => {
        console.log('开启麦克风成功，通知对方我方开启了麦克风')
        // 通知对方自己开启了麦克风
        this.netcall.control({
          command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_ON
        })
        this.setCaptureVolume(this.captureVolume)
      })
      .catch(() => {
        console.error('开启麦克风失败')
        this.onDeviceNoUsable(WebRTC.DEVICE_TYPE_AUDIO_IN)
      })
  }
  console.log('关闭麦克风...')
  return this.netcall
    .stopDevice(WebRTC.DEVICE_TYPE_AUDIO_IN) // 关闭麦克风输入
    .then(() => {
      console.log('关闭麦克风成功，通知对方我方关闭了麦克风')
      // 通知对方自己关闭了麦克风
      this.netcall.control({
        command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_AUDIO_OFF
      })
    })
    .catch(() => {
      console.error('关闭麦克风失败')
    })
}

/**
 * 开启或关闭扬声器
 * @param enable {boolean} true开启，false关闭
 * @return {Promise<T>}
 */
fn.setDeviceAudioOut = function (enable) {
  this.dispatch(
    updateNetCall({
      volumeDisabled: !enable,
      volumeTitle: enable ? '关闭扬声器' : '开启扬声器'
    })
  )

  if (enable) {
    console.log('开启扬声器...')
    return this.netcall
      .startDevice({
        type: WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT,
        device: { deviceId: this.devices.currentAudioOut }
      })
      .then(() => {
        this.setPlayVolume(this.playVolume)
        console.log('开启扬声器成功')
      })
      .catch(() => {
        this.onDeviceNoUsable(WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT)
        console.error('开启扬声器失败')
      })
  }
  console.log('关闭扬声器...')
  return this.netcall
    .stopDevice(WebRTC.DEVICE_TYPE_AUDIO_OUT_CHAT)
    .then(() => {
      console.log('关闭扬声器成功')
    })
    .catch(() => {
      console.error('关闭扬声器失败')
    })
}

/**
 * 开启或关闭摄像头
 * @param enable {boolean} true开启，false关闭
 * @return {Promise<T>}
 */
fn.setDeviceVideoIn = function (enable) {
  this.dispatch(
    updateNetCall({
      cameraDisabled: !enable,
      cameraTitle: enable ? '关闭摄像头' : '开启摄像头'
    })
  )

  if (enable) {
    console.log('开启摄像头...')
    return this.netcall
      .startDevice({
        type: WebRTC.DEVICE_TYPE_VIDEO,
        device: { deviceId: this.devices.currentVideo }
        // width: this.videoCaptureSize.width,
        // height: this.videoCaptureSize.height
      })
      .then(() => {
        this.videoType = 'video'
        console.log('开启摄像头成功，通知对方己开启了摄像头')
        // 通知对方自己开启了摄像头
        this.netcall.control({
          command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_ON
        })

        this.dispatch(
          updateNetCall({
            localEmpty: false,
            localMessage: ''
          })
        )

        // 如果是群聊，转到多人脚本处理
        if (this.meetingCall.channelName) {
          this.updateDeviceStatus(WebRTC.DEVICE_TYPE_VIDEO, true, true)
          this.startLocalStreamMeeting()
          this.setVideoViewSize()
        } else {
          this.startLocalStream()
          this.updateVideoShowSize(true, false)
        }

        const { volumeNoDevice, volumeDisabled } = this.getState()
        if (!volumeNoDevice && volumeDisabled) {
          this.setDeviceAudioOut(false)
        }
      })
      .catch(err => {
        this.videoType = null
        // 通知对方自己的摄像头不可用
        console.error('开启摄像头失败，通知对方己方摄像头不可用', err)
        this.onDeviceNoUsable(WebRTC.DEVICE_TYPE_VIDEO)

        // 如果是群聊，转到多人脚本处理
        if (this.calling && this.meetingCall.channelName) {
          this.updateDeviceStatus(WebRTC.DEVICE_TYPE_VIDEO, true, false)
        }

        // 摄像头不可用
        this.dispatch(
          updateNetCall({
            localEmpty: true,
            localMessage: '摄像头不可用',
            cameraNoDevice: true,
            cameraDisabled: true,
            cameraTitle: '摄像头不可用'
          })
        )
      })
  }
  this.videoType = null
  console.log('关闭摄像头...')
  return this.netcall
    .stopDevice({ type: WebRTC.DEVICE_TYPE_VIDEO })
    .then(() => {
      // 通知对方自己关闭了摄像头
      console.log('关闭摄像头成功，通知对方我方关闭了摄像头')
      this.netcall.control({
        command: WebRTC.NETCALL_CONTROL_COMMAND_NOTIFY_VIDEO_OFF
      })

      this.dispatch(
        updateNetCall({
          localEmpty: true,
          localMessage: '您关闭了摄像头'
        })
      )

      // 如果是群聊，转到多人脚本处理
      if (this.calling && this.meetingCall.channelName) {
        this.updateDeviceStatus(WebRTC.DEVICE_TYPE_VIDEO, false, true)
      }
    })
    .catch(() => {
      this.videoType = null
      console.error('关闭摄像头失败')
    })
}

/**
 * 获取当前机主的视频流对象
 * @return {*}
 */
fn.setMyVideoView = function () {
  const { myAccount } = this.getState()
  let node = null
  if (this.netcall.channelName) {
    node = this.findAccountNode(myAccount)
  } else {
    node = this.getNode('netcall-video-local')
  }
  this.setSettingVideoView(node)
}

/**
 * 设置界面视频设置
 * @param node {DomObject} 存放video的父节点
 */
fn.setSettingVideoView = function (node) {
  const { settingVisible } = this.getState()
  if (!settingVisible) return
  if (node) {
    const video = node.querySelector('video')
    const settingVideo = this.getNode('netcall-setting-video')
    if (video && settingVideo) {
      settingVideo.srcObject = video.srcObject
      const playPromise = settingVideo.play()
      if (playPromise) {
        playPromise.catch(() => {})
      }
    }
  }
}

/**
 * 开启摄像头预览，主要用作呼叫界面的视频背景
 */
// fn.startCallingVideoPreview = function() {
//   return this.netcall
//     .startDevice({
//       type: WebRTC.DEVICE_TYPE_VIDEO
//       // device: { deviceId: this.devices.currentVideo }
//     })
//     .then(() => {
//       const previewDom = this.getNode('netcall-calling-videobg')
//       this.startLocalStream(previewDom)
//       this.netcall.setVideoViewSize({ width: 480, height: 300, cut: false })
//     })
//     .catch(err => {
//       console.warn('呼叫时摄像头预览开启失败', err)
//     })
// }

fn.startCallingVideoPreview = function () {
  return Promise.resolve()
  // return navigator.mediaDevices
  //   .getUserMedia({ video: true })
  //   .then(mediaStream => {
  //     const previewDom = this.getNode('netcall-calling-videobg')
  //     if (previewDom) {
  //       const video = document.createElement('video')
  //       video.style.cssText = 'position:absolute; left: 0; top: 0; width: 100%; height: 100%;'
  //       video.setAttribute('x-webkit-airplay', 'x-webkit-airplay')
  //       video.setAttribute('playsinline', 'playsinline')
  //       video.setAttribute('webkit-playsinline', 'webkit-playsinline')
  //       video.setAttribute('autoplay', 'autoplay')
  //       video.srcObject = mediaStream
  //       previewDom.appendChild(video)
  //       this.callingPreviewVideo = video
  //     }
  //     const [track] = mediaStream.getVideoTracks()
  //     this.callingPreviewTrack = track
  //   })
  //   .catch(err => {
  //     console.warn('呼叫时摄像头预览开启失败', err)
  //   })
}

/**
 * 关闭摄像头预览
 */
// fn.stopCallingVideoPreview = function() {
//   const { cameraDisabled } = this.getState()
//   if (cameraDisabled) {
//     return Promise.resolve()
//   }
//   return this.netcall
//     .stopDevice({
//       type: WebRTC.DEVICE_TYPE_VIDEO
//     })
//     .catch(e => {
//       console.warn(e)
//     })
// }

fn.stopCallingVideoPreview = function () {
  const { cameraDisabled } = this.getState()
  if (cameraDisabled) {
    return Promise.resolve()
  }
  const video = this.callingPreviewVideo
  const track = this.callingPreviewTrack
  if (video && track) {
    try {
      video.pause()
      track.stop()
      if (video.parentNode) {
        video.parentNode.removeChild(video)
      }
      this.callingPreviewTrack = null
      this.callingPreviewVideo = null
    } catch (e) {
      Promise.reject()
    }
  }
  return Promise.resolve()
}

/**
 * 清除主动呼叫计时器
 */
fn.clearCallTimer = function () {
  if (this.callTimer) {
    clearTimeout(this.callTimer)
    this.callTimer = null
  }
}

/**
 * 清除被呼叫计时器
 */
fn.clearBeCallTimer = function () {
  if (this.beCallTimer) {
    clearTimeout(this.beCallTimer)
    this.beCallTimer = null
  }
}

/**
 * 当用户进入或退出会议时播放声音提示
 */
fn.playRingWhenUserJoinOrLeave = function () {
  if (this.isPlayRingWhenJoinOrLeave) {
    imUtils.playNewMsgAudio()
  }
}

/**
 * 停止播放呼叫提示音
 */
fn.clearRingPlay = function () {
  if (this.playRingInstance) {
    this.playRingInstance.cancel()
  }
}

/**
 * 开始播放呼叫提示音
 */
fn.playRing = function (key, done) {
  this.playRingInstance = {}
  const nameMap = {
    A: { name: 'avchat_connecting', loop: 1 },
    B: { name: 'avchat_no_response', loop: 1 },
    C: { name: 'avchat_peer_busy', loop: 3 },
    D: { name: 'avchat_peer_reject', loop: 1 },
    E: { name: 'avchat_ring', loop: -1 }
  }

  const target = nameMap[key]
  if (!target) {
    throw new Error('playRing Error:未找到对应的音频文件')
  }
  const url = require(`@/assets/audio/${target.name}.mp3`)

  const doPlay = (url, playDone) => {
    let audio = document.createElement('audio')
    audio.autoplay = true

    const { loop } = target
    let playTimes = loop

    if (loop === -1) {
      audio.loop = true
    }

    const onEnded = () => {
      if (audio && loop > 1 && --playTimes > 0) {
        return audio.play()
      }
      this.playRingInstance.cancel()
      playDone()
    }

    audio.addEventListener('ended', onEnded)
    audio.src = url
    this.playRingInstance.cancel = () => {
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio = null
      this.playRingInstance = null
    }
  }

  doPlay(url, () => {
    this.playRingInstance = null
    if (typeof done === 'function') {
      done()
    }
  })
}

fn.getNode = function (id) {
  return document.getElementById(id)
}

fn.findNode = function (id, selector) {
  const node = this.getNode(id)
  if (node) {
    return node.querySelector(selector)
  }
}

fn.findAllNode = function (id, selector) {
  const node = this.getNode(id)
  if (node) {
    return node.querySelectorAll(selector)
  }
}

fn.log = function (...args) {
  const msg = [...args].join(' ')
  console.log(`%c${msg}`, 'color: green;font-size:16px;')
}

// 开始文档联动
fn.startSharing = function (fileId, close) {
  const me = this
  this.dispatch(
    updateNetCall({
      shareDoc: {
        isTeacher: true,
        sharing: true
      }
    })
  )
  checkSharingDocLock({
    fileId,
    channelId: this.meetingCall.channelName
  }).then(res => {
    if (res.canLinkage) {
      openNewCloudWindowCenter(`#/office/file?file=${fileId}&position=0`, imUtils.GUID())
      close()
    } else {
      message.error('抱歉该文档被锁定')
      me.dispatch(
        updateNetCall({
          shareDoc: {
            isTeacher: false,
            sharing: false
          }
        })
      )
    }
  })
}

// 去掉红点
fn.confirmJoinSharing = function () {
  this.dispatch(
    updateNetCall({
      shareDocRedPoint: false
    })
  )
}

// 收到联动开始通知 id 22
fn.sharingDoc = function (msg) {
  if (!this.isActived()) return
  const { content } = msg
  const { shareDoc } = this.getState()
  const { isTeacher } = shareDoc

  this.dispatch(
    updateNetCall({
      shareDoc: {
        sharing: true,
        isTeacher: isTeacher || false,
        inviter: content.teamMemberName,
        fileName: content.fileName,
        fileId: content.fileId
      },
      shareDocRedPoint: !shareDoc.isTeacher
    })
  )
  if (isTeacher) return
  let { fileName } = content
  if (fileName.length > 8) fileName = `${fileName.slice(0, 6)}..`
  Modal.confirm({
    title: '文档联动',
    zIndex: 1201,
    className: styles.shareDocModal,
    content: `${content.teamMemberName}正在发起文档 [${fileName}] 的联动`,
    onOk: () => {
      openNewCloudWindowCenter(`#/office/file?file=${content.fileId}&position=1`, content.fileId)
    },
    okText: '进入',
    mask: false,
    icon: <Icon name="ask" size="20px" />,
    centered: true
    // closeIcon: <Icon name="close" size="13px" color="#999" />
  })
}
// 清除联动信息
fn.clearSharingDoc = function () {
  this.dispatch(
    updateNetCall({
      shareDoc: {
        sharing: false,
        isTeacher: false,
        inviter: '',
        fileName: '',
        fileId: ''
      },
      shareDocRedPoint: false
    })
  )
}

Object.assign(NetcallBridge.prototype, NetCallUI.prototype, NetCallMeeting.prototype)
