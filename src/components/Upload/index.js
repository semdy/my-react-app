import React from 'react'
import propTypes from 'prop-types'
import { Upload as AntUpload, message } from 'antd'
import { getBase64 } from '@/utils/utils'

const Upload = ({ children, useBase64, limit, beforeUpload, ...rest }) => {
  const uploadProps = {
    beforeUpload: (file, fileList) => {
      const isInLimit = file.size / 1024 / 1024 < limit
      if (!isInLimit) {
        message.error(`文件体积控制在${limit}MB以内!`)
        return isInLimit
      }
      if (useBase64) {
        getBase64(file).then(imageUrl => beforeUpload(imageUrl, fileList))
      } else {
        beforeUpload(file, fileList)
      }
      return false
    },
    ...rest
  }

  return <AntUpload {...uploadProps}>{children}</AntUpload>
}

Upload.defaultProps = {
  accept: 'image/*',
  useBase64: false,
  multiple: true,
  showUploadList: false,
  limit: 1,
  beforeUpload: () => {}
}

Upload.propTypes = {
  accept: propTypes.string,
  children: propTypes.any,
  useBase64: propTypes.bool,
  multiple: propTypes.bool,
  showUploadList: propTypes.bool,
  limit: propTypes.number,
  beforeUpload: propTypes.func
}

export default React.memo(Upload)
