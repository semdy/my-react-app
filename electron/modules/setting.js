import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import merge from 'lodash/merge'

/**
 * 初始化设置选项
 */
export const initSetting = imsdomApp => {
  const filename = path.join(app.getPath('userData'), 'setting.json')
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-bitwise
    fs.access(filename, fs.constants.R_OK | fs.constants.W_OK, async err => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve(await imsdomApp.writeSetting())
        }
        return reject(err)
      }
      resolve(await imsdomApp.readSetting())
    })
  })
}

/**
 * 从文件中读取设置信息
 */
export const readSetting = imsdomApp => {
  const filename = path.join(app.getPath('userData'), 'setting.json')
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) return reject(err)
      try {
        const setting = JSON.parse(data)
        Object.keys(setting.keymap || {}).forEach(shortCut => {
          if (Array.isArray(setting.keymap[shortCut])) {
            setting.keymap[shortCut] = setting.keymap[shortCut].join('+')
          }
        })
        resolve(merge(imsdomApp.setting, setting))
      } catch (e) {
        resolve(imsdomApp.setting)
      }
    })
  })
}

/**
 * 写入设置到文件
 */
export const writeSetting = imsdomApp => {
  const filename = path.join(app.getPath('userData'), 'setting.json')
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(imsdomApp.setting, null, 2), err => {
      if (err) return reject(err)
      resolve(imsdomApp.setting)
    })
  })
}
