import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Checkbox, Tooltip } from 'antd'
import QRCode from 'qrcode.react'
import { intl, Trans } from '@/locales'
import Icon from '@/components/Icon'
import { loginWithQrcode } from '@/models/login'
import { genQrcode } from '@/services/user'
import appConfig from '@/config/app'
import LoginEntryIcon from './LoginEntryIcon'
import styles from './index.module.less'

const QrcodeLogin = React.memo(() => {
  const dispatch = useDispatch()
  const { pathname } = useLocation()
  const [loading, setLoading] = useState(false)
  const [autoLogin, setAutoLogin] = useState(true)
  const [qrCode, setQrcode] = useState(null)
  const timer = useRef(null)

  const recycleQueryStatus = useCallback(
    qrCode => {
      const run = async () => {
        const res = await dispatch(loginWithQrcode({ qrCode, softwareId: appConfig.softwareId }))
        if (!res.token) {
          timer.current = setTimeout(run, 1500)
        }
      }
      run()
    },
    [dispatch]
  )

  const getQrcode = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    try {
      setLoading(true)
      const res = await genQrcode({ deviceId: 'gtcs1' })
      setQrcode(res.qrCode)
      recycleQueryStatus(res.qrCode)
    } finally {
      setLoading(false)
    }
  }, [recycleQueryStatus])

  const handleAutoLogin = useCallback(e => {
    setAutoLogin(e.target.checked)
  }, [])

  useEffect(() => {
    getQrcode()

    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, []) // eslint-disable-line

  const isMailLogin = pathname.startsWith('/user/mailLogin/')

  return (
    <div className={styles.qrLoginWrap}>
      <LoginEntryIcon
        entry={isMailLogin ? 'mailLogin' : 'login'}
        type="pc"
        title={
          isMailLogin
            ? intl.t({ id: 'Login.00111', defaultMessage: '邮箱登录' })
            : intl.t({ id: 'Login.00112', defaultMessage: '手机号登录' })
        }
      />
      <h1>
        <Trans id="Login.00113" defaultMessage="扫码登录" />
      </h1>
      <h4>
        <Trans id="Login.00114" defaultMessage="请使用IMSDOM移动端扫描二维码" />
      </h4>
      <div className={styles.qrcodeImg}>
        {loading ? (
          <Icon name="spinner" size="32px" style={{ cursor: 'default' }} />
        ) : (
          qrCode && (
            <Tooltip
              title={intl.t({ id: 'Login.00115', defaultMessage: '点击更换二维码' })}
              placement="right"
            >
              <QRCode value={qrCode} size={170} onClick={getQrcode} />
            </Tooltip>
          )
        )}
      </div>
      <Checkbox checked={autoLogin} onChange={handleAutoLogin}>
        <Trans id="Login.00116" defaultMessage="15天内自动登录" />
      </Checkbox>
    </div>
  )
})

export default QrcodeLogin
