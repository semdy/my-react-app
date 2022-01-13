import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Button } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import { intl, Trans } from '@/locales'
import VerifyInput from '@/components/VerifyInput'
import CountDown from '@/components/CountDown'
import { handleBindMobile } from '@/services/user'
import { getRedirectUri } from '@/utils/utils'
import { sendSmsCode } from '@/models/login'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

@StepWrapper({ title: intl.t({ id: 'Login.00034', defaultMessage: '验证联系方式' }) })
@connect(({ login }) => ({
  login
}))
class AdDomainVerify extends PureComponent {
  fromUrl = ''

  state = {
    code: '',
    sending: false,
    loading: false,
    smsLength: 6,
    mobile: ''
  }

  constructor(props) {
    super(props)

    const {
      match: { params }
    } = props

    this.fromUrl = params.from
    this.countDuration = 60
    const lastCountDownStamp = Number(localStorage.getItem(`_lastCountDownStamp:${this.fromUrl}`))
    const countPeriod = Math.min(
      Math.ceil((Date.now() - lastCountDownStamp) / 1000),
      this.countDuration
    )
    this.countDown =
      lastCountDownStamp === 0 ? this.countDuration : this.countDuration - countPeriod

    if (countPeriod === this.countDuration) {
      localStorage.removeItem(`_lastCountDownStamp:${this.fromUrl}`)
    }
  }

  componentDidMount() {
    this.getMobile()
    if (this.countDown === this.countDuration) {
      this.handleResend()
    }
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    if (this.countDown < this.countDuration) {
      localStorage.setItem(
        `_lastCountDownStamp:${this.fromUrl}`,
        Date.now() - (this.countDuration - this.countDown) * 1000
      )
    }

    document.removeEventListener('keydown', this.onKeyDown)
  }

  handleCountDown(count, complete) {
    this.countDown = count
    if (complete) {
      this.countDown = this.countDuration
      localStorage.removeItem(`_lastCountDownStamp:${this.fromUrl}`)
    }
  }

  getMobile() {
    const mobile = localStorage.getItem('ims_mobile')

    if (mobile) {
      this.setState({ mobile })
    } else {
      const { history } = this.props
      const redirectUri = getRedirectUri()
      if (redirectUri) {
        history.replace(`/user/adDomain/bindMobile?redirectUri=${redirectUri}`)
      } else {
        history.push('/user/adDomain/bindMobile')
      }
    }
  }

  setLoading(status) {
    this.setState({
      loading: status
    })
  }

  setSending(status) {
    this.setState({
      sending: status
    })
  }

  onKeyDown = e => {
    const { sending, code, smsLength } = this.state

    if (e.keyCode === 13 && !(code.length < smsLength || sending)) {
      this.handleSubmit()
    }
  }

  handleSubmit = () => {
    const { history } = this.props
    const { code, mobile } = this.state

    this.setLoading(true)

    handleBindMobile({ mobile, smsCode: code, countryNo: this.props.login.countryNo })
      .then(() => {
        const redirectUri = getRedirectUri()
        if (redirectUri) {
          history.replace(`/user/adDomain/success?redirectUri=${redirectUri}`)
        } else {
          history.push('/user/adDomain/success')
        }
      })
      .finally(() => {
        this.setLoading(false)
      })
  }

  handleResend = () => {
    const mobile = localStorage.getItem('ims_mobile')
    if (!mobile) return

    const { dispatch } = this.props
    if (this.state.sending) return
    this.setSending(true)
    dispatch(
      sendSmsCode({
        mobile,
        type: 104,
        countryNo: this.props.login.countryNo
      })
    ).finally(() => {
      this.setSending(false)
    })
  }

  handleVerifyChange = code => {
    this.setState({ code })
  }

  render() {
    const { sending, loading, code, smsLength, mobile } = this.state
    return (
      <>
        <div className={styles.sendToMsg}>
          <Trans
            id="Login.00035"
            defaultMessage="验证码已发送至您的手机：{mobile}"
            values={{ mobile }}
          />
        </div>
        <div className={styles.sendHint}>
          <Trans id="Login.00036" defaultMessage="请输入验证码" />
        </div>
        <div className={styles.sendInput}>
          <VerifyInput count={smsLength} onChange={this.handleVerifyChange} />
        </div>
        <div className={styles.resend}>
          {sending ? (
            <>
              <LoadingOutlined />
              <span>
                <Trans id="Login.00037" defaultMessage="发送中..." />
              </span>
            </>
          ) : (
            <CountDown count={this.countDown}>
              {({ count, complete }) => {
                this.handleCountDown(count, complete)
                return complete ? (
                  <span className={styles.resendBtn} onClick={this.handleResend}>
                    <Trans id="Login.00038" defaultMessage="重新发送验证码" />
                  </span>
                ) : (
                  <span>
                    <Trans
                      id="Login.00039"
                      defaultMessage="{count}s后重新发送验证码"
                      values={{ count }}
                    />
                  </span>
                )
              }}
            </CountDown>
          )}
        </div>
        <div className={classNames(styles.verifyActions, styles.right)}>
          <Button
            size="large"
            type="primary"
            loading={loading}
            disabled={code.length < smsLength || sending}
            onClick={this.handleSubmit}
          >
            <Trans id="Login.00024" defaultMessage="下一步" />
          </Button>
        </div>
      </>
    )
  }
}

export default AdDomainVerify
