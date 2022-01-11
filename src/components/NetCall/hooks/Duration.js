import { getDurationText, getDuration } from './utils'

class Duration {
  constructor(startDuration) {
    this.reset()
    if (startDuration) {
      this.startDuration = getDuration(startDuration)
    }
  }

  start() {
    const timer = () => {
      this.duration = this.duration + this.startDuration + 1000
      this.durationText = getDurationText(this.duration)
      this.timerCallback(this.duration, this.durationText)
    }

    this.clear()
    this.timer = setInterval(timer, 1000)
    timer()
  }

  updateStartDuration(duration) {
    if (this.updated) return
    this.duration = getDuration(duration)
    this.startDuration = 0
    this.updated = true
  }

  onTimer(callback) {
    this.timerCallback = callback
  }

  onEnd(callback) {
    this.endCallback = callback
  }

  clear() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  reset() {
    this.duration = 0
    this.durationText = '00 : 00'
    this.startDuration = 0
    this.timer = null
    this.updated = false
    this.timerCallback = () => {}
    this.endCallback = () => {}
  }

  stop(actualDuration) {
    this.clear()
    if (actualDuration) {
      this.duration = actualDuration
      this.durationText = getDurationText(actualDuration)
    }
    this.endCallback(this.duration, this.durationText)
    this.reset()
  }
}

export default Duration
