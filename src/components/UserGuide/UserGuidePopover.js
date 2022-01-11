import React, { useCallback, useEffect, useMemo } from 'react'
import { Popover, Button } from 'antd'
import classNames from 'classnames'
import Icon from '@/components/Icon'
import { history } from '@/index'
import { Trans } from '@/locales'
import { useUserGuideReducer, resetUserGuide } from './model'
import { userGuideManager } from './UserGuideManager'
import './UserGuidePopover.less'

const UserGuidePopover = React.memo(() => {
  const [state, dispatch] = useUserGuideReducer()

  const isVisible = useMemo(() => {
    return state.bound !== null && state.bound !== undefined
  }, [state.bound])

  const handlePrev = useCallback(() => {
    userGuideManager.getInstance(state.scope).prev()
  }, [state.scope])

  const handleSkip = useCallback(() => {
    if (state.removeInst) {
      userGuideManager.removeInstance(state.scope)
    }
    dispatch(resetUserGuide())
  }, [dispatch, state.removeInst, state.scope])

  const handleNext = useCallback(() => {
    userGuideManager.getInstance(state.scope).next()
  }, [state.scope])

  const handleClose = useCallback(() => {
    if (state.removeInst && state.currIndex + 1 === state.total) {
      handleSkip()
    } else if (state.goNextOnClose) {
      handleNext()
    } else {
      userGuideManager.getInstance(state.scope).hide()
    }
  }, [
    handleNext,
    handleSkip,
    state.currIndex,
    state.goNextOnClose,
    state.removeInst,
    state.scope,
    state.total
  ])

  const handleComplete = useCallback(() => {
    handleSkip()
    // if (state.pageRouter) {
    //   history.push(state.pageRouter)
    // }
  }, [handleSkip])

  const buildContent = useCallback(() => {
    return (
      <>
        {state.showStep && (
          <div className="user-guide-hd">
            {state.currIndex + 1}/{state.total}
          </div>
        )}
        <div className="user-guide-bd">{state.content}</div>
        {state.showFooter && (
          <div className="user-guide-footer">
            {state.canMovePrev && (
              <Button size="small" ghost onClick={handlePrev}>
                <Trans id="UserGuide.00035" defaultMessage="上一步" />
              </Button>
            )}
            {state.canSkip && (
              <Button size="small" ghost onClick={handleSkip}>
                <Trans id="UserGuide.00036" defaultMessage="跳过" />
              </Button>
            )}
            {state.canMoveNext && state.currIndex + 1 < state.total && (
              <Button size="small" onClick={handleNext}>
                <Trans id="UserGuide.00037" defaultMessage="下一步" />
              </Button>
            )}
            {state.currIndex + 1 === state.total && (
              <Button size="small" onClick={handleComplete}>
                <Trans id="UserGuide.00038" defaultMessage="完成" />
              </Button>
            )}
          </div>
        )}
        {state.canClose && <Icon name="close" className="user-guide-close" onClick={handleClose} />}
      </>
    )
  }, [
    handleClose,
    handleComplete,
    handleNext,
    handlePrev,
    handleSkip,
    state.canClose,
    state.canMoveNext,
    state.canMovePrev,
    state.canSkip,
    state.content,
    state.currIndex,
    state.showFooter,
    state.showStep,
    state.total
  ])

  useEffect(() => {
    const unListen = history.listen(() => {
      dispatch(resetUserGuide())
    })

    return () => {
      unListen()
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    const completeHandler = () => {
      handleComplete()
    }

    const nextHandler = () => {
      handleNext()
    }

    if (isVisible) {
      window.addEventListener('userGuideComplete', completeHandler)
      window.addEventListener('userGuideToNext', nextHandler)
    } else {
      window.removeEventListener('userGuideComplete', completeHandler)
      window.removeEventListener('userGuideToNext', nextHandler)
    }

    return () => {
      if (isVisible) {
        window.removeEventListener('userGuideComplete', completeHandler)
        window.removeEventListener('userGuideToNext', nextHandler)
      }
    }
  }, [handleComplete, handleNext, isVisible])

  if (isVisible) {
    return (
      <Popover
        placement={state.placement}
        content={buildContent()}
        visible
        overlayClassName={classNames('user-guide-popover', state.overlayClassName)}
      >
        <div
          style={{
            position: 'absolute',
            left: state.bound.left,
            top: state.bound.top,
            width: state.bound.width,
            height: state.bound.height,
            pointerEvents: 'none'
          }}
        />
      </Popover>
    )
  }
  return null
})

export default UserGuidePopover
