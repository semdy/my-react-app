const path = require('path')
const rimraf = require('rimraf')

module.exports = function deleteSourceMaps() {
  rimraf.sync(path.join(__dirname, '../../electron/*.js.map'))
}
