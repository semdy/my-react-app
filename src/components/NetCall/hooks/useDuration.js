import { useEffect, useState } from 'react'
import durationManager from './DurationManager'

export default (channelName, startDuration) => {
  const [duration, setDuration] = useState(startDuration || 0)

  useEffect(() => {
    return durationManager.onDuration(channelName, duration => {
      setDuration(duration)
    })
  }, [channelName])

  return [duration]
}
