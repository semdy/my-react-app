import Events from 'events'
import { ipcMain, Notification } from 'electron'
import { getAssetsPath } from '../utils/getAssetsPath'

export default class Notify extends Events {
  notify = null

  logo = getAssetsPath('icon.png')

  constructor() {
    super()
    this.initEvents()
  }

  show(title, body) {
    this.close()

    this.notify = new Notification({
      title,
      body,
      icon: this.logo
    })
    this.notify.on('click', () => {
      this.close()
      this.emit('click')
    })
    this.notify.show()
  }

  close() {
    if (this.notify) {
      this.notify.close()
      this.notify = null
    }
  }

  initEvents() {
    ipcMain.on('ipcMain:notify', (e, title, body) => this.show(title, body))
  }
}
