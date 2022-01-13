import React, { useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip } from 'antd'
import Icon from '@/components/Icon'
import { getRedirectUri } from '@/utils/utils'
import styles from './index.module.less'

export default React.memo(({ type, entry, title, ...rest }) => {
  const history = useHistory()
  const handleLoginChange = useCallback(() => {
    let redirectUri = getRedirectUri()
    if (redirectUri) {
      redirectUri = `?redirectUri=${redirectUri}`
    }
    if (entry === 'login') {
      if (type === 'pc') {
        history.replace(`/user/login${redirectUri}`)
      } else {
        history.replace(`/user/login/qrcode${redirectUri}`)
      }
    } else if (entry === 'mailLogin') {
      if (type === 'pc') {
        history.replace(`/user/mailLogin${redirectUri}`)
      } else {
        history.replace(`/user/mailLogin/qrcode${redirectUri}`)
      }
    }
  }, [entry, history, type])

  return (
    <Tooltip title={title} placement="right">
      <Icon name={type} className={styles.loginPull} onClick={handleLoginChange} {...rest} />
    </Tooltip>
  )
})
