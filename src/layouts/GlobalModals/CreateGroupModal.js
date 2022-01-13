import React, { useState, useCallback, useEffect, useRef } from 'react'
import propTypes from 'prop-types'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'
import { Modal, Input, Button, message } from 'antd'
import CheckGroup from '@/components/CheckGroup'
import { createTeam } from '@/models/im/team'
import styles from './CreateGroupModal.module.less'

const CreateGroupModal = ({
  visible,
  scene,
  theme,
  onConfirm,
  onCancel,
  disabledList,
  checkedList,
  showSessionType,
  singleSelect,
  canJoinExternal
}) => {
  const history = useHistory()
  const dispatch = useDispatch()
  const selectedList = useRef([])
  const teamName = useRef('')
  const [isCreate, setIsCreate] = useState(false)
  const [loading, setLoading] = useState(false)

  const syncCheckedMembers = useCallback(
    list => {
      selectedList.current = list
    },
    [selectedList]
  )

  const handleTeamName = useCallback(e => {
    teamName.current = e.target.value
  }, [])

  const handleConfirm = useCallback(() => {
    const teamNameStr = teamName.current.trim()

    if (!selectedList.current.length) {
      return message.warn('请至少选择一个成员')
    }
    setLoading(true)
    const forceNewTeam = scene === 'layout'
    dispatch(createTeam(selectedList.current, teamNameStr, forceNewTeam))
      .then(params => {
        onConfirm(selectedList.current, teamNameStr)
        if (isCreate) {
          // 新建群聊
          history.push(`/chat/board/team-${params.team.teamId}`)
          // 同步数据 - 创建群
          // updateCreateGroup({
          //   teamId: params.team.teamId,
          //   name: params.team.name,
          //   avatar: params.team.avatar,
          //   accounts: params.accounts
          // })
        }
        // else {
        //   // 同步数据 - 添加群成员
        //   updateGroupMember(params)
        // }
        setLoading(false)
        teamName.current = ''
      })
      .catch(() => {
        setLoading(false)
      })
  }, [dispatch, history, isCreate, onConfirm, scene])

  const makeTitle = useCallback(() => {
    return (
      <div className={styles.titleBox}>
        {isCreate ? (
          <Input
            className={styles.titleInput}
            placeholder="请输入新建群组名称（非必填）"
            onChange={handleTeamName}
            maxLength={30}
          />
        ) : (
          <div>添加群成员</div>
        )}
      </div>
    )
  }, [handleTeamName, isCreate])

  useEffect(() => {
    setIsCreate(scene === 'p2p' || scene === 'layout')
  }, [scene])

  return (
    <Modal
      width={600}
      wrapClassName={styles.wrap}
      title={makeTitle()}
      visible={visible}
      className={classNames({ darkModal: theme === 'dark' })}
      onCancel={onCancel}
      centered
      destroyOnClose
      footer={null}
    >
      <CheckGroup
        disabledList={disabledList}
        checkedList={checkedList}
        showSessionType={showSessionType}
        singleSelect={singleSelect}
        canJoinExternal={canJoinExternal}
        onSyncCheckedMembers={syncCheckedMembers}
        showSessions
        canUnfold
      />
      <div className={styles.footerBox}>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" loading={loading} onClick={handleConfirm}>
          确定
        </Button>
      </div>
    </Modal>
  )
}

CreateGroupModal.defaultProps = {
  visible: false,
  scene: 'p2p',
  onConfirm: () => {},
  onCancel: () => {},
  disabledList: [],
  checkedList: [],
  showSessionType: 'all',
  singleSelect: false,
  canJoinExternal: true,
  theme: 'default'
}

CreateGroupModal.propTypes = {
  visible: propTypes.bool,
  scene: propTypes.string,
  onConfirm: propTypes.func,
  onCancel: propTypes.func,
  disabledList: propTypes.array,
  checkedList: propTypes.array,
  showSessionType: propTypes.string,
  singleSelect: propTypes.bool,
  canJoinExternal: propTypes.bool,
  theme: propTypes.oneOf(['default', 'dark'])
}

const isEqual = (prevProps, nextProps) => {
  if (nextProps.visible) {
    return false
  }
  return nextProps.visible === prevProps.visible
}

export default React.memo(CreateGroupModal, isEqual)
