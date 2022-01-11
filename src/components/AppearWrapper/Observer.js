// eslint-disable-next-line
import 'intersection-observer'

class Observer {
  observeDisabled = false

  init(options) {
    const self = this
    if (options.disabled !== undefined) {
      this.setDisabled(options.disabled)
    }
    function intersectionObserverCallback(entries) {
      entries.forEach(entry => {
        if (self.observeDisabled) return
        const el = entry.target
        if (entry.isIntersecting && !el.appeared) {
          el.appeared = true
          const appearEvent = new CustomEvent('appear', {
            detail: entry
          })
          el.dispatchEvent(appearEvent)
        } else if (el.appeared) {
          delete el.appeared
          const disappearEvent = new CustomEvent('disappear', { detail: entry })
          el.dispatchEvent(disappearEvent)
        }
      })
    }
    this.intersectionObserver = new IntersectionObserver(intersectionObserverCallback, options)
  }

  setDisabled(bool) {
    this.observeDisabled = bool
  }

  observe(el) {
    if (!(el instanceof Element)) {
      return
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(el)
    }
  }

  unobserve(el) {
    if (!(el instanceof Element)) {
      return
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(el)
    }
  }

  takeRecords() {
    if (this.intersectionObserver) {
      return this.intersectionObserver.takeRecords()
    }
    return []
  }

  disconnect() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
  }

  destroy() {
    this.disconnect()
    this.intersectionObserver = null
  }
}

export default Observer
