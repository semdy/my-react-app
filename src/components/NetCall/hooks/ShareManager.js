class ShareManager {
  pools = {}

  addItem(keyName, account) {
    if (!keyName) {
      throw new Error('Share keyName is required.')
    }
    if (!Object.hasOwnProperty.call(this.pools, keyName)) {
      this.pools[keyName] = []
    }
    this.pools[keyName].push(account)
  }

  addItems(keyName, accounts) {
    if (!keyName) {
      throw new Error('Share keyName is required.')
    }
    if (!Object.hasOwnProperty.call(this.pools, keyName)) {
      this.pools[keyName] = []
    }
    this.pools[keyName] = this.pools[keyName].concat(accounts)
  }

  getItem(keyName) {
    return this.pools[keyName] || []
  }

  hasItem(keyName, account) {
    return this.getItem(keyName).some(item => item === account)
  }

  removeItem(keyName, account) {
    const list = this.pools[keyName]
    if (!list) {
      return
    }
    this.pools[keyName] = list.filter(item => item !== account)
  }

  clear(keyName) {
    if (keyName) {
      delete this.pools[keyName]
      return
    }
    this.pools = {}
  }
}

export default new ShareManager()
