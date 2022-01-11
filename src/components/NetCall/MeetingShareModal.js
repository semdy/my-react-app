import React, { useState, useCallback } from 'react'
import propTypes from 'prop-types'
import { Modal, message } from 'antd'
import CheckGroup from '@/components/CheckGroup'
import './NetCallModal.less'

const MeetingShareModal = ({ visible, title, onConfirm, onCancel, disabledList }) => {
  const [list, setList] = useState([])

  const syncCheckedMembers = useCallback(list => {
    setList(list)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!list.length) {
      return message.error('请至少选择一个成员')
    }
    onConfirm(list)
  }, [list, onConfirm])

  return (
    <Modal
      title={title}
      visible={visible}
      onOk={handleConfirm}
      onCancel={onCancel}
      destroyOnClose
      closable={false}
      cancelButtonProps={{
        ghost: true
      }}
      okText="分享"
      className="netcall-modal"
      zIndex={1205}
    >
      <CheckGroup
        searchPlaceholder="搜索参会人"
        disabledList={disabledList}
        onSyncCheckedMembers={syncCheckedMembers}
      />
    </Modal>
  )
}

MeetingShareModal.defaultProps = {
  visible: false,
  title: '分享视频会议',
  onConfirm: () => {},
  onCancel: () => {},
  disabledList: []
}

MeetingShareModal.propTypes = {
  visible: propTypes.bool,
  title: propTypes.string,
  onConfirm: propTypes.func,
  onCancel: propTypes.func,
  disabledList: propTypes.array
}

const isEqual = (prevProps, nextProps) => {
  if (nextProps.visible) {
    return false
  }
  return nextProps.visible === prevProps.visible
}

export default React.memo(MeetingShareModal, isEqual)
