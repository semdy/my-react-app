let dpr = 0
let scale = 0
let rem

export function refreshRem() {
  const docEl = document.documentElement
  let { width } = docEl.getBoundingClientRect()
  if (width / dpr > 540) {
    width = 540 * dpr
  }
  rem = width / 10
  docEl.style.fontSize = `${rem}px`
}

export function rem2px(d) {
  let val = (parseFloat(d) * rem) / scale
  if (typeof d === 'string' && d.match(/rem$/)) {
    val += 'px'
  }
  return val
}

export function px2rem(d) {
  if (!d) return d
  if (process.env.PX_TO_REM !== 'false') {
    let val = (parseFloat(d) / rem) * scale
    if (typeof d === 'number' || (typeof d === 'string' && d.match(/px$/))) {
      val += 'rem'
    }
    return val
  }
  return d
}

export function getDpr() {
  return dpr
}

export function getScale() {
  return scale
}

export function getRem() {
  return rem
}

export function getDevicePixelRatio() {
  return window.devicePixelRatio
}

export function init() {
  const isIPhone = navigator.userAgent.match(/iphone|ipad|ipod/gi)
  const devicePixelRatio = getDevicePixelRatio()

  if (isIPhone) {
    // iOS下，对于2和3的屏，用2倍的方案，其余的用1倍方案
    if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
      dpr = 3
    } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)) {
      dpr = 2
    } else {
      dpr = 1
    }
  } else {
    // 其他设备下，仍旧使用1倍的方案
    dpr = 1
  }

  scale = 1 / dpr

  document.documentElement.setAttribute('data-dpr', dpr)

  let tid
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(tid)
      tid = setTimeout(refreshRem, 300)
    },
    false
  )

  refreshRem()
}
