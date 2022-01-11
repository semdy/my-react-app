import React, { useCallback, useRef, useState } from 'react'
import classNames from 'classnames'
import { Popover } from 'antd'
import { intl, Trans } from '@/locales'
import Icon from '@/components/Icon'
import { dispatch } from './model/Provider'
import { toggleFloatModal } from './model'
import './FloatHint.less'

const FloatHint = React.memo(() => {
  const isPopoverShown = useRef(false)
  const showTimer = useRef(null)
  const [expand, setExpand] = useState(false)
  const [popoverVisible, setPopoverVisible] = useState(false)

  const handleClick = useCallback(e => {
    e.preventDefault()
    dispatch(toggleFloatModal())
  }, [])

  const toggleExpand = useCallback(() => {
    setExpand(expand => !expand)
  }, [])

  const handleMouseEnter = useCallback(() => {
    toggleExpand()
    if (showTimer.current) {
      clearTimeout(showTimer.current)
    }
  }, [toggleExpand])

  const handleMouseLeave = useCallback(() => {
    toggleExpand()
    if (!isPopoverShown.current) {
      showTimer.current = setTimeout(() => {
        setPopoverVisible(true)
        setTimeout(() => {
          setPopoverVisible(false)
          isPopoverShown.current = true
        }, 3000)
      }, 300)
    }
  }, [toggleExpand])

  return (
    <Popover
      content={intl.t({
        id: 'UserGuide.00001',
        defaultMessage: '在这里可以重新点开新手引导哦~'
      })}
      overlayClassName="user-guide-popover"
      placement="left"
      visible={popoverVisible}
    >
      <a
        href="#"
        className={classNames('user-guide-floater', { expand })}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <Icon name="angle-left" />
        <span>
          <Trans id="UserGuide.00002" defaultMessage="新手引导和帮助" />
        </span>
      </a>
    </Popover>
  )
})

export default FloatHint
