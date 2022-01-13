const loaderMap = {
  styles: {},
  scripts: {}
}

export function importScript(url, forceLoad) {
  return new Promise((resolve, reject) => {
    if (loaderMap.scripts[url] && !forceLoad) {
      return resolve()
    }
    let script = document.createElement('script')
    script.charset = 'utf-8'
    script.onload = function () {
      loaderMap.scripts[url] = true
      resolve()
      script.onload = null
      script = null
    }

    script.onerror = function (e) {
      delete loaderMap.scripts[url]
      reject(e)
      script.onerror = null
      script = null
    }

    script.setAttribute('src', url)
    document.head.appendChild(script)
  })
}

export function importStyle(url, forceLoad) {
  return new Promise((resolve, reject) => {
    if (loaderMap.styles[url] && !forceLoad) {
      return resolve()
    }
    let link = document.createElement('link')
    link.setAttribute('rel', 'stylesheet')
    link.setAttribute('type', 'text/css')
    link.onload = function () {
      loaderMap.styles[url] = true
      resolve()
      link.onload = null
      link = null
    }

    link.onerror = function (e) {
      delete loaderMap.styles[url]
      reject(e)
      link.onerror = null
      link = null
    }

    link.setAttribute('href', url)
    document.head.appendChild(link)
  })
}

export function importScripts(urls, forceLoad) {
  if (!Array.isArray(urls)) {
    urls = [urls]
  }
  const loaders = urls.map(url => importScript(url, forceLoad))
  return Promise.all(loaders)
}

export function importStyles(urls, forceLoad) {
  if (!Array.isArray(urls)) {
    urls = [urls]
  }
  const loaders = urls.map(url => importStyle(url, forceLoad))
  return Promise.all(loaders)
}

export function writeStyles(rules) {
  document.head.appendChild(document.createTextNode(rules))
}
