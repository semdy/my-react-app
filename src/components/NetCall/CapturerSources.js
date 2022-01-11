import React, { useCallback, useEffect, useState } from 'react'
import Icon from '@/components/Icon'
import './CapturerSources.less'

const CapturerSources = React.memo(() => {
  const [capturerSources, setCapturerSources] = useState([])

  const handleCapture = useCallback(sourceId => {
    window.netcall.shareScreen(sourceId)
  }, [])

  const handleClose = useCallback(() => {
    window.netcall.closeCapturerSources()
  }, [])

  useEffect(() => {
    let timer = null
    let mounted = true
    const getSources = () => {
      return window.netcall.getCapturerSources().then(setCapturerSources)
    }
    const intervalRun = () => {
      getSources().then(() => {
        if (!mounted) return
        timer = setTimeout(intervalRun, 1000)
      })
    }

    intervalRun()

    return () => {
      if (timer) clearTimeout(timer)
      timer = null
      mounted = null
    }
  }, [])

  return (
    <div className="capturer-source-wrapper">
      <div className="capturer-source-title">选择要共享的窗口</div>
      <Icon name="close" className="capturer-source-close" onClick={handleClose} />
      <div className="capturer-source-list">
        {capturerSources.map(source => (
          <div className="capturer-source-item" key={source.id} title={source.name}>
            <div
              className="capturer-source-thumbnail"
              style={{ backgroundImage: `url(${source.thumbnail})` }}
              onClick={() => handleCapture(source.id)}
            >
              {source.appIcon && (
                <img src={source.appIcon} alt="" className="capturer-source-icon" />
              )}
            </div>
            <div className="capturer-source-name">{source.name}</div>
          </div>
        ))}
      </div>
      {capturerSources.length === 0 && <Icon name="spinner" className="capturer-source-loading" />}
    </div>
  )
})

export default CapturerSources
