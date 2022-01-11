import Duration from './Duration'

class DurationManager {
  instances = {}

  callbacks = {}

  endCallbacks = {}

  durationPools = {}

  startDuration(keyName, startDurationText) {
    if (!keyName) {
      throw new Error('Duration keyName is required.')
    }
    if (Object.hasOwnProperty.call(this.instances, keyName)) {
      if (startDurationText) {
        this.instances[keyName].updateStartDuration(startDurationText)
      }
      return
    }
    this.instances[keyName] = new Duration(startDurationText)
    const duration = this.instances[keyName]

    duration.onTimer((duration, durationText) => {
      const callbacks = this.callbacks[keyName]
      if (callbacks) {
        callbacks.forEach(callback => {
          callback(duration, durationText)
        })
      }
    })

    duration.onEnd((duration, durationText) => {
      const callbacks = this.endCallbacks[keyName]
      if (callbacks) {
        callbacks.forEach(callback => {
          callback(duration, durationText)
        })
      }
    })

    duration.start()
  }

  stopDuration(keyName, actualDuration) {
    const instance = this.instances[keyName]
    if (instance) {
      instance.stop(actualDuration)
      delete this.instances[keyName]
      delete this.callbacks[keyName]
      delete this.endCallbacks[keyName]
    } else {
      this.durationPools[keyName] = actualDuration
    }
  }

  hasDurationPool(keyName) {
    return this.durationPools[keyName] !== undefined
  }

  getDurationPool(keyName) {
    return this.durationPools[keyName]
  }

  removeDurationPool(keyName) {
    delete this.durationPools[keyName]
  }

  onDuration(keyName, callback) {
    if (!Object.hasOwnProperty.call(this.callbacks, keyName)) {
      this.callbacks[keyName] = []
    }
    this.callbacks[keyName].push(callback)

    return () => {
      this.unDuration(keyName, callback)
    }
  }

  unDuration(keyName, callback) {
    const callbacks = this.callbacks[keyName]
    if (callbacks) {
      this.callbacks[keyName] = callbacks.filter(item => item !== callback)
    }
  }

  onEnd(keyName, callback) {
    if (!Object.hasOwnProperty.call(this.endCallbacks, keyName)) {
      this.endCallbacks[keyName] = []
    }
    this.endCallbacks[keyName].push(callback)
  }

  unEnd(keyName, callback) {
    const callbacks = this.endCallbacks[keyName]
    if (callbacks) {
      this.endCallbacks[keyName] = callbacks.filter(item => item !== callback)
    }
  }

  getDuration(keyName) {
    const instance = this.instances[keyName]
    if (instance) {
      return instance.duration
    }
    return 0
  }

  getDurationText(keyName) {
    const instance = this.instances[keyName]
    if (instance) {
      return instance.durationText
    }
    return '00 : 00'
  }

  reset() {
    const instanceKeys = Object.keys(this.instances)
    instanceKeys.forEach(key => {
      const instance = this.instances[key]
      instance.stop()
    })
    this.instances = {}
    this.callbacks = {}
    this.endCallbacks = {}
  }
}

export default new DurationManager()
