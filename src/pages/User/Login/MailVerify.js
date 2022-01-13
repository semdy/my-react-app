import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Button } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import VerifyInput from '@/components/VerifyInput'
import CountDown from '@/components/CountDown'
import { enterTeam } from '@/services/user'
import { sendMailCode, verifySmsCode } from '@/models/login'
import appConfig from '@/config/app'
import cookieManager from '@/utils/cookie'
import { intl, Trans } from '@/locales'
import { dealLoginWithRedirectUri, getRedirectUri } from '@/utils/utils'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

@StepWrapper({ title: intl.t({ id: 'Login.00094', defaultMessage: '验证联系方式' }) })
@connect(({ login }) => ({
  login
}))
class MailVerifyPage extends PureComponent {
  fromUrl = ''

  state = {
    code: '',
    sending: false,
    loading: false,
    smsLength: 6
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
    if (this.countDown === this.countDuration) {
      switch (this.fromUrl) {
        case 'register':
          this.verifyRegister()
          break
        case 'login':
          this.verifyLogin()
          break
        case 'forget':
          this.verifyForget()
          break
        default:
          break
      }
    }
  }

  componentWillUnmount() {
    if (this.countDown < this.countDuration) {
      localStorage.setItem(
        `_lastCountDownStamp:${this.fromUrl}`,
        Date.now() - (this.countDuration - this.countDown) * 1000
      )
    }
  }

  handleCountDown(count, complete) {
    this.countDown = count
    if (complete) {
      this.countDown = this.countDuration
      localStorage.removeItem(`_lastCountDownStamp:${this.fromUrl}`)
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

  getCurrentMail() {
    const {
      login: { createMail, loginMail }
    } = this.props
    let mail = ''
    if (this.fromUrl === 'team') {
      mail = createMail
    } else {
      mail = loginMail
    }
    if (!mail) {
      this.props.history.push('/user/mailLogin')
    }
    return mail
  }

  handleSubmit = () => {
    const { dispatch, history } = this.props
    const { code } = this.state
    this.setLoading(true)
    dispatch(
      verifySmsCode(
        {
          account: this.getCurrentMail(),
          smsCode: code,
          type: 2,
          countryNo: '',
          softwareId: appConfig.softwareId
        },
        {
          callback: async () => {
            const response = await enterTeam({})
            switch (this.fromUrl) {
              case 'register':
                history.push('/user/login/setPassword')
                break
              case 'forget':
                history.push('/user/login/modifyPassword')
                break
              case 'login':
                if (response.needSetPassword) {
                  history.push('/user/login/password')
                } else {
                  let route = ''
                  switch (String(response.teamType)) {
                    case '1':
                      route = '/user/login/choice'
                      break
                    case '2':
                      route = '/user/login/choice'
                      break
                    case '3':
                      localStorage.setItem('ims_teamId', response.teamId)
                      cookieManager.setCookie('ims_teamId', response.teamId)
                      route = '/'
                      break
                    default:
                      break
                  }
                  if (route === '/') {
                    dealLoginWithRedirectUri()
                  } else {
                    history.push(route)
                  }
                }
                break
              default:
                break
            }
          }
        }
      )
    ).finally(() => {
      this.setLoading(false)
    })
  }

  handleResend = () => {
    const {
      dispatch,
      login: { loginMail }
    } = this.props
    if (this.state.sending) return
    this.setSending(true)
    dispatch(
      sendMailCode({
        email: loginMail,
        type: 100
      })
    ).finally(() => {
      this.setSending(false)
    })
  }

  handleLogin = e => {
    e.preventDefault()
    const { history } = this.props
    const redirectUri = getRedirectUri()
    if (redirectUri) {
      history.push(`/user/login/password?redirectUri=${redirectUri}`)
    } else {
      history.push('/user/login/password')
    }
  }

  getMail = () => {
    const {
      login: { loginMail }
    } = this.props
    const imsMail = localStorage.getItem('ims_mail')
    return loginMail || imsMail || ''
  }

  verifyLogin = () => {
    const { dispatch } = this.props

    this.setSending(true)
    dispatch(
      sendMailCode({
        email: this.getMail(),
        type: 100
      })
    ).finally(() => {
      this.setSending(false)
    })
  }

  verifyRegister = () => {
    const { dispatch } = this.props

    this.setSending(true)
    dispatch(
      sendMailCode({
        email: this.getMail(),
        type: 101
      })
    ).finally(() => {
      this.setSending(false)
    })
  }

  verifyForget = () => {
    const { dispatch } = this.props

    this.setSending(true)
    dispatch(
      sendMailCode({
        email: this.getMail(),
        type: 102
      })
    ).finally(() => {
      this.setSending(false)
    })
  }

  handleVerifyChange = code => {
    this.setState({ code })
  }

  render() {
    const { sending, loading, code, smsLength } = this.state
    return (
      <>
        <div className={styles.sendToMsg}>
          <Trans
            id="Login.00095"
            defaultMessage="验证码已发送至您的邮箱：{mail}"
            values={{ mail: this.getCurrentMail() }}
          />
        </div>
        <div className={styles.sendHint}>
          <Trans id="Login.00096" defaultMessage="请输入验证码" />
        </div>
        <div className={styles.sendInput}>
          <VerifyInput count={smsLength} onChange={this.handleVerifyChange} />
        </div>
        <div className={styles.resend}>
          {sending ? (
            <>
              <LoadingOutlined />
              <span>
                <Trans id="Login.00097" defaultMessage="发送中..." />
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
                  <Trans
                    id="Login.00039"
                    defaultMessage="{count}s后重新发送验证码"
                    values={{ count }}
                  />
                )
              }}
            </CountDown>
          )}
        </div>
        <div className={classNames([styles.verifyActions])}>
          {this.fromUrl === 'login' ? (
            <a className={styles.verify} onClick={this.handleLogin}>
              <Trans id="Login.00098" defaultMessage="密码登录" />
            </a>
          ) : (
            <div />
          )}
          <Button
            size="large"
            type="primary"
            loading={loading}
            disabled={code.length < smsLength || sending}
            onClick={this.handleSubmit}
          >
            <Trans id="Login.00093" defaultMessage="下一步" />
          </Button>
        </div>
      </>
    )
  }
}

export default MailVerifyPage
