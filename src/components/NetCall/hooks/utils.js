export function getDurationText(ms) {
  const allSeconds = parseInt(ms / 1000, 10)
  let result = ''
  let hours
  let minutes
  let seconds
  if (allSeconds >= 3600) {
    hours = parseInt(allSeconds / 3600, 10)
    result += `${`00${hours}`.slice(-2)} : `
  }
  if (allSeconds >= 60) {
    minutes = parseInt((allSeconds % 3600) / 60, 10)
    result += `${`00${minutes}`.slice(-2)} : `
  } else {
    result += '00 : '
  }
  // eslint-disable-next-line prefer-const
  seconds = parseInt((allSeconds % 3600) % 60, 10)
  result += `00${seconds}`.slice(-2)
  return result
}

export function getDuration(durationText) {
  if (typeof durationText === 'number') {
    return durationText
  }
  if (typeof durationText === 'string') {
    const timeStack = durationText.replace(/\s+/g, '').split(':')
    return timeStack.reverse().reduce((prev, cur, index) => {
      // eslint-disable-next-line no-restricted-properties
      return prev + parseInt(cur, 10) * Math.pow(60, index) * 1000
    }, 0)
  }
  return 0
}
