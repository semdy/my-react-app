import { useEffect, useState } from 'react'
import durationManager from './DurationManager'

export default (channelName, startDurationText) => {
  const [durationText, setDurationText] = useState(startDurationText || '00 : 00')

  useEffect(() => {
    return durationManager.onDuration(channelName, (duration, durationText) => {
      setDurationText(durationText)
    })
  }, [channelName])

  return [durationText]
}
