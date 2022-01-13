/**
 * @file 用于在渲染应用前获取serverUrl
 * @author wuchao
 */
import React from 'react'
import { message, Modal } from 'antd'
import appConfig from '@/config/app'
import { getCurrentLang } from '@/locales'

const makeRequest = (url, data) => {
  return fetch(url, {
    body: JSON.stringify(data),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      lang: getCurrentLang()
    },
    method: 'POST'
  }).then(response => response.json())
}

const makeParams = () => {
  const { pipeline, branch } = window.imsdom.ci
  // eslint-disable-next-line
  let { versionId, softwareId } = appConfig
  let env = branch
  if (branch === '#CI_COMMIT_REF_NAME@#ENV_SUFFIX') {
    if (process.env.REACT_APP_RUN_ENV === 'release') {
      env = `release/${versionId}@production`
    } else if (process.env.REACT_APP_RUN_ENV === 'stage') {
      env = `release/${versionId}@staging`
    } else if (process.env.REACT_APP_RUN_ENV === 'test') {
      env = `release/${versionId}@testing`
    } else {
      env = 'develop@develop'
    }
    window.imsdom.ci.branch = env
  }
  return {
    versionId,
    softwareId,
    env,
    pipeline
  }
}

// const updateWebVersion = (online = 0) => {
//   return new Promise(resolve => {
//     if (window.native) {
//       resolve()
//       return
//     }
//     const local = window.imsdom.ci.pipeline
//     if (local === '#CI_PIPELINE_ID') {
//       resolve()
//       return
//     }
//     if (Number(local) >= Number(online)) {
//       resolve()
//       return
//     }
//     const lastPipeline = localStorage.getItem('lastPipeline')
//     if (Number(lastPipeline) >= Number(online)) {
//       resolve()
//       return
//     }
//     localStorage.setItem('lastPipeline', online)
//     caches
//       .keys()
//       .then(cacheNames => {
//         cacheNames.forEach(cacheName => {
//           caches.delete(cacheName)
//         })
//         window.location.reload(true)
//       })
//       .catch(() => resolve())
//   })
// }

const getServerInfo = () => {
  return new Promise(resolve => {
    const reqUrl = 'https://i-api.imsdom.com/version/info'
    // const reqUrl = 'http://106.14.44.227:6016/version/info'
    const params = makeParams()
    makeRequest(reqUrl, params)
      .then(res => {
        const { code, data, msg } = res
        const { serverUrl, serverTips, isForce } = data || {}
        if (code === 0 && serverUrl) {
          // updateWebVersion(pipeline).then(() => {
          localStorage.setItem('serverUrl', serverUrl)
          resolve(JSON.parse(serverUrl))
          // })
        } else {
          const cachedServerUrl = localStorage.getItem('serverUrl')
          if (!cachedServerUrl) {
            localStorage.setItem('serverUrl', '{}')
          }
          resolve(cachedServerUrl || {})
          message.error(msg || '服务配置信息获取出错！', 8)
        }
        if (serverTips) {
          localStorage.setItem('ims_versionTips', serverTips)
        }
        if (process.env.REACT_APP_ENV === 'electron') {
          if (isForce && isForce === 1) {
            const UploadVersionIndicator = require('@/components/UploadVersionIndicator').default
            const modal = Modal.warn({
              title: '版本更新提示',
              content: <UploadVersionIndicator onComplete={() => modal.destroy()} />,
              className: 'UploadVersionIndicator',
              keyboard: false,
              maskClosable: false
            })
          }
        }
      })
      .catch(() => {
        const cachedServerUrl = localStorage.getItem('serverUrl')
        if (!cachedServerUrl) {
          localStorage.setItem('serverUrl', '{}')
        }
        resolve(cachedServerUrl || {})
        message.error('服务配置信息获取失败，请检查网络连接。', 8)
      })
  })
}

export default getServerInfo
