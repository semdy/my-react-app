const { extract, compile } = require('@formatjs/cli')
const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

const tmpFilePath = path.resolve(__dirname, '../tmp.json')

function extractFiles() {
  console.log(chalk.hex('#008000')('intl extract start...'))
  const files = glob.sync('src/**/*.{js,jsx,ts,tsx}', { ignore: '**/*.d.ts' })
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
    mixContent(res, true)
    fs.unlinkSync(tmpFilePath)
    console.log(chalk.hex('#1890FF')('intl compile success!'))
  })
}

// 把新增的中文语言混合到其它语言包里
function mixContent(res, minify) {
  const zhJson = JSON.parse(res)
  const langFiles = glob.sync('public/locales/*.js', { ignore: '**/zh_cn.js' })
  langFiles.forEach(path => {
    const content = fs.readFileSync(path)
    let res
    try {
      res = new Function(`return ${Buffer.from(content).toString()}`)()
    } catch (e) {
      res = {}
    }
    const mixRes = Object.assign(zhJson, res)
    fs.writeFileSync(path, `ims_translations = ${JSON.stringify(mixRes, null, minify ? 0 : 1)}`)
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
