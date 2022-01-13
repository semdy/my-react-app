export default (option, Dayjs) => {
  const proto = Dayjs.prototype
  const oldUtcOffset = proto.utcOffset
  proto.utcOffset = function(input, keepLocalTime) {
    if (typeof input === 'string') {
      const [h, m] = input.split(':')
      const hours = parseInt(h, 10)
      const minutes = parseInt(m, 10)
      const totalMinutes = hours * 60 + (hours < 0 ? -minutes : minutes)
      return oldUtcOffset.call(this, totalMinutes, keepLocalTime)
    }
    // eslint-disable-next-line prefer-rest-params
    return oldUtcOffset.apply(this, arguments)
  }
}
