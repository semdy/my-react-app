const watch = require('gulp-watch')
const { generateIconsFile } = require('./generate-icons')

generateIconsFile()

watch('src/assets/icons/**/*.svg', { verbose: true }, vinyl => {
  generateIconsFile()
})
