import path from 'path'
import { app } from 'electron'

const isEnvProduction = process.env.NODE_ENV === 'production'

export function getAssetsPath(pathName) {
  return path.join(app.getAppPath(), isEnvProduction ? './resources' : '../resources', pathName)
}

export function getPackageJSON() {
  return path.join(app.getAppPath(), isEnvProduction ? './' : '../', 'package.json')
}

/**
 * 没有消息时的托盘图标
 */
export function getNoMessageTrayIcon() {
  return getAssetsPath(process.platform === 'win32' ? 'tray/icon.ico' : 'tray/icon.png')
}

export function getNoMessageDarkTrayIcon() {
  return getAssetsPath('tray/icon-dark.png')
}

/**
 * 有消息时的托盘图标
 */
export function getMessageTrayIcon() {
  return getAssetsPath('tray/icon2.ico')
}
