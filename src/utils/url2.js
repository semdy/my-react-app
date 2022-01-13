/* eslint-disable no-unused-vars */
// protocol://host[:port]path

/**
 * String -> RegExp -> Int -> [{startPos,result,endPos}]
 * @param {String} content - 待匹配字符串
 * @param {RegExp} schema - 匹配正则
 * @param {Int} loopLimit - 循环次数 默认为10
 */
function safeWalk(content, schema, loopLimit = 10) {
  let loopCount = 0
  let cursor = 0
  const resultsObjs = []
  while (loopCount < loopLimit) {
    const resultOfSchema = content.slice(cursor).match(schema)
    if (resultOfSchema) {
      const startPos = resultOfSchema.index + cursor
      const result = resultOfSchema[0]
      resultsObjs.push({ startPos, result })
      cursor = startPos + result.length
      loopCount++
    } else {
      break
    }
  }
  return resultsObjs
}

const protocolList = [
  'file',
  'ftp',
  'gopher',
  'http',
  'https',
  'mailto',
  'tel',
  'mms',
  'ed2k',
  'flashget',
  'thunder',
  'news',
  'tencent',
  'msnim'
]
// eslint-disable-next-line no-useless-escape
const schemaProtocol = new RegExp(`(?:${protocolList.join('|')}):\/\/`)
/**
 * String -> Bool -> Int -> [{startPos,result,endPos}]
 * @param {String} content - 分割过的content
 * @param {Bool} lowerCase - 是否不区分大小写匹配 content会转为小写
 * @param {Int} loopLimit - 循环上限 一次循环会拿出一个带协议头的字符串(如果有的话)
 *
 * result 是协议头
 * startPos是协议头位置
 * endPos是从协议头到下个协议头的开始或者content的句尾
 *
 */
function protocolSplit(content, lowerCase = true, loopLimit = 10) {
  /* 根据协议分割content */
  // 无错协议头
  // const schema = /(?:file|ftp|gopher|http|https|mailto|mms|ed2k|flashget|thunder|news|tencent|msnim):\/\//
  let contentShift // 转换后的content
  if (lowerCase) {
    contentShift = content.toLowerCase()
  } else {
    contentShift = content
  }
  const resultsObjs = safeWalk(contentShift, schemaProtocol, loopLimit)
  if (resultsObjs.length > 0) {
    resultsObjs.forEach(($, index) => {
      $.endPos = content.length
    })
  }
  return resultsObjs
  // const splitSentences = []
  // schemas.forEach($ => {
  //   splitSentences.push(content.slice($.startPos, $.endPos))
  // })
  // return splitSentences
}
function makeProtolcolSplit(resultsObjs, content) {
  const splitContents = []
  if (resultsObjs.length === 0) return [{ result: content, protocol: null }] // 如果协议头分割的返回是空数组 那么直接返回content 说明没有协议
  if (resultsObjs[0].startPos !== 0) {
    // 说明第一个协议头不在初始位置  www.baidu.comhttp://www.qq.com 协议头前也可能是脏字
    splitContents.push({ result: content.slice(0, resultsObjs[0].startPos), protocol: null })
  }
  resultsObjs.forEach($ => {
    splitContents.push({ result: content.slice($.startPos, $.endPos), protocol: $.result })
  })
  if (resultsObjs[resultsObjs.length - 1].endPos !== content.length) {
    splitContents.push({
      result: content.slice(resultsObjs[resultsObjs.length - 1]),
      protocol: null
    })
  }
  return splitContents
}

// const testURL = 'www.baidu.comhttp://www.baiduftp://asd.com'
// const testS = protocolSplit(testURL)
// console.log(makeProtolcolSplit(testS, testURL), '!!!')

// const chunks = value.split(/(?!\.)(?!:)(?!\/)(?!\?)(?!&)(?!#)(?!=)(?!%)(?!-)(?!_)(?!\+)\W/)
// eslint-disable-next-line quotes
const urlTail = "(?:\\/(?:[\\w!@#$%&\\*\\(\\)\\-_\\+=\\\\~:;',\\?\\.]+))+"
const urlPort = ':(?:[0-9])+'
const domainList = [
  'biz',
  'com',
  'edu',
  'gov',
  'info',
  'int',
  'mil',
  'name',
  'net',
  'org',
  'pro',
  'xyz',
  'aero',
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
  'cn'
]
const urlDomain = `(?:[\\w\\-]+?\\.)+(?:${domainList.join('|')})`
const urlDomainWeak = '(?:[\\w\\-]+?\\.)+(?:\\w+)'
// const schemaDomain = `${urlDomain}(?:${urlPort})?(?:${urlTail})?`
const schemaDomain = `${urlDomain}(?:${urlPort})?(?:${urlTail})?`
const schemaDomainWeak = `${urlDomainWeak}(?:${urlPort})?(?:${urlTail})?`
// 域名
/* 置信度较高的顶级域名
  .biz .com .edu .gov .info .int .mil .name .net .org .pro .xyz
  .aero .cat .coop .jobs .museum .travel .mobi .asia .tel .xxx
  .arpa .root .cn .top
*/
/**
 * String -> Int -> String -> [{startPos,result}]
 * @param {String} content
 * @param {Int} loopLimit
 * @param {String or null} protocol
 * result是不带协议头的疑似url
 */
function domainSplit(content, loopLimit = 10, protocol = null) {
  // const schema = new RegExp(`(?:\\w+?\\.)+(?:${domainList.join('|')})`)
  let resultsObjs
  if (protocol) {
    resultsObjs = safeWalk(content, schemaDomainWeak, loopLimit)
  } else {
    resultsObjs = safeWalk(content, schemaDomain, loopLimit)
  }
  return resultsObjs
}

// const testDomain = 'http://asd'
// console.log('input:', testDomain, domainSplit(testDomain), '域名分割')

// eslint-disable-next-line no-useless-escape
const commonSplit = /(?![\w!\@#$%&\*\(\)\-_\+=\\~:;',\?\.\/])\W|&nbsp;/
// const commonSplit = /(?![\w!@#$%&\*\(\)\-_\+=\\~:;',\?\.\/])\W/
const emailPattern = /^([a-zA-Z]|[0-9])(\w|-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/
/**
 *
 * @param {String} content - 输入文本
 * @param {Int} loopLimit - 提取分割提取最多次数
 */
export function extractUrl(content, loopLimit = 10) {
  const contentSplit = content.split(commonSplit) // 根据url中不会出现的字符分割
  const cleanData = contentSplit.filter(obj => obj && !emailPattern.test(obj)) // 过滤空 过滤邮箱
  /**
   * cleanData数据可能                                微信      飞书
   * 1. [http://www.baidu.com, http://www.qq.com]   可以区分   可以区分
   * 2. [http://www.baidu.comhttp://www.qq.com, ]   可以区分   不可区分
   * 3. [http://www.baidu.com, www.qq.com]          可以区分   可以区分
   * 4. [http://www.baidu.comwww.qq.com, ]          不可区分   不可区分    此项无法区分www.baidu.comwww可能是次级域名
   * 5. [working.word, asdf.zip, 1.2]               可以区分   可以区分
   */
  const URLs = [] // 储存真实url
  cleanData.forEach(data => {
    const resultsObjsOfProtocolSplit = makeProtolcolSplit(
      protocolSplit(data, true, loopLimit),
      data
    )
    resultsObjsOfProtocolSplit.forEach($ => {
      const urlObjs = domainSplit($.result, loopLimit, $.protocol)
      if (urlObjs.length > 0) {
        urlObjs.forEach(($$, index) => {
          if (index === 0 && $.protocol) {
            URLs.push($.protocol + $$.result)
          } else {
            URLs.push($$.result)
          }
        })
      }
    })
  })
  return URLs
}
