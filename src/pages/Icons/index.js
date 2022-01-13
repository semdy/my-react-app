import React, { useEffect, useState, useCallback } from 'react'
import { message } from 'antd'
import Icon from '@/components/Icon'
import * as icons from '@/components/Icon'
import { copyToClipboard } from '@/utils/utils'
import styles from './index.module.less'

const SvgIcons = () => {
  const symbols = Object.keys(icons)

  const copyIcon = useCallback(iconName => {
    copyToClipboard(`<${iconName} />`).then(() => {
      message.success('复制成功', 1, null, false)
    })
  }, [])

  return (
    <>
      <div className={styles.total}>合计：{symbols.length - 1}</div>
      <div className={styles.iconsWrap}>
        {symbols
          .filter(key => key !== 'default')
          .map(key => {
            const IconComponent = icons[key]
            const iconName = IconComponent.displayName
            return (
              <div
                key={key}
                className={styles.iconItem}
                title={iconName}
                onClick={() => copyIcon(iconName)}
              >
                {React.createElement(IconComponent, { style: { fontSize: 30, color: '#555' } })}
                <div className={styles.iconText}>{iconName}</div>
              </div>
            )
          })}
      </div>
    </>
  )
}

const Icons = () => {
  const [symbols, setSymbols] = useState([])

  const copyIcon = useCallback(iconName => {
    copyToClipboard(`<Icon name="${iconName}" />`).then(() => {
      message.success('复制成功', 1)
    })
  }, [])

  useEffect(() => {
    const req = require.context('../../assets/icons', true, /\.svg$/)
    setSymbols(req.keys())
  }, [])

  return (
    <>
      <div className={styles.total}>合计：{symbols.length}</div>
      <div className={styles.iconsWrap}>
        {symbols.map(symbol => {
          const name = symbol.slice(2, symbol.lastIndexOf('.'))
          return (
            <div
              key={symbol}
              className={styles.iconItem}
              title={name}
              onClick={() => copyIcon(name)}
            >
              <Icon name={name} size="30px" color="#555" />
              <div className={styles.iconText}>{name}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default () => {
  return (
    <>
      <SvgIcons />
      <Icons />
    </>
  )
}
