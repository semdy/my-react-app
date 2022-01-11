const { extract, compile } = require('@formatjs/cli')
const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

const tmpFilePath = path.resolve(__dirname, '../tmp.json')

function extractFiles() {
  console.log(chalk.hex('#008000')('intl extract start...'))
  const files = glob.sync('src/**/*.{js,jsx,ts,tsx}', { ignore: 'src/**/*.d.ts' })
  return extract(files, {
    idInterpolationPattern: '[sha512:contenthash:base64:6]',
    additionalFunctionNames: ['t'],
    additionalComponentNames: ['Trans']
  }).then(res => {
    fs.writeFileSync(tmpFilePath, res)
    console.log(chalk.hex('#1890FF')('intl extract success!'))
  })
}

function compileFiles() {
  console.log(chalk.hex('#008000')('intl compile start...'))
  return compile([tmpFilePath], {
    ast: false
  }).then(res => {
    fs.writeFileSync(path.resolve(__dirname, '../public/locales/zh-CN.json'), res)
    fs.unlinkSync(tmpFilePath)
    console.log(chalk.hex('#1890FF')('intl compile success!'))
  })
}

async function extractAndCompile() {
  try {
    await extractFiles()
    await compileFiles()
  } catch (e) {
    throw e
  }
}

extractAndCompile()
