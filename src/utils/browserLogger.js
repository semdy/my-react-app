import BrowserLogger from 'alife-logger'

const initialLogger = () => {
  try {
    // eslint-disable-next-line no-underscore-dangle
    const __bl = BrowserLogger.singleton({
      pid: 'cmx1ckoh6t@db40b6f04f0af7a',
      enableSPA: true,
      sendResource: true
    })

    // eslint-disable-next-line no-underscore-dangle
    window.__bl = __bl
  } catch (e) {
    console.error('init logger fail', e)
  }
}

export default initialLogger
