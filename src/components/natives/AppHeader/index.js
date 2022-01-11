import { ipcRenderer } from 'electron'
import React, { useCallback, useState, useEffect } from 'react'
import { MinusOutlined, BorderOutlined, SwitcherOutlined, CloseOutlined } from '@ant-design/icons'
import './index.less'

// 最大最小化要变图标
function AppHeader() {
  const [maximize, setMaximize] = useState(false)

  const doClose = useCallback(() => {
    ipcRenderer.send('mainWindow:close')
  }, [])

  const doMinimize = useCallback(() => {
    ipcRenderer.send('mainWindow:minimize')
  }, [])

  const doRestore = useCallback(() => {
    ipcRenderer.send('mainWindow:restore')
  }, [])

  const doMaximize = useCallback(() => {
    ipcRenderer.send('mainWindow:maximize')
  }, [])

  const resize = useCallback(() => {
    if (!maximize) {
      doMaximize()
    } else {
      doRestore()
    }
  }, [doMaximize, doRestore, maximize])

  // maximize true 为最大化状态
  useEffect(() => {
    const maximizeHandler = () => {
      setMaximize(true)
    }
    const unMaximizeHandler = () => {
      setMaximize(false)
    }
    const unRestoreHandler = () => {
      setMaximize(false)
    }

    ipcRenderer.on('mainWindow:onMaximize', maximizeHandler)
    ipcRenderer.on('mainWindow:unmaximize', unMaximizeHandler)
    ipcRenderer.on('mainWindow:onRestore', unRestoreHandler)

    return () => {
      ipcRenderer.removeListener('mainWindow:onMaximize', maximizeHandler)
      ipcRenderer.removeListener('mainWindow:unmaximize', unMaximizeHandler)
      ipcRenderer.removeListener('mainWindow:onRestore', unRestoreHandler)
    }
  }, [])

  return (
    <div className="app-header">
      <div className="app-header-item grey" onClick={doMinimize}>
        <MinusOutlined />
      </div>
      <div className="app-header-item grey" onClick={resize}>
        {!maximize ? <BorderOutlined /> : <SwitcherOutlined />}
      </div>
      <div className="app-header-item red" onClick={doClose}>
        <CloseOutlined />
      </div>
    </div>
  )
}

export default React.memo(AppHeader)
