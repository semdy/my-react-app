import React, { useState, useCallback } from 'react'
import propTypes from 'prop-types'
import { message } from 'antd'
import Upload from '@/components/Upload'
import { getBase64 } from '@/utils/utils'
import './index.less'

const CropperView = React.lazy(() => import('./CropperView'))

const UploadCropImg = React.forwardRef(
  ({ children, ossServerHandle, fileName, onUploadSuccess }, ref) => {
    const [originSrc, setOriginSrc] = useState('')
    const [modalVisible, setModalVisible] = useState(false)
    const [loading, setLoading] = useState(false)

    // 选中文件后弹窗裁剪
    const handleBeforeUpload = useCallback(file => {
      if (!/^image\/(png|jpe?g|gif|svg\+xml)$/.test(file.type)) {
        return message.error('只能上传图片！')
      }
      getBase64(file).then(imageUrl => {
        setOriginSrc(imageUrl)
        setModalVisible(true)
      })
      return false
    }, [])

    // 上传遇阻
    const uploadFail = useCallback(() => {
      setLoading(false)
      message.error('上传失败，请重试')
    }, [])

    // oss上传
    const uploadToOss = useCallback(
      async blob => {
        try {
          const { client, fullName, fullUrl } = await ossServerHandle(fileName)
          if (!client) {
            uploadFail()
            return
          }
          const result = await client.put(fullName, blob)
          // 上传成功,返回给父组件结果
          onUploadSuccess({
            result: {
              ...result,
              url: `${fullUrl}?t=${Date.now()}`,
              blobUrl: window.URL.createObjectURL(blob)
            },
            succCallBack: () => {
              setModalVisible(false)
            }
          })
          setLoading(false)
        } catch (e) {
          uploadFail()
        }
      },
      [fileName, onUploadSuccess, ossServerHandle, uploadFail]
    )

    // modal确认完成
    const onModalOk = useCallback(
      blob => {
        uploadToOss(blob)
      },
      [uploadToOss]
    )

    // modal取消
    const onModalCancel = useCallback(() => {
      setLoading(false)
      setModalVisible(false)
    }, [])

    return (
      <>
        <div className="UploadCropImg-wrap" ref={ref}>
          <Upload
            accept=".png, .jpg, .jpeg, .gif, .svg"
            limit={2}
            beforeUpload={handleBeforeUpload}
          >
            {children}
          </Upload>
        </div>
        {modalVisible && (
          <React.Suspense fallback={null}>
            <CropperView
              visible={modalVisible}
              src={originSrc}
              loading={loading}
              setLoading={setLoading}
              onModalOk={onModalOk}
              onModalCancel={onModalCancel}
            />
          </React.Suspense>
        )}
      </>
    )
  }
)

UploadCropImg.defaultProps = {
  ossServerHandle: () => {},
  fileName: '',
  onUploadSuccess: () => {}
}

UploadCropImg.propTypes = {
  ossServerHandle: propTypes.func,
  fileName: propTypes.string,
  onUploadSuccess: propTypes.func
}

export default React.memo(UploadCropImg)
