import React, { useState, useCallback, useRef } from 'react'
import propTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'
import { Modal, Button, message } from 'antd'
import MSG_TYPE from '@/constants/MSG_TYPE'
import CheckFile from '@/components/CheckFile'
import { sendMsg } from '@/models/im/msgs'
import styles from './TransmitModal.module.less'

const TransmitModal = ({
  visible,
  scene,
  to,
  theme,
  onCancel,
  disabledList,
  checkedList,
  showSessionType,
  singleSelect
}) => {
  const dispatch = useDispatch()
  const selectedList = useRef([])
  const [loading, setLoading] = useState(false)

  const syncCheckedMembers = useCallback(
    list => {
      if (list.length > 8) {
        message.error('每次发送不能多于8个文件')
      }

      selectedList.current = list
    },
    [selectedList]
  )

  const handleConfirm = useCallback(() => {
    if (!selectedList.current.length) {
      return message.error('请至少选择一个文件')
    }
    if (selectedList.current.length > 8) {
      return message.error('每次发送不能多于8个文件')
    }
    setLoading(true)
    selectedList.current.forEach(item => {
      const fileUrl = `${item.fileUrl}/#/office/file?file=${item.fileId}&cloud=1`
      dispatch(
        sendMsg({
          type: MSG_TYPE.TEXT,
          scene,
          to,
          text: fileUrl,
          doneCallback: () => {
            setLoading(false)
            onCancel()
          }
        })
      )

      // let type = 'file'
      // if (/\.(png|jpg|bmp|jpeg|gif|svg)$/i.test(item.fileName)) {
      //   type = 'image'
      // } else
      // if (/\.(mov|mp4|ogg|webm)$/i.test(item.fileName)) {
      //   type = 'video'
      // }
      // dispatch(
      //   sendMsg({
      //     type: 'custom',
      //     scene,
      //     to,
      //     content: {
      //       type: 13,
      //       file: {
      //         fileId: item.fileId,
      //         fileType: type,
      //         name: item.fileName,
      //         url: 'www.baidu.com',
      //         size: null,
      //         ext: item.fileName.slice(item.fileName.lastIndexOf('.') + 1, item.fileName.length)
      //       }
      //     },
      //     doneCallback: () => {
      //       setLoading(false)
      //       onCancel()
      //     }
      //   })
      // )
    })

    // setLoading(true)
    // const forceNewTeam = scene === 'layout'
    // dispatch(createTeam(selectedList.current, teamName, forceNewTeam))
    //   .then(params => {
    //     onConfirm(selectedList.current, teamName)
    //     if (isCreate) {
    //       // 新建群聊
    //       history.push(`/chat/board/team-${params.team.teamId}`)

    //       // 同步数据 - 创建群
    //       updateCreateGroup({
    //         teamId: params.team.teamId,
    //         name: params.team.name,
    //         avatar: params.team.avatar,
    //         accounts: params.accounts
    //       })
    //     } else {
    //       // 同步数据 - 添加群成员
    //       updateGroupMember(params)
    //     }
    //     setLoading(false)
    //   })
    //   .catch(err => {
    //     setLoading(false)
    //     message.error(err.message)
    //   })
  }, [dispatch, onCancel, scene, to])

  const makeTitle = useCallback(() => {
    return <div className={styles.titleBox}>发送云文件</div>
  }, [])

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
      <CheckFile
        disabledList={disabledList}
        checkedList={checkedList}
        showSessionType={showSessionType}
        singleSelect={singleSelect}
        onSyncCheckedMembers={syncCheckedMembers}
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

TransmitModal.defaultProps = {
  visible: false,
  scene: 'p2p',
  onCancel: () => {},
  disabledList: [],
  checkedList: [],
  showSessionType: 'all',
  singleSelect: false,
  theme: 'default'
}

TransmitModal.propTypes = {
  visible: propTypes.bool,
  scene: propTypes.string,
  onCancel: propTypes.func,
  disabledList: propTypes.array,
  checkedList: propTypes.array,
  showSessionType: propTypes.string,
  singleSelect: propTypes.bool,
  theme: propTypes.oneOf(['default', 'dark'])
}

const isEqual = (prevProps, nextProps) => {
  if (nextProps.visible) {
    return false
  }
  return nextProps.visible === prevProps.visible
}

export default React.memo(TransmitModal, isEqual)
