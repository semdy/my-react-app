export function init() {
  if (process.env.NODE_ENV === 'production') {
    // 监听脚本执行错误
    window.onerror = function (msg, url, lineNo, columnNo, error) {
      console.warn({
        msg,
        url,
        lineNo,
        columnNo,
        error
      })
      return true
    }

    // 监听资源网络加载错误
    window.addEventListener(
      'error',
      event => {
        event.preventDefault()
        console.warn(event)
      },
      true
    )
  }

  // 监听Promise异常
  window.addEventListener('unhandledrejection', event => {
    event.preventDefault()
    console.warn('UNHANDLED PROMISE REJECTION:', event.reason)
  })
}
