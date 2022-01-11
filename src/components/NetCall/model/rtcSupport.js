// 验证当前浏览器是否支持webrtc
// created by @HenrikJoreteg
let prefix
let version

if (window.mozRTCPeerConnection || navigator.mozGetUserMedia) {
  prefix = 'moz'
  version = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10)
} else if (window.webkitRTCPeerConnection || navigator.webkitGetUserMedia) {
  prefix = 'webkit'
  version =
    navigator.userAgent.match(/Chrom(e|ium)/) &&
    parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10)
}

const PC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
const IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate
const SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription
const MediaStream = window.webkitMediaStream || window.MediaStream
const screenSharing =
  window.location.protocol === 'https:' &&
  ((prefix === 'webkit' && version >= 26) || (prefix === 'moz' && version >= 33))
const AudioContext = window.AudioContext || window.webkitAudioContext
const AudioDestination =
  AudioContext &&
  new AudioContext().createMediaStreamSource &&
  new AudioContext().createMediaStreamDestination
const videoEl = document.createElement('video')
const supportVp8 =
  videoEl &&
  videoEl.canPlayType &&
  videoEl.canPlayType('video/webm codecs="vp8", vorbis') === 'probably'
const getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.msGetUserMedia ||
  navigator.mozGetUserMedia

// export support flags and constructors.prototype && PC
const rtcSupport = {
  prefix,
  browserVersion: version,
  support: !!PC && !!getUserMedia,
  // new support style
  supportRTCPeerConnection: !!PC,
  supportVp8,
  supportGetUserMedia: !!getUserMedia,
  supportDataChannel: !!(PC && PC.prototype && PC.prototype.createDataChannel),
  supportWebAudio: !!(
    AudioContext &&
    AudioContext.prototype.createMediaStreamSource &&
    AudioDestination
  ),
  supportMediaStream: !!(MediaStream && MediaStream.prototype.removeTrack),
  supportScreenSharing: !!screenSharing,
  // constructors
  AudioContext,
  PeerConnection: PC,
  SessionDescription,
  IceCandidate,
  MediaStream,
  getUserMedia
}

export default rtcSupport
