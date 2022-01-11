const watch = require('gulp-watch')
const { generateIconsFile } = require('./generate-icons')

generateIconsFile()

watch('src/assets/svgs/**/*.svg', { verbose: true }, (vinyl) => {
  generateIconsFile()
})
