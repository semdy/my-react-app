import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import classNames from 'classnames'
import { Button, Spin } from 'antd'
import Icon from '@/components/Icon'
import { intl, Trans } from '@/locales'
import { userGuideGetTasks, updateGuideTaskStatus } from '@/services/user'
import teamManager from '@/services/memory/teamManager'
import { toggleFloatModal, updateTasks, useUserGuideReducer } from './model'
import {
  userGuideManager,
  createIMGuideInstance,
  createInviteGuideInstance,
  createAdminGuideInstance,
  createCalGuideInstance,
  createCloudGuideInstance,
  createKnowledgeGuideInstance
} from './UserGuideManager'
import { terminateUserGuide } from './dispatchers'
import { ReactComponent as IconUserAvatar } from './icons/user-avatar.svg'
import { ReactComponent as IconUserPlus } from './icons/user-plus.svg'
import { ReactComponent as IconAdmin } from './icons/admin.svg'
import { ReactComponent as IconSchedule } from './icons/schedule.svg'
import { ReactComponent as IconDoc } from './icons/doc.svg'
import { ReactComponent as IconKnowledge } from './icons/knowledge.svg'
import { ReactComponent as IconHelperUser } from './icons/helper-user.svg'
import { ReactComponent as IconHelperSay } from './icons/helper-say.svg'
import './FloatModal.less'

const taskIconMap = {
  2: <IconUserAvatar />,
  3: <IconUserPlus />,
  4: <IconAdmin />,
  5: <IconSchedule />,
  6: <IconDoc />,
  7: <IconKnowledge />
}

const FloatModal = React.memo(() => {
  const requestedRef = useRef(false)
  const isInitRef = useRef(false)
  const taskStatusRef = useRef(teamManager.getConfig('taskStatus'))
  const [loading, setLoading] = useState(false)
  const [skipMode, setSkipMode] = useState(taskStatusRef.current === 2)
  const [finishCelebrateVisible, setFinishCelebrateVisible] = useState(false)
  const [state, dispatch] = useUserGuideReducer()

  const isComplete = useMemo(() => {
    return state.tasks.length && state.tasks.every(task => task.completed)
  }, [state.tasks])

  const handleSkip = useCallback(() => {
    setSkipMode(value => !value)
  }, [])

  const handleClose = useCallback(() => {
    dispatch(toggleFloatModal())
  }, [dispatch])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { tasks } = await userGuideGetTasks()
    setLoading(false)
    dispatch(updateTasks(tasks))
    return tasks
  }, [dispatch])

  const handleCloseFinish = useCallback(() => {
    setFinishCelebrateVisible(false)
  }, [])

  const handleCreateInst = useCallback(
    task => {
      switch (task.action) {
        case 2:
          createIMGuideInstance().show()
          break
        case 3:
          createInviteGuideInstance().show()
          break
        case 4:
          createAdminGuideInstance().show()
          break
        case 5:
          if (window.location.hash.startsWith('#/calendar')) {
            createCalGuideInstance().show(1)
          } else {
            createCalGuideInstance().show()
          }
          break
        case 6:
          if (window.location.hash.startsWith('#/cloud')) {
            createCloudGuideInstance().show(1)
          } else {
            createCloudGuideInstance().show()
          }
          break
        case 7:
          if (window.location.hash.startsWith('#/knowledge/')) {
            createKnowledgeGuideInstance().show(1)
          } else {
            createKnowledgeGuideInstance().show()
          }
          localStorage.setItem('knowledgeUserGuideFlag', '1')
          break
        default:
        //
      }
      dispatch(toggleFloatModal(false))
    },
    [dispatch]
  )

  const handleTaskClick = useCallback(
    task => {
      const instStack = userGuideManager.getAllInstance()
      Object.keys(instStack).forEach(scope => {
        instStack[scope].hide()
      })
      userGuideManager.clearInstance()
      setTimeout(() => {
        handleCreateInst(task)
      })
    },
    [handleCreateInst]
  )

  useEffect(() => {
    if (state.showFloatModal && !requestedRef.current) {
      fetchTasks()
      requestedRef.current = true
    }
  }, [fetchTasks, state.showFloatModal])

  useEffect(() => {
    if (isComplete) {
      if (!localStorage.getItem('ims_userguide_finish')) {
        setFinishCelebrateVisible(true)
        localStorage.setItem('ims_userguide_finish', '1')
      }
      terminateUserGuide()
    }
  }, [isComplete])

  useEffect(() => {
    if (isInitRef.current) {
      updateGuideTaskStatus({ taskStatus: skipMode ? 2 : 1 })
    }
    isInitRef.current = true
  }, [skipMode])

  useEffect(() => {
    const hasUserGuide = teamManager.getConfig('hasUserGuide')
    const handler = async () => {
      const tasks = await fetchTasks()
      const isDone = tasks.length && tasks.every(task => task.completed)
      if (isDone) {
        window.removeEventListener('updateUserGuideTasks', handler)
      }
    }

    if (hasUserGuide) {
      if (!localStorage.getItem('ims_userguide_modal_shown')) {
        setTimeout(() => {
          dispatch(toggleFloatModal())
        }, 200)
        localStorage.setItem('ims_userguide_modal_shown', '1')
      }
      localStorage.removeItem('ims_userguide_finish')
      window.addEventListener('updateUserGuideTasks', handler)
    }

    return () => {
      if (hasUserGuide) {
        window.removeEventListener('updateUserGuideTasks', handler)
      }
    }
  }, []) // eslint-disable-line

  if (state.showFloatModal) {
    return (
      <>
        <div className={classNames('user-guide-modal', { skipMode })}>
          <div className="user-guide-modal-hd">
            {skipMode && (
              <h3 className="user-guide-modal-title">
                <Trans id="UserGuide.00003" defaultMessage="新手引导与帮助" />
              </h3>
            )}
            <span className="user-guide-modal-switch" onClick={handleSkip}>
              {skipMode
                ? intl.t({
                    id: 'UserGuide.00004',
                    defaultMessage: '开启教学'
                  })
                : intl.t({
                    id: 'UserGuide.00005',
                    defaultMessage: '跳过教学'
                  })}
            </span>
            <Icon name="close" className="user-guide-modal-close" action onClick={handleClose} />
          </div>
          <div className="user-guide-modal-content">
            {!skipMode && (
              <>
                <div className="user-guide-modal-slogan">
                  <img
                    src={require('@/assets/img/user-guide-slogan.png')}
                    alt=""
                    width={200}
                    height={150}
                  />
                </div>
                <Spin spinning={loading}>
                  <div className="user-guide-tasks">
                    {state.tasks.map(task => (
                      <div
                        key={task.taskId}
                        className={classNames('user-guide-task', { checked: task.completed })}
                      >
                        <div className="user-guide-task-desc">
                          <Icon>{taskIconMap[task.action]}</Icon>
                          <span>{task.taskDescribe}</span>
                        </div>
                        {task.completed ? (
                          <Icon name="check-f" className="user-guide-task-check" />
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            ghost
                            onClick={() => handleTaskClick(task)}
                          >
                            <Trans id="UserGuide.00006" defaultMessage="去完成" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Spin>
              </>
            )}
            <div className={classNames('user-guide-helpers', { skipMode })}>
              <div className="user-guide-helper">
                <h4>
                  <Icon>
                    <IconHelperUser />
                  </Icon>
                  <span>
                    <Trans id="UserGuide.00007" defaultMessage="我们还提供..." />
                  </span>
                </h4>
                <div className="user-guide-helper-content">
                  <Trans
                    id="UserGuide.00008"
                    defaultMessage="担心还是不太清楚吗？想要更深入了解Imsdom提供哪些贴心的功能，您可以参考我们的帮助中心"
                  />
                </div>
                <div className="user-guide-helper-link">
                  <a
                    href="https://im.imsdom.com/#/knowledge/publish/NTAyODM1MDg5NzU5MzY2NDIwNQ"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Trans id="UserGuide.00009" defaultMessage="打开帮助中心" />
                  </a>
                </div>
              </div>
              <div className="user-guide-helper">
                <h4>
                  <Icon>
                    <IconHelperSay />
                  </Icon>
                  <Trans id="UserGuide.00010" defaultMessage="有话想说？" />
                </h4>
                <div className="user-guide-helper-content">
                  <Trans
                    id="UserGuide.00011"
                    defaultMessage="若您在使用上遇到问题，或希望IMSDOM能提供哪些服务，请告诉我们"
                  />
                </div>
                <div className="user-guide-helper-link">
                  <a href="https://www.wjx.cn/vj/PUt3Nj5.aspx" rel="noreferrer" target="_blank">
                    <Trans id="UserGuide.00012" defaultMessage="提供您的宝贵意见" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {finishCelebrateVisible && (
          <div className="user-guide-finish-celebrate" onClick={handleCloseFinish}>
            <div className="user-guide-finish-celebrate-content">
              <img src={require('@/assets/img/user-guide-done.png')} alt="" />
              <Icon
                name="close-b"
                className="user-guide-finish-celebrate-close"
                onClick={handleCloseFinish}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  return null
})

export default FloatModal
