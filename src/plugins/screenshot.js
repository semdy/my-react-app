import React from 'react'
import { Modal } from 'antd'
import ModalConfirmIcon from '@/components/ModalConfirmIcon'
import { openWindowInNewTab } from '@/utils/space'

// const bag = { down: false, downCount: 0, shotting: false }

// const release = () => {
//   // 双击截图后释放   右键取消释放
//   setTimeout(() => {
//     window.oncontextmenu = null
//   }, 100)
//   bag.downCount = 0
//   bag.onlymove = false
//   bag.moved = false
//   bag.maskMove = false
//   bag.down = false
//   bag.mask.setAttribute('class', '')
//   try {
//     if (bag.mask) document.body.removeChild(bag.mask)
//     if (bag.canvas) document.getElementById('root').removeChild(bag.canvas)
//   } catch (e) {
//     console.log(e)
//   }
//   bag.mask = null
//   bag.canvas = null
//   bag.shotting = false
// }

// const transformMask = () => {
//   if (bag.tmpx0 && bag.tmpx1 && bag.onlymove) {
//     bag.left += bag.shiftX
//     bag.right -= bag.shiftX
//     bag.top += bag.shiftY
//     bag.bottom -= bag.shiftY
//     bag.mask.setAttribute(
//       'style',
//       `width:${bag.width}px;
//         height:${bag.height}px;
//         position:absolute;
//         left:0;
//         top:0;
//         z-index:999;
//         border-left:${bag.left + bag.shiftX}px solid rgba(0,0,0,0.2);
//         border-top:${bag.top + bag.shiftY}px solid rgba(0,0,0,0.2);
//         border-bottom:${bag.bottom - bag.shiftY}px solid rgba(0,0,0,0.2);
//         border-right:${bag.right - bag.shiftX}px solid rgba(0,0,0,0.2);
//         `
//     )
//     return
//   }
//   if (bag.tmpx0 && bag.tmpx1 && !bag.maskMove) {
//     // 截图
//     ;[bag.left, bag.right] = [bag.tmpx0, bag.tmpx1]
//     if (bag.tmpx0 > bag.tmpx1) [bag.left, bag.right] = [bag.right, bag.left]
//     bag.right = bag.width - bag.right
//     ;[bag.top, bag.bottom] = [bag.tmpy0, bag.tmpy1]
//     if (bag.tmpy0 > bag.tmpy1) [bag.bottom, bag.top] = [bag.top, bag.bottom]
//     bag.bottom = bag.height - bag.bottom
//     bag.mask.setAttribute(
//       'style',
//       `width:${bag.width}px;
//         height:${bag.height}px;
//         position:absolute;
//         left:0;
//         top:0;
//         z-index:999;
//         border-left:${bag.left}px solid rgba(0,0,0,0.2);
//         border-top:${bag.top}px solid rgba(0,0,0,0.2);
//         border-bottom:${bag.bottom}px solid rgba(0,0,0,0.2);
//         border-right:${bag.right}px solid rgba(0,0,0,0.2);
//         `
//     )
//   }
// }

// const wrapAction = mask => {
//   // 屏蔽右键菜单
//   mask.addEventListener('mousedown', e => {
//     if (e.which === 3) {
//       if (bag.canvas) release()
//       return
//     }
//     if (e.which === 1) {
//       bag.tmpx0 = e.pageX
//       bag.tmpy0 = e.pageY
//       bag.down = true // 左键按下
//       bag.moved = false // 重置是否移动
//       bag.downCount += 1
//       setTimeout(() => {
//         bag.downCount = 0
//       }, 300)
//       if (bag.downCount === 2) {
//         const imageCtn = document.createElement('canvas')
//         const ctx = imageCtn.getContext('2d')
//         const imageWidth = bag.width - bag.left - bag.right
//         const imageHeight = bag.height - bag.top - bag.bottom
//         imageCtn.width = imageWidth
//         imageCtn.height = imageHeight
//         ctx.drawImage(
//           bag.canvas,
//           bag.left,
//           bag.top,
//           imageWidth,
//           imageHeight,
//           0,
//           0,
//           imageWidth,
//           imageHeight
//         )
//         // console.log(imageCtn.toDataURL('image/png', 0.5))
//         const img = document.createElement('img')
//         img.setAttribute('src', imageCtn.toDataURL('image/png', 0.5))
//         img.setAttribute('style', 'max-height:180px;max-width:180px;')
//         try {
//           const editor = document.getElementsByClassName('w-e-text')[0]
//           editor.children[0].appendChild(img)
//           // eslint-disable-next-line no-empty
//         } catch (e) {}
//         release()
//       }
//     }
//   })

//   mask.addEventListener('mouseup', e => {
//     if (e.which === 1) {
//       bag.tmpx1 = e.pageX
//       bag.tmpy1 = e.pageY
//       bag.down = false // 左键弹起
//       if (bag.moved) {
//         bag.downCount = 0 // 重置左键次数
//         bag.mask.setAttribute('class', 'screenshot-move')
//         bag.onlymove = true
//       }
//     }
//   })

//   mask.addEventListener('mousemove', e => {
//     if (bag.down && !bag.onlymove) {
//       bag.tmpx1 = e.pageX
//       bag.tmpy1 = e.pageY
//       bag.moved = true
//       transformMask()
//     }
//     if (bag.down && bag.onlymove) {
//       bag.shiftX = e.pageX - bag.tmpx0
//       bag.shiftY = e.pageY - bag.tmpy0
//       bag.tmpx0 = e.pageX
//       bag.tmpy0 = e.pageY
//       transformMask()
//     }
//   })
// }

const scHandleShot = () => {
  if (process.env.REACT_APP_ENV === 'electron') {
    // const childProcess = require('child_process')
    // if (process.platform === 'win32') {
    //   childProcess.execFile('./resources/plugins/screenshot-win/ss-win32.exe')
    //   return
    // }
    // if (process.platform === 'darwin') {
    //   let executePath
    //   if (process.env.NODE_ENV === 'development') {
    //     const { app } = require('electron').remote
    //     const path = require('path')
    //     executePath = path.join(
    //       app.getAppPath(),
    //       '../resources/plugins/screenshot-mac/imsdom-screenshot.app'
    //     )
    //   } else {
    //     executePath = `${process.resourcesPath.replace(
    //       ' ',
    //       '\\ '
    //     )}/plugins/screenshot-mac/imsdom-screenshot.app`
    //   }
    //   childProcess.exec(`open ${executePath}`)
    //   return
    // }
    const { ipcRenderer } = require('electron')
    ipcRenderer.send('ipcMain:execScreenShot')
    return
  }
  Modal.confirm({
    title: '下载客户端',
    content: '该功能Web端暂不支持，请前往官网下载客户端。',
    okText: '前往下载',
    cancelText: '取消',
    centered: true,
    maskClosable: true,
    icon: <ModalConfirmIcon />,
    onOk() {
      openWindowInNewTab('https://www.imsdom.com/downloads/')
    }
  })
  // bag.time = new Date()
  // if (bag.shotting) {
  //   return
  // }
  // bag.shotting = true
  // const root = document.getElementById('root')
  // bag.mask = document.createElement('div')
  // bag.width = document.body.clientWidth
  // bag.height = document.body.clientHeight
  // wrapAction(bag.mask)
  // bag.mask.setAttribute('id', 'screenshot-mask')
  // bag.mask.setAttribute(
  //   'style',
  //   `width:${bag.width}px;
  //       height:${bag.height}px;
  //       position:absolute;
  //       left:0;
  //       top:0;
  //       z-index:999;
  //       border-left:${bag.width / 2}px solid rgba(0,0,0,0.2);
  //       border-top:${bag.height / 2}px solid rgba(0,0,0,0.2);
  //       border-bottom:${bag.height / 2}px solid rgba(0,0,0,0.2);
  //       border-right:${bag.width / 2}px solid rgba(0,0,0,0.2);
  //       `
  // )
  // document.body.appendChild(bag.mask)
  // window.oncontextmenu = function(e) {
  //   e.preventDefault()
  //   return false
  // }

  // // const imgs = root.querySelectorAll('img')
  // // imgs.forEach(img => {
  // //   img.setAttribute('crossorigin', 'anonymous') // 跨域解决
  // //   img.src += '?123' // 防止旧缓存
  // // })

  // import(/* webpackPrefetch: true */ 'html2canvas').then(chunk => {
  //   chunk
  //     .default(root, {
  //       // useCORS: true,
  //       // allowTaint: false,
  //       // taintTest: false,
  //       // backgroundColor: null,
  //       imageTimeout: 1,
  //       ignoreElements: ele => {
  //         if (ele.tagName === 'IMG' || ele.tagName === 'svg') {
  //           return true
  //         }
  //       }
  //     })
  //     .then(canvas => {
  //       // 截图触发
  //       bag.canvas = canvas
  //       bag.width = canvas.width
  //       bag.height = canvas.height
  //       // bag.mask = document.createElement('div')
  //       // wrapAction(bag.mask)
  //       // bag.mask.setAttribute('id', 'screenshot-mask')
  //       // bag.mask.setAttribute(
  //       //   'style',
  //       //   `width:${canvas.width}px;
  //       //     height:${canvas.height}px;
  //       //     position:absolute;
  //       //     left:0;
  //       //     top:0;
  //       //     z-index:999;
  //       //     border-left:${bag.width / 2}px solid rgba(0,0,0,0.2);
  //       //     border-top:${bag.height / 2}px solid rgba(0,0,0,0.2);
  //       //     border-bottom:${bag.height / 2}px solid rgba(0,0,0,0.2);
  //       //     border-right:${bag.width / 2}px solid rgba(0,0,0,0.2);
  //       //     `
  //       // )
  //       // document.body.appendChild(bag.mask)
  //       canvas.setAttribute('class', 'screenshot-canvas')
  //       const root = document.getElementById('root')
  //       root.appendChild(canvas)
  //       console.log(new Date() - bag.time)
  //     })
  // })
}

// export const install = () => {
//   const handler = e => {
//     const settingHotKey = localStorage.getItem('ims_screenShot_hotKey') || 'Alt+A'
//     const [letterKey, ...fnKeys] = settingHotKey.toLowerCase().split('+').reverse()
//     const keyPressFnKeys = []
//     if (e.altKey) {
//       keyPressFnKeys.push('alt')
//     }
//     if (e.shiftKey) {
//       keyPressFnKeys.push('shift')
//     }
//     if (e.ctrlKey) {
//       keyPressFnKeys.push('ctrl')
//     }
//     if (
//       e.key &&
//       e.key.toLowerCase() === letterKey &&
//       fnKeys.sort().join('') === keyPressFnKeys.sort().join('')
//     ) {
//       e.preventDefault()
//       scHandleShot()
//     }
//   }
//
//   window.addEventListener('keydown', handler, false)
//
//   return () => {
//     window.removeEventListener('keydown', handler, false)
//   }
// }

export const install = () => {
  if (process.env.REACT_APP_ENV === 'electron') {
    const { ipcRenderer } = require('electron')
    ipcRenderer.send('ipcMain:bindScreenShot', true)
  }

  return () => {
    if (process.env.REACT_APP_ENV === 'electron') {
      const { ipcRenderer } = require('electron')
      ipcRenderer.send('ipcMain:bindScreenShot', false)
    }
  }
}

export default scHandleShot
