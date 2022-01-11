#!/usr/bin/env node

const { spawn } = require('child_process')
const electron = require('electron')
const paths = require('../config/paths')

function open() {
  const mainPath = paths.appMainBundleJs
  const args = ['--inspect=5858'].concat([mainPath]).concat(process.argv.slice(2))
  const proc = spawn(electron, args, { stdio: 'inherit' })

  // proc.on('close', code => process.exit(code))
}

module.exports = {
  open
}
