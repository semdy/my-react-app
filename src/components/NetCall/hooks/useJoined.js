import { useEffect, useState } from 'react'

export default (channelName, caller) => {
  const [isJoined, setJoined] = useState(false)

  useEffect(() => {
    if (caller) {
      if (window.netcall) {
        const isInMeeting = window.netcall.isInMeeting(caller)
        setJoined(isInMeeting)
      }
    }

    const handler = ({ detail }) => {
      if (channelName === detail.channelName) {
        setJoined(detail.joined)
      }
    }

    window.addEventListener('netcall:meetingJoined', handler, false)

    return () => {
      window.removeEventListener('netcall:meetingJoined', handler, false)
    }
  }, [caller, channelName])

  return [isJoined]
}
