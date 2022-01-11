import WinReg from 'winreg'

const startOnBoot = {
  enableAutoStart(name, file, callback) {
    const key = getKey()
    key.set(name, WinReg.REG_SZ, file, callback || noop)
  },
  disableAutoStart(name, callback) {
    const key = getKey()
    key.remove(name, callback || noop)
  },
  getAutoStartValue(name, callback) {
    const key = getKey()
    key.get(name, (error, result) => {
      if (result) {
        callback(result.value)
      } else {
        callback(null, error)
      }
    })
  }
}

function noop() {}

const RUN_LOCATION = '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'

function getKey() {
  return new WinReg({
    hive: WinReg.HKCU, // CurrentUser,
    key: RUN_LOCATION
  })
}

function autoStart(enable) {
  // 只支持windows平台
  if (process.platform !== 'win32') return
  startOnBoot.getAutoStartValue('MY_CLIENT_AUTOSTART', value => {
    if (!value && enable) {
      startOnBoot.enableAutoStart('MY_CLIENT_AUTOSTART', process.execPath, () => {
        console.log('auto start on boot...')
      })
    }
    if (value && !enable) {
      startOnBoot.disableAutoStart('MY_CLIENT_AUTOSTART', () => {
        console.log('disabled auto start on boot...')
      })
    }
  })
}

export default autoStart
