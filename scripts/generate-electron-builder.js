const fs = require('fs-extra')
const path = require('path')

const generateElectronBuilder = () => {
  const params = {
    asar: process.env.APP_ARCH !== 'ia32'
  }
  const filePath = path.resolve(process.cwd(), 'electron-builder.tpl.yml')
  const writePath = path.resolve(process.cwd(), 'electron-builder.yml')
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      throw err
    }
    const content = data.replace(/\$\{([^}]+)\}/gm, (match, name) => {
      const value = params[name]
      if (value !== undefined) return value
      return match
    })
    fs.writeFileSync(writePath, content)
  })
}

generateElectronBuilder()


