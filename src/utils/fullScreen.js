/*
1.document下没有requestFullscreen
2.requestFullscreen方法只能由用户触发，比如：在onload事件中不能触发
3.页面跳转需先退出全屏
4.进入全屏的元素，将脱离其父元素，所以可能导致之前某些css的失效
解决方案：使用 :fullscreen伪类 为元素添加全屏时的样式（使用时为了兼容注意添加-webkit、-moz或-ms前缀）
5.一个元素A全屏后，其子元素要再全屏，需先让元素A退出全屏
*/

export function requestFullscreen(el) {
  if (!el) {
    el = document.body
  }
  if (el.requestFullscreen) {
    return el.requestFullscreen()
  }
  if (el.mozRequestFullScreen) {
    return el.mozRequestFullScreen()
  }
  if (el.webkitRequestFullscreen) {
    return el.webkitRequestFullscreen()
  }
  if (el.msRequestFullscreen) {
    return el.msRequestFullscreen()
  }
}

export function exitFullScreen() {
  if (document.exitFullScreen) {
    return document.exitFullScreen()
  }
  if (document.mozCancelFullScreen) {
    return document.mozCancelFullScreen()
  }
  if (document.webkitExitFullscreen) {
    return document.webkitExitFullscreen()
  }
  if (document.msExitFullscreen) {
    return document.msExitFullscreen()
  }
}

export function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullScreenElement ||
    document.webkitFullscreenElement ||
    null
  )
}

export function isFullScreen() {
  return !!(
    document.fullscreen ||
    document.mozFullScreen ||
    document.webkitIsFullScreen ||
    document.webkitFullScreen ||
    document.msFullScreen
  )
}

export function isFullscreenEnabled() {
  return (
    document.fullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.msFullscreenEnabled
  )
}
