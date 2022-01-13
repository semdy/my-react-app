import React, { useRef, useCallback } from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import { Modal, message, Button } from 'antd'
import CheckGroup from '@/components/CheckGroup'
import styles from './CreateGroupModal.module.less'

const RelayModal = ({
  visible,
  title,
  theme,
  onConfirm,
  onCancel,
  showSearch,
  isCalendarSubscriber,
  disabledList,
  checkedList,
  maskClosable,
  searchPlaceholder,
  singleSelect,
  canJoinExternal,
  showSessionType
}) => {
  const listRef = useRef([])

  const syncCheckedMembers = useCallback(list => {
    listRef.current = list
  }, [])

  const handleConfirm = useCallback(() => {
    if (!listRef.current.length) {
      return message.error('请至少选择一个成员')
    }
    onConfirm(listRef.current)
  }, [onConfirm])

  return (
    <Modal
      width={600}
      zIndex={1300}
      wrapClassName={styles.wrap}
      title={<div className={styles.titleBox}>{title}</div>}
      visible={visible}
      className={classNames({ darkModal: theme === 'dark' })}
      onCancel={onCancel}
      centered
      destroyOnClose
      maskClosable={maskClosable}
      footer={null}
      cancelButtonProps={{
        ghost: theme === 'dark'
      }}
    >
      <CheckGroup
        singleSelect={singleSelect}
        showSessions
        showSessionType={showSessionType}
        showSearch={showSearch}
        canJoinExternal={canJoinExternal}
        isCalendarSubscriber={isCalendarSubscriber}
        disabledList={disabledList}
        checkedList={checkedList}
        onSyncCheckedMembers={syncCheckedMembers}
        searchPlaceholder={searchPlaceholder}
      />
      <div className={styles.footerBox}>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={handleConfirm}>
          确定
        </Button>
      </div>
    </Modal>
  )
}

RelayModal.defaultProps = {
  showSessionType: 'all',
  singleSelect: false,
  visible: false,
  maskClosable: true,
  title: '转发',
  onConfirm: () => {},
  onCancel: () => {},
  showSearch: true,
  canJoinExternal: true,
  isCalendarSubscriber: false,
  disabledList: [],
  checkedList: [],
  theme: 'default',
  searchPlaceholder: '搜索群成员'
}

RelayModal.propTypes = {
  showSessionType: propTypes.string,
  singleSelect: propTypes.bool,
  visible: propTypes.bool,
  maskClosable: propTypes.bool,
  title: propTypes.string,
  onConfirm: propTypes.func,
  onCancel: propTypes.func,
  showSearch: propTypes.bool,
  canJoinExternal: propTypes.bool,
  isCalendarSubscriber: propTypes.bool,
  disabledList: propTypes.array,
  checkedList: propTypes.array,
  theme: propTypes.oneOf(['default', 'dark']),
  searchPlaceholder: propTypes.string
}

const isEqual = (prevProps, nextProps) => {
  if (nextProps.visible) {
    return false
  }
  return nextProps.visible === prevProps.visible
}

export default React.memo(RelayModal, isEqual)
