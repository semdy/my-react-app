import { htmlDecode } from '@/utils/utils'

export const protocolList = ['http', 'https', 'ws', 'wss']
export const schemaList = [
  'imsdomapp',
  'thunder',
  'news',
  'tencent',
  'file',
  'ftp',
  'gopher',
  'mms',
  'ed2k',
  'flashget',
  'msnim'
]
export const domainList = [
  'biz',
  'com',
  'edu',
  'gov',
  'info',
  'int',
  'mil',
  'name',
  'dev',
  'net',
  'org',
  'me',
  'do',
  'io',
  'im',
  'pro',
  'xyz',
  'aero',
  'design',
  'cat',
  'coop',
  'jobs',
  'museum',
  'travel',
  'mobi',
  'asia',
  'tel',
  'xxx',
  'arpa',
  'root',
  'cn',
  'cc',
  'tw',
  'hk',
  'mo',
  'jp',
  'kr',
  'us',
  'ca',
  'au',
  'uk',
  'ua',
  'th',
  'de',
  'fr',
  'su',
  'sg',
  'se',
  'my',
  'pt',
  'pl',
  'ph',
  'pk'
]

// url提取正则
// const urlReg = new RegExp(
//   `(?:((?:${protocolList.join(
//     '|'
//   )}):\\/\\/)|www|(mailto:)|(tel:))?[\\w/\\-?=%@.]+\\.(?:${domainList.join(
//     '|'
//   )})([#\\w/\\-?+=&%@:.]+)?`
// )

export const urlReg = new RegExp(
  `((?:((?:${protocolList.join(
    '|'
  )}):\\/\\/)|www|(mailto:))?([\\w/\\-?=%@.]+\\.(?:${domainList.join(
    '|'
  )})|((2[0-4]\\d|25[0-5]|[01]?\\d\\d?)\\.){3}(2[0-4]\\d|25[0-5]|[01]?\\d\\d?))([#\\w/\\-?+=&%@:.]+)?)|((?:${schemaList.join(
    '|'
  )})://([\\w/\\-?=%@.]+)?)|(tel:[-\\d]+)`,
  'g'
)

export const emailReg = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/

export function extractUrl(text) {
  if (!urlReg.test(text)) return []
  return htmlDecode(text)
    .replace(urlReg, matched => `%%${matched}%%`)
    .split(/%%;?/)
    .filter(item => Boolean(item.replace(/\n|\s|<br(\s*\/)?>|&nbsp;/g, '')))
    .map(item => item.replace(/&nbsp;?$/, ''))
}

export function buildUrlLink(url) {
  if (!url || url.startsWith('http')) return url
  if (url.split('.').length === 2) {
    url = `www.${url}`
  }
  return `http://${url}`
}
