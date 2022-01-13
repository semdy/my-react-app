import React, { useEffect, useState, useCallback } from 'react'
import { Modal, Empty, Tooltip, Spin } from 'antd'
import propTypes from 'prop-types'
import Avatar from '@/components/Avatar'
import Icon from '@/components/Icon'
import ExternalTag from '@/components/ExternalTag'
import { getFormatFileSize, jumpToFolderInvoke, openNewWindowCenter } from '@/utils/space'
import { requestFileDetailInfo } from '@/services/space'
import knowledgeLogo from '@/assets/img/knowledge-logo.png'
import styles from './FileInfoModal.module.less'

const FileInfoModal = props => {
  const { visible, fileId, onCancel } = props
  const [fileState, setFileState] = useState({})
  const [knList, setKnList] = useState([])
  const [folderId, setFolderId] = useState('我的空间')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      setLoading(true)
      requestFileDetailInfo({ fileId, more: true }).then(res => {
        const {
          fileName,
          creatorName,
          createTime,
          modifierName,
          updateTime,
          creatorType,
          modifierType,
          fileSize,
          folderPath,
          editCount,
          readCount,
          knowledgeBases,
          canLookFolder
        } = res
        // 生成创建者 => 名字（创建日期）
        let creatorDate = new Date(Number(createTime))
        creatorDate = `（${creatorDate.getFullYear()}.${
          creatorDate.getMonth() + 1
        }.${creatorDate.getDate()}）`
        // 生成最后更新 => 名字（更新日期）
        let updateDate = new Date(Number(updateTime))
        updateDate = `（${updateDate.getFullYear()}.${
          updateDate.getMonth() + 1
        }.${updateDate.getDate()}）`
        // 生成文件大小
        const size = getFormatFileSize(Number(fileSize))
        // 生成文件位置
        const filePath = Object.values(folderPath).join('/')
        setFileState({
          fileName,
          creatorName,
          creatorDate,
          modifierName,
          updateDate,
          size,
          filePath,
          editCount,
          readCount,
          creatorType,
          modifierType,
          folderJump: canLookFolder
        })
        if (knowledgeBases) setKnList(knowledgeBases)
        // 获取folderId
        const folders = Object.keys(folderPath)
        // eslint-disable-next-line no-underscore-dangle
        const _folderId = folders.length === 1 ? folderPath[folders[0]] : folders.pop()
        setFolderId(_folderId)
        setLoading(false)
      })
    } else {
      setFileState({
        fileName: '加载中...',
        creator: '加载中...',
        lastUpdate: '加载中...',
        size: '加载中...',
        filePath: '加载中...',
        editCount: '0',
        readCount: '0',
        folderJump: false
      })
      setKnList([])
      setLoading(false)
    }
  }, [fileId, visible])

  const jumpToSpace = useCallback(() => {
    if (!fileState.folderJump) return
    jumpToFolderInvoke(folderId)
    onCancel()
  }, [folderId, onCancel, fileState])

  const jumpToKnowledge = useCallback(
    knowledgeBaseId => () => {
      openNewWindowCenter(
        `#/knowledgeEdit?knowledge=${knowledgeBaseId}`,
        `knowledgeEdit${knowledgeBaseId}`
      )
    },
    []
  )

  return (
    <Modal
      title="文件信息"
      visible={visible}
      footer={null}
      centered
      width={716}
      destroyOnClose
      onCancel={onCancel}
      wrapClassName={styles.FileInfoModal}
    >
      <Spin spinning={loading} size="large">
        <div className={styles.Wrapper}>
          <div className={styles.Block}>
            <div className={styles.Block}>
              <div className={styles.title}>基本信息</div>
              <div className={styles.Info}>
                <div className={styles.infoName}>文件名称：</div>
                <div className={styles.infoContent}>{fileState.fileName}</div>
              </div>
              <div className={styles.Info}>
                <div className={styles.infoName}>{`创建者：${String.fromCharCode(12288)}`}</div>
                <div className={styles.infoContent}>
                  {fileState.creatorName}
                  {fileState.creatorType === 6 && <ExternalTag style={{ marginLeft: 5 }} />}
                  {fileState.creatorDate}
                </div>
              </div>
              <div className={styles.Info}>
                <div className={styles.infoName}>最后更新：</div>
                <div className={styles.infoContent}>
                  {fileState.modifierName}
                  {fileState.modifierType === 6 && <ExternalTag style={{ marginLeft: 5 }} />}
                  {fileState.updateDate}
                </div>
              </div>
              <div className={styles.Info}>
                <div className={styles.infoName}>文件大小：</div>
                <div className={styles.infoContent}>{fileState.size}</div>
              </div>
              <div className={styles.Info}>
                <div className={styles.infoName}>文件位置：</div>
                <Tooltip title={fileState.filePath}>
                  <div
                    className={fileState.folderJump ? styles.jumper : styles.infoContent}
                    onClick={jumpToSpace}
                  >
                    {fileState.filePath}
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className={styles.Block}>
              <div className={styles.title}>统计信息</div>
              <div className={styles.Info}>
                <div className={styles.infoName}>浏览次数：</div>
                <div className={styles.infoContent}>{`${fileState.readCount}次`}</div>
              </div>
              <div className={styles.Info}>
                <div className={styles.infoName}>编辑次数：</div>
                <div className={styles.infoContent}>{`${fileState.editCount}次`}</div>
              </div>
            </div>
          </div>
          <div className={styles.Split} />
          <div className={styles.Block}>
            <div className={styles.title}>
              引用至下列知识库
              <Tooltip
                title={
                  <>
                    <div>文档被引用的时间由近至远排序。</div>
                    <div>您需订阅知识库才可进一步浏览。</div>
                  </>
                }
              >
                <Icon name="ask-o" className={styles.knTip} />
              </Tooltip>
            </div>
            <div className={styles.KnowledgeList}>
              <div className={styles.knowledgeListContainer}>
                {knList.length === 0 ? (
                  <Empty
                    image={require('@/assets/img/knowledge-ref-empty.png')}
                    imageStyle={{ height: '104px', marginTop: 47 }}
                    description={<div className={styles.noRef}>未被引用至知识库</div>}
                  />
                ) : (
                  knList.map(item => (
                    <div
                      key={item.knowledgeBaseId}
                      className={styles.knItem}
                      onClick={jumpToKnowledge(item.knowledgeBaseId)}
                    >
                      <Avatar
                        url={item.knowledgeBaseIcon || knowledgeLogo}
                        className={styles.knIcon}
                      />
                      <div
                        className={
                          item.status === 1 || item.status === 0 ? styles.booked : styles.notBooked
                        }
                      >
                        {item.knowledgeBaseName}
                      </div>
                      <div className={styles.knOwner}>
                        {`（${item.ownerMemberName}/${item.departmentName}）`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </Modal>
  )
}

FileInfoModal.defaultProps = {
  visible: false,
  fileId: ''
}

FileInfoModal.propTypes = {
  visible: propTypes.bool,
  fileId: propTypes.string
}

const isEqual = (prevProps, nextProps) => {
  if (nextProps.visible) {
    return false
  }
  return nextProps.visible === prevProps.visible
}

export default React.memo(FileInfoModal, isEqual)
