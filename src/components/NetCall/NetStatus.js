import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import { useConnection } from '@/utils/hooks'
import { useNetStatus } from './hooks'

export default React.memo(() => {
  const netStatus = useNetStatus()
  const online = useConnection()
  const [quality, setQuality] = useState(undefined)
  const [statusText, setStatusText] = useState('')
  const [statusLevels] = useState([3, 2, 1, 0])

  useEffect(() => {
    const statusMap = {
      0: '信号非常好',
      1: '信号良好',
      2: '信号较弱',
      3: '信号非常弱',
      4: '网络已断开'
    }
    if (!online) {
      setQuality(4)
      setStatusText(statusMap[4])
    } else {
      setQuality(netStatus.quality)
      setStatusText(statusMap[netStatus.quality])
    }
  }, [netStatus.quality, online])

  return (
    quality !== undefined && (
      <div className="netcall-status">
        <span className="netcall-status-symbol">
          {statusLevels.map(level => (
            <b key={level} className={classNames({ active: level >= quality })} />
          ))}
        </span>
        <span className="netcall-status-desc">{statusText}</span>
      </div>
    )
  )
})
