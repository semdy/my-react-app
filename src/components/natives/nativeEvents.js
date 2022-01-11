import { ipcRenderer } from 'electron'
// import { message, Modal } from 'antd'
// import Config from '../../../package.json'
import { history } from '@/index'

const install = () => {
  // let updating
  // let downloading
  const handler = (e, payload) => {
    if (payload && payload.anchor) {
      history.push(`/setting/${payload.anchor}`)
    } else {
      history.push('/setting')
    }
  }

  // const StartUpdate = () => {
  //   updating = message.loading('解压资源包', 0)
  // }
  // const EndUpdate = () => {
  //   if (updating) updating()
  //   message.info('更新完毕')
  // }
  //
  // const StartDownload = () => {
  //   downloading = message.loading('下载资源包', 0)
  // }
  // const EndDownload = () => {
  //   if (downloading) downloading()
  // }
  //
  // fetch(`https://192.168.3.115:8001/checkupdate?version=${Config.version}&reversion=${Config.reversion}` )
  //   .then(res=>res.json())
  //   .then(res=>{
  //     if(res.forceUpdate){
  //       Modal.confirm({
  //         content: '检测到新版本 强更 文案',
  //         keyboard: false,
  //         maskClosable: false,
  //         autoFocusButton: true,
  //         cancelButtonProps: {disabled: true, style:{display: 'none'}},
  //         onOk: () => ipcRenderer.send('ipcMain:Update')
  //       })
  //       return
  //       // ipcRenderer.send('ipcMain:Update')
  //     }
  //     if(res.newVersion){
  //       Modal.confirm({
  //         content:'检测到新版本 非强更 文案',
  //         autoFocusButton: true,
  //         keyboard: true,
  //         maskClosable: true,
  //         onOk: () => ipcRenderer.send('ipcMain:Update')
  //       })
  //       // ipcRenderer.send('ipcMain:Update')
  //     }
  //   })

  ipcRenderer.on('JumpSetting', handler)
  ipcRenderer.on('JumpAboutIMSDOM', handler)
  // ipcRenderer.on('console', console.log)
  // ipcRenderer.on('StartUpdate', StartUpdate)
  // ipcRenderer.on('EndUpdate', EndUpdate)
  // ipcRenderer.on('StartDownload', StartDownload)
  // ipcRenderer.on('EndDownload', EndDownload)

  return () => {
    ipcRenderer.removeListener('JumpSetting', handler)
    ipcRenderer.removeListener('JumpAboutIMSDOM', handler)
    // ipcRenderer.removeAllListeners('console', console.log)
  }
}

export default install
