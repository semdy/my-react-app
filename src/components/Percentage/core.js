const defaultOptions = {
  borderWidth: 1,
  baseColor: '#fff',
  borderColor: '#b4c7e7',
  color: '#4472c4',
  radius: 30,
  percent: 0,
  type: 'sector',
  withAnimation: true
}

// function CircEaseInOut(p) {
//   return ((p*=2) < 1) ? -0.5 * (Math.sqrt(1 - p * p) - 1) : 0.5 * (Math.sqrt(1 - (p -= 2) * p) + 1);
// }

function Linear(t) {
  return t
}

const Tween = function(target, toAttrs, duration, ease, onUpdate, callback) {
  const startTime = Date.now()
  let reqId
  const originAttrs = Object.assign({}, target)

  function run() {
    reqId = requestAnimationFrame(run)
    let percent = (Date.now() - startTime) / duration
    if (percent >= 1) percent = 1

    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const i in toAttrs) {
      target[i] = originAttrs[i] + (toAttrs[i] - originAttrs[i]) * (ease || Linear)(percent)
    }

    onUpdate(percent)

    if (percent === 1) {
      cancelAnimationFrame(reqId)
      if (callback) callback()
    }
  }

  run()
}

const Percentage = function(canvas, options = {}) {
  this.context = canvas.getContext('2d')
  this.options = Object.assign({}, defaultOptions, options)

  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const i in this.options) {
    Object.defineProperty(this, i, {
      set(newValue) {
        if (this.options[i] !== newValue) {
          if (i === 'percent' && this.options.withAnimation) {
            Tween(this.options, { percent: newValue }, 600, Linear, this.render.bind(this))
          } else {
            this.options[i] = newValue
            this.render()
          }
        }
      }
    })
  }

  this.render()
}

Percentage.prototype = {
  render() {
    const { context } = this
    const { borderWidth, radius, type, baseColor, borderColor, color, percent } = this.options
    const width = radius * 2 + borderWidth
    const height = width

    context.clearRect(0, 0, width, height)

    context.lineWidth = borderWidth
    context.beginPath()
    context.fillStyle = baseColor
    context.strokeStyle = borderColor
    context.arc(radius, radius, radius - borderWidth, 0, 2 * Math.PI, false)
    context.fill()
    if (borderWidth > 0) {
      context.stroke()
    }

    context.save()
    context.beginPath()
    if (type === 'sector') {
      context.fillStyle = color
      context.moveTo(radius, radius)
    } else {
      context.strokeStyle = color
      context.lineCap = 'round'
    }
    context.translate((width - borderWidth) / 2, (height - borderWidth) / 2)
    context.rotate((-90 * Math.PI) / 180)
    context.arc(0, 0, radius - borderWidth, 0, 2 * Math.PI * percent, false)
    context.translate(-(width - borderWidth) / 2, -(height - borderWidth) / 2)
    if (type === 'sector') {
      context.fill()
    } else if (borderWidth > 0) {
      context.stroke()
    }
    context.restore()
  }
}

export default Percentage
