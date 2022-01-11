import { app, BrowserWindow } from 'electron'

export default imsdomApp => {
  if (imsdomApp.printWindow) {
    return imsdomApp.printWindow
  }

  const windowOptions = {
    show: false,
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  }

  const printWindow = new BrowserWindow(windowOptions)

  printWindow.on('close', e => {
    if (printWindow.forceQuit) {
      app.quit()
    } else {
      e.preventDefault()
      printWindow.hide()
    }
  })

  printWindow.webContents.on('did-finish-load', () => {
    printWindow.show()
    printWindow.focus()
    // printWindow.webContents.print({
    //   silent: false,
    //   printBackground: false,
    //   deviceName: ''
    // }, (data) => {
    //   console.log('printed', data)
    // })
  })

  return printWindow
}
