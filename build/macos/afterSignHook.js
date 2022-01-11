const fs = require('fs')
const path = require('path')
const electronNotarize = require('electron-notarize')

module.exports = async function (params) {
  // Only notarize the app on Mac OS only.
  if (process.platform !== 'darwin') {
    return
  }

  // Skip notarize if target MacStore.
  if (params.electronPlatformName === 'mas') {
    console.log('Notarization skipped as target MAS')
    return
  }

  console.log('afterSign hook triggered', params)

  // Same appId in electron-builder.
  // eslint-disable-next-line no-underscore-dangle
  const appId = params.packager.appInfo.info._metadata.name
  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)

  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`)
  }

  console.log(`Notarizing ${appId} found at ${appPath}`)

  try {
    await electronNotarize.notarize({
      appBundleId: appId,
      appPath,
      // appleId: process.env.appleId,
      // appleIdPassword: process.env.appleIdPassword
      appleId: 'yangjing@imsdom.com',
      appleIdPassword: 'ggdc-mlms-cbwl-sdhm'
    })
  } catch (error) {
    console.error(error)
  }

  console.log(`Done notarizing ${appId}`)
}
