const glob = require('glob')

const getVendorsFiles = () => {
  const files = glob.sync('public/vendors/**/*.js')
  return files
    .filter(v => !/-ignore\.js$/.test(v))
    .map(v => v.replace('public/', './'))
}

module.exports = getVendorsFiles
