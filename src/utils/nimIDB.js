export function storeToNimIDB(msg) {
  return new Promise((resolve, reject) => {
    const { nimIDB } = window
    if (!nimIDB) {
      return reject(new Error('nimIDB is not defined.'))
    }
    const request = nimIDB.transaction(['msg1'], 'readwrite').objectStore('msg1').add(msg)

    request.onsuccess = function (event) {
      resolve(event)
    }

    request.onerror = function (event) {
      reject(event)
    }
  })
}

export function batchStoreToNimIDB(msgs) {
  return Promise.all(msgs.map(msg => storeToNimIDB(msg))).catch(console.error)
}
