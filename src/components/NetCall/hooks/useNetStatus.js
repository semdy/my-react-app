import { useEffect, useState } from 'react'

export default () => {
  const [status, setStatus] = useState({})

  useEffect(() => {
    const handler = event => {
      setStatus(event.detail)
    }

    window.addEventListener('netcallNetStatus', handler, false)

    return () => {
      window.removeEventListener('netcallNetStatus', handler, false)
    }
  }, [])

  return status
}
