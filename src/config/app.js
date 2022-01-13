function getOperationSys() {
  const { userAgent, platform } = window.navigator
  if (platform === 'Win32' || platform === 'Windows') {
    return 'Windows'
  }
  if (
    platform === 'Mac68K' ||
    platform === 'MacPPC' ||
    platform === 'Macintosh' ||
    platform === 'MacIntel'
  ) {
    return 'Mac'
  }
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'ios'
  }
  if (userAgent.indexOf('Android') > -1) {
    return 'Android'
  }
  if (userAgent.indexOf('Linux') > -1 || platform.indexOf('Linux') > -1) {
    return 'Linux'
  }
  return 'Unknown OS'
}

let softwareId = 'com.imsdom.'
const appOrigin = 'imsdom.com'
const versionId = window.imsdom.version
const languageList = [
  { shortHand: 'zh', selectName: '简体中文' },
  { shortHand: 'en', selectName: 'English' },
  { shortHand: 'jp', selectName: '日语' }
]
let softwareEnv = 'web'
if (process.env.REACT_APP_ENV === 'electron') {
  const osName = getOperationSys().toLowerCase()
  const isOSWin64 = process.arch === 'x64' || process.arch === 'arm64'
  softwareEnv = osName + (isOSWin64 ? '64' : '32')
}

softwareId += softwareEnv

export default {
  softwareId,
  versionId,
  appOrigin,
  languageList
}
