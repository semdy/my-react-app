export function getFormatFileType(fileName) {
  if (!fileName) return 'file'
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(fileName)) {
    return 'img'
  }
  if (/\.(doc|docx|dotx)$/i.test(fileName)) {
    return 'word'
  }
  if (/\.(ppt|pptx|pptm)$/i.test(fileName)) {
    return 'ppt'
  }
  if (/\.(pdf)$/i.test(fileName)) {
    return 'pdf'
  }
  if (/\.(xlsx|xlsm|xlsb|xltx|xls|xlt)$/i.test(fileName)) {
    return 'excel'
  }
  if (/(mov|mp4|ogg|webm)/i.test(fileName)) {
    return 'video'
  }
  if (/(mp3|flac|ape|m4a|wav)/i.test(fileName)) {
    return 'music'
  }
  if (/(rar|zip|7z|ISO|JAR|TAR|app)/i.test(fileName)) {
    return 'zip'
  }
  if (/(txt)/i.test(fileName)) {
    return 'txt'
  }
  return 'file'
}

export function isTypeOffice(fileType) {
  return /^(word|ppt|pdf|excel|txt)$/.test(fileType)
}

export function getFormatFileSize(fileSize) {
  if (!fileSize) return 0
  const num = 1024.0
  if (fileSize < num) return `${fileSize}B`
  if (fileSize < num * num) return `${(fileSize / num).toFixed(2)}KB`
  if (fileSize < num * num * num) return `${(fileSize / (num * num)).toFixed(2)}MB`
  if (fileSize < num * num * num * num) return `${(fileSize / (num * num * num)).toFixed(2)}GB`
}

export function getSurplusDate(_datetime) {
  const tempTime = new Date().getTime()
  const dateTime = new Date(_datetime)
  const surplusTime = dateTime - tempTime
  const surplusDay = surplusTime / (24 * 3600 * 1000)
  if (surplusDay < 1) return '1天' // '小于1天'
  return `${Math.round(surplusDay)}天`
}
