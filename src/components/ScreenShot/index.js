import React, { useState, useCallback, useEffect } from 'react'
import html2canvas from 'html2canvas'
// import Canvg from 'canvg'
// import a from './canvas2image'
import './index.less'
import event from './event'

function ScreenShot() {
  const [canvas, setCanvas] = useState('')
  const bag = { down: false, downCount: 0, shotting: false }
  const release = useCallback(() => {
    // 双击截图后释放   右键取消释放
    setTimeout(() => {
      window.oncontextmenu = null
    }, 100)
    bag.downCount = 0
    bag.onlymove = false
    bag.moved = false
    bag.maskMove = false
    bag.down = false
    bag.mask.setAttribute('class', '')
    try {
      if (bag.mask) document.body.removeChild(bag.mask)
      if (bag.canvas) document.getElementById('root').removeChild(bag.canvas)
    } catch (e) {
      console.log(e)
    }
    bag.mask = null
    bag.canvas = null
    bag.shotting = false
  }, [bag])

  const transformMask = useCallback(() => {
    if (bag.tmpx0 && bag.tmpx1 && bag.onlymove) {
      bag.left += bag.shiftX
      bag.right -= bag.shiftX
      bag.top += bag.shiftY
      bag.bottom -= bag.shiftY
      bag.mask.setAttribute(
        'style',
        `width:${bag.width}px;
        height:${bag.height}px;
        position:absolute;
        left:0;
        top:0;
        z-index:999;
        border-left:${bag.left + bag.shiftX}px solid rgba(0,0,0,0.2);
        border-top:${bag.top + bag.shiftY}px solid rgba(0,0,0,0.2);
        border-bottom:${bag.bottom - bag.shiftY}px solid rgba(0,0,0,0.2);
        border-right:${bag.right - bag.shiftX}px solid rgba(0,0,0,0.2);
        `
      )
      return
    }
    if (bag.tmpx0 && bag.tmpx1 && !bag.maskMove) {
      // 截图
      ;[bag.left, bag.right] = [bag.tmpx0, bag.tmpx1]
      if (bag.tmpx0 > bag.tmpx1) [bag.left, bag.right] = [bag.right, bag.left]
      bag.right = bag.width - bag.right
      ;[bag.top, bag.bottom] = [bag.tmpy0, bag.tmpy1]
      if (bag.tmpy0 > bag.tmpy1) [bag.bottom, bag.top] = [bag.top, bag.bottom]
      bag.bottom = bag.height - bag.bottom
      bag.mask.setAttribute(
        'style',
        `width:${bag.width}px;
        height:${bag.height}px;
        position:absolute;
        left:0;
        top:0;
        z-index:999;
        border-left:${bag.left}px solid rgba(0,0,0,0.2);
        border-top:${bag.top}px solid rgba(0,0,0,0.2);
        border-bottom:${bag.bottom}px solid rgba(0,0,0,0.2);
        border-right:${bag.right}px solid rgba(0,0,0,0.2);
        `
      )
    }
  }, [bag])
  const wrapAction = useCallback(
    mask => {
      // 屏蔽右键菜单
      mask.addEventListener('mousedown', e => {
        if (e.which === 3) {
          // 解除屏蔽右键菜单
          // setTimeout(() => {
          //   window.oncontextmenu = null
          // }, 100)
          // bag.downCount = 0
          // bag.onlymove = false
          // bag.moved = false
          // bag.maskMove = false
          // bag.down = false
          // bag.mask.setAttribute('class', '')
          // document.body.removeChild(bag.mask)
          // document.getElementById('root').removeChild(bag.canvas)
          // bag.shotting = false
          release()
          return
        }
        if (e.which === 1) {
          bag.tmpx0 = e.pageX
          bag.tmpy0 = e.pageY
          bag.down = true // 左键按下
          bag.moved = false // 重置是否移动
          bag.downCount += 1
          setTimeout(() => {
            bag.downCount = 0
          }, 300)
          if (bag.downCount === 2) {
            const imageCtn = document.createElement('canvas')
            const ctx = imageCtn.getContext('2d')
            const imageWidth = bag.width - bag.left - bag.right
            const imageHeight = bag.height - bag.top - bag.bottom
            imageCtn.width = imageWidth
            imageCtn.height = imageHeight
            ctx.drawImage(
              bag.canvas,
              bag.left,
              bag.top,
              imageWidth,
              imageHeight,
              0,
              0,
              imageWidth,
              imageHeight
            )
            // console.log(imageCtn.toDataURL('image/png', 0.5))
            release()
            // console.log('confirm')
          }
        }
      })
      mask.addEventListener('mouseup', e => {
        if (e.which === 1) {
          bag.tmpx1 = e.pageX
          bag.tmpy1 = e.pageY
          bag.down = false // 左键弹起
          if (bag.moved) {
            bag.downCount = 0 // 重置左键次数
            bag.mask.setAttribute('class', 'screenshot-move')
            bag.onlymove = true
          }
          // if (bag.onlymove) {
          //   bag.left = bag.left + bag.shiftX
          //   bag.right = bag.right - bag.shiftX
          //   bag.top = bag.top + bag.shiftY
          //   bag.bottom = bag.bottom - bag.shiftY
          // }
        }
      })
      mask.addEventListener('mousemove', e => {
        if (bag.down && !bag.onlymove) {
          bag.tmpx1 = e.pageX
          bag.tmpy1 = e.pageY
          bag.moved = true
          transformMask()
        }
        if (bag.down && bag.onlymove) {
          bag.shiftX = e.pageX - bag.tmpx0
          bag.shiftY = e.pageY - bag.tmpy0
          bag.tmpx0 = e.pageX
          bag.tmpy0 = e.pageY
          transformMask()
        }
      })
    },
    [release, bag, transformMask]
  )
  const handleShot = useCallback(() => {
    bag.time = new Date()
    // console.log(bag.shotting)
    if (bag.shotting) {
      return
    }
    bag.shotting = true
    const root = document.getElementById('root')
    // console.log(document.body.clientWidth, document.body.clientHeight)

    // const imgs = root.querySelectorAll('img')
    // imgs.forEach(img => {
    // img.setAttribute('crossorigin', 'anonymous') // 跨域解决
    // img.src += '?123' // 防止旧缓存
    // })

    // const nodesToRecover = []
    // const nodesToRemove = []
    // var svgElem = root.find('svg');
    // const svgElem = root.querySelectorAll('svg[viewBox]')
    // const svgElem = root.querySelectorAll('use')
    // svgElem.forEach(async function(node) {
    //   const { parentNode } = node
    //   console.log(node, '!!!!')
    //   const svg = node.outerHTML.trim()
    //   console.log(svg)
    //   const canvas = document.createElement('canvas')
    //   const ctx = canvas.getContext('2d')
    //   const s = await Canvg.from(ctx, svg)
    //   s.start()
    //   console.log('??')
    //   if (node.style.position) {
    //     canvas.style.position += node.style.position
    //     canvas.style.left += node.style.left
    //     canvas.style.top += node.style.top
    //   }
    //   nodesToRecover.push({
    //     parent: parentNode,
    //     child: node
    //   })
    //   parentNode.removeChild(node)
    //   nodesToRemove.push({
    //     parent: parentNode,
    //     child: canvas
    //   })
    //   parentNode.appendChild(canvas)
    // })

    html2canvas(root, {
      // useCORS: true,
      // allowTaint: false,
      // taintTest: false,
      // backgroundColor: null,
      imageTimeout: 10
    }).then(canvas => {
      // 截图触发
      window.oncontextmenu = function (e) {
        e.preventDefault()
      }
      // console.log('render done')
      // console.log(canvas.width, canvas.height)
      bag.canvas = canvas
      bag.width = canvas.width
      bag.height = canvas.height
      bag.mask = document.createElement('div')
      wrapAction(bag.mask)
      bag.mask.setAttribute('id', 'screenshot-mask')
      bag.mask.setAttribute(
        'style',
        `width:${canvas.width}px;
        height:${canvas.height}px;
        position:absolute;
        left:0;
        top:0;
        z-index:999;
        border-left:${bag.width / 2}px solid rgba(0,0,0,0.2);
        border-top:${bag.height / 2}px solid rgba(0,0,0,0.2);
        border-bottom:${bag.height / 2}px solid rgba(0,0,0,0.2);
        border-right:${bag.width / 2}px solid rgba(0,0,0,0.2);
        `
      )
      document.body.appendChild(bag.mask)
      setCanvas(canvas)
      // console.log(a.convertToJPEG(canvas))
    })
  }, [bag, wrapAction])

  useEffect(() => {
    event.on('screenshot', handleShot)
    window.addEventListener('keydown', e => {
      if (e.key === 'a' && e.altKey) {
        handleShot()
      }
    })
  })

  if (canvas) {
    canvas.setAttribute('class', 'screenshot-canvas')
    const root = document.getElementById('root')
    root.appendChild(canvas)
  }
  return null
}

export default React.memo(ScreenShot)
