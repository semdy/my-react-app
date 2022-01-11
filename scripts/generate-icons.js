const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')
const paths = require('../config/paths')

const getIconFiles = () => {
  const files = glob.sync('src/assets/svgs/**/*.svg')
  return files.map(filePath => {
    const fileName = path.basename(filePath, '.svg')
    const camelName = fileName.replace(/\b-?(\w)/g, (match, name) => {
      return name.toUpperCase()
    })
    return { path: filePath, name: fileName, camelName }
  })
}

const generateIconsData = () => {
  return getIconFiles().map(icon => {
    return [
      icon.camelName,
      `import React from 'react'
import propTypes from 'prop-types'
import IconBase from '@/components/Icon/IconBase'
import { ReactComponent as ${icon.camelName}Svg } from '${icon.path.replace('src/', '@/')}'

const ${icon.camelName} = props => {
  return (
    <IconBase name="${icon.name}" {...props}>
      <${icon.camelName}Svg
        focusable="false"
        data-icon="${icon.name}"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      />
    </IconBase>
  )
}

${icon.camelName}.propTypes = {
  className: propTypes.string,
  size: propTypes.string,
  color: propTypes.string,
  onClick: propTypes.func,
  title: propTypes.string,
  type: propTypes.oneOf(['iconfont', 'svg', 'img']),
  style: propTypes.object,
  action: propTypes.bool
}

${icon.camelName}.displayName = 'Icon${icon.camelName}'

export default ${icon.camelName}
`
    ]
  })
}

const generateIconsFile = () => {
  try {
    const data = generateIconsData()
    const iconIndexData = []
    fs.emptyDirSync(path.resolve(paths.appSrc, 'components/Icon/icons'))
    data.forEach(item => {
      const writePath = path.resolve(paths.appSrc, 'components/Icon/icons', `${item[0]}.js`)
      fs.writeFileSync(writePath, item[1])
    })
    data.forEach(item => {
      iconIndexData.push(`export { default as Icon${item[0]} } from './${item[0]}'`)
    })
    const writePath = path.resolve(paths.appSrc, 'components/Icon/icons', 'index.js')
    fs.writeFileSync(writePath, iconIndexData.join('\n'))
  } catch (e) {
    throw e
  }
}

module.exports = {
  getIconFiles,
  generateIconsData,
  generateIconsFile
}
