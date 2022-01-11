const path = require('path')
const { execSync } = require('child_process')
const fs = require('fs')
const paths = require('../../config/paths')
const { dependencies } = require(paths.appPackageJson)

const nodeModulesPath = path.join(__dirname, '..', '..', 'node_modules')

if (Object.keys(dependencies || {}).length > 0 && fs.existsSync(nodeModulesPath)) {
  const electronRebuildCmd =
    './node_modules/.bin/electron-rebuild --parallel --force --types prod,dev,optional --module-dir electron'
  const cmd =
    process.platform === 'win32' ? electronRebuildCmd.replace(/\//g, '\\') : electronRebuildCmd
  console.log(cmd)
  execSync(cmd, {
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'inherit'
  })
}
