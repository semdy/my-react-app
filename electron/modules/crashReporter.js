import fs from 'fs'
import { crashReporter } from 'electron'
import { getPackageJSON } from '../utils/getAssetsPath'

const reporter = {
  init() {
    // let envPrefix
    let env
    if (process.env.REACT_APP_RUN_ENV === 'release') {
      // envPrefix = ''
      env = 'production'
    } else if (process.env.REACT_APP_RUN_ENV === 'stage') {
      // envPrefix = 'stage-'
      env = 'staging'
    } else if (process.env.REACT_APP_RUN_ENV === 'test') {
      // envPrefix = 'test-'
      env = 'testing'
    } else {
      // envPrefix = 'dev-'
      env = 'develop'
    }
    const serverUrl = 'https://crash-report-api.imsdom.com'
    const data = fs.readFileSync(getPackageJSON(), 'utf8')
    const { version } = JSON.parse(data)
    crashReporter.start({ submitURL: `${serverUrl}/crash`, globalExtra: { env, version } })
  }
}

export default reporter
