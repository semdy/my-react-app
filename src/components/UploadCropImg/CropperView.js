import React, { useRef, useCallback } from 'react'
import propTypes from 'prop-types'
import { Modal } from 'antd'
import Cropper from 'react-cropper'
import 'cropperjs/dist/cropper.css'

const CropperView = ({ visible, src, loading, setLoading, onModalOk, onModalCancel }) => {
  const cropperEl = useRef(null)

  const modalOk = useCallback(() => {
    setLoading(true)
    cropperEl.current.getCroppedCanvas().toBlob(
      blob => {
        onModalOk(blob)
      },
      'image/png',
      0.9
    )
  }, [onModalOk, setLoading])

  return (
    <Modal
      visible={visible}
      confirmLoading={loading}
      onOk={modalOk}
      onCancel={onModalCancel}
      destroyOnClose
      maskClosable={false}
      zIndex={1100}
      okText="保存"
      title="修改头像"
      centered
    >
      <div className="CropperView-wrap">
        <Cropper
          ref={cropperEl}
          src={src}
          aspectRatio={1}
          dragMode="move"
          viewMode={1}
          className="CropperView-box"
        />
      </div>
    </Modal>
  )
}

CropperView.defaultProps = {
  visible: false,
  src: '',
  loading: false,
  setLoading: () => {},
  onModalOk: () => {},
  onModalCancel: () => {}
}

CropperView.propTypes = {
  visible: propTypes.bool,
  src: propTypes.string,
  loading: propTypes.bool,
  setLoading: propTypes.func,
  onModalOk: propTypes.func,
  onModalCancel: propTypes.func
}

const isEqual = (prevProps, nextProps) => {
  if (nextProps.visible) {
    return false
  }
  return nextProps.visible === prevProps.visible
}

export default React.memo(CropperView, isEqual)
