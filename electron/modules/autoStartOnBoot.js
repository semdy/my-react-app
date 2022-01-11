import { app } from 'electron'

export function setAutoStartOnBoot(enable) {
  if (enable) {
    app.setLoginItemSettings({
      openAtLogin: true
    })
  } else {
    app.setLoginItemSettings({
      openAtLogin: false
    })
  }
}

export function getAutoStartOnBoot() {
  return app.getLoginItemSettings().openAtLogin
}
