import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Button } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import { intl, Trans } from '@/locales'
import VerifyInput from '@/components/VerifyInput'
import CountDown from '@/components/CountDown'
import { enterTeam } from '@/services/user'
import { sendSmsCode, verifySmsCode, userCreateTeam, setCreateImprove } from '@/models/login'
import appConfig from '@/config/app'
import cookieManager from '@/utils/cookie'
import { dealLoginWithRedirectUri, getRedirectUri, isJSON } from '@/utils/utils'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

@StepWrapper({ title: intl.t({ id: 'Login.00127', defaultMessage: '验证联系方式' }) })
@connect(({ login }) => ({
  login
}))
class VerifyPage extends PureComponent {
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
      Math.ceil((Date.now() - lastCountDownStamp) / 1000),
      this.countDuration
    )
    this.countDown = lastCountDownStamp <= 0 ? this.countDuration : this.countDuration - countPeriod

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
        case 'createTeam':
          this.handleResend()
          break
        case 'forget':
          this.verifyForget()
          break
        default:
          break
      }
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

  getCurrentMobile() {
    const {
      login: { createMobile, loginMobile }
    } = this.props
    let mobile = ''
    if (this.fromUrl === 'team') {
      mobile = createMobile
    } else {
      mobile = loginMobile
    }

    return mobile || localStorage.getItem('ims_mobile') || ''
  }

  setSending(status) {
    this.setState({
      sending: status
    })
  }

  setLoading(status) {
    this.setState({
      loading: status
    })
  }

  onKeyDown = e => {
    const { sending, code, smsLength } = this.state

    if (e.keyCode === 13 && !(code.length < smsLength || sending)) {
      this.handleSubmit()
    }
  }

  handleSubmit = () => {
    const {
      dispatch,
      history,
      login: { countryNo }
    } = this.props
    const { code } = this.state
    this.setLoading(true)
    let canEndLoading = true

    dispatch(
      verifySmsCode(
        {
          account: this.getCurrentMobile(),
          smsCode: code,
          type: 1,
          countryNo,
          softwareId: appConfig.softwareId
        },
        {
          callback: async () => {
            const response = await enterTeam({})
            switch (this.fromUrl) {
              case 'register':
                history.push('/user/login/setPassword')
                break
              case 'createTeam':
                // if (String(response.teamType) === '3') {
                //   localStorage.setItem('ims_teamId', response.teamId)
                //   cookieManager.setCookie('ims_teamId', response.teamId)
                //   dealLoginWithRedirectUri()
                // }
                canEndLoading = false
                this.handleRegister(response.needSetPassword)
                break
              case 'forget':
                history.push('/user/login/modifyPassword')
                break
              case 'login':
                if (response.needSetPassword) {
                  // history.push('/user/login/password')
                  history.push('/user/login/setPassword')
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
            if (!canEndLoading) return
            this.setLoading(false)
          }
        }
      )
    ).catch(() => {
      this.setLoading(false)
    })
  }

  handleRegister = (needSetPassword = false) => {
    const {
      dispatch,
      history,
      login: { createImprove }
    } = this.props
    let imsCreateImprove = localStorage.getItem('ims_createImprove')
    if (isJSON(imsCreateImprove)) {
      imsCreateImprove = JSON.parse(imsCreateImprove)
    }

    const createInfo = createImprove.mobile ? createImprove : imsCreateImprove

    if (!(createInfo && createInfo.mobile)) {
      this.setLoading(false)
      return
    }

    dispatch(
      userCreateTeam(createInfo, {
        callback: () => {
          // 清空储存的创建团队信息
          dispatch(setCreateImprove({}))
          localStorage.removeItem('ims_createImprove')

          if (needSetPassword) {
            history.push('/user/login/setPassword/createTeam')
          } else {
            history.push('/user/createSuccess')
            // history.push('/user/login/team/invite')
          }
        }
      })
    ).finally(() => {
      this.setLoading(false)
    })
  }

  handleResend = () => {
    const { dispatch } = this.props
    if (this.state.sending) return
    this.setSending(true)
    dispatch(
      sendSmsCode({
        mobile: this.getCurrentMobile(),
        type: 100,
        countryNo: this.props.login.countryNo
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

  getMobile = () => {
    const {
      login: { loginMobile }
    } = this.props
    const imsMobile = localStorage.getItem('ims_mobile')
    return loginMobile || imsMobile || ''
  }

  verifyLogin = () => {
    const { dispatch } = this.props

    this.setSending(true)
    dispatch(
      sendSmsCode({
        mobile: this.getMobile(),
        type: 100,
        countryNo: this.props.login.countryNo
      })
    ).finally(() => {
      this.setSending(false)
    })
  }

  verifyRegister = () => {
    const { dispatch } = this.props

    this.setSending(true)
    dispatch(
      sendSmsCode({
        mobile: this.getMobile(),
        type: 101,
        countryNo: this.props.login.countryNo
      })
    ).finally(() => {
      this.setSending(false)
    })
  }

  verifyForget = () => {
    const { dispatch } = this.props

    this.setSending(true)
    dispatch(
      sendSmsCode({
        mobile: this.getMobile(),
        type: 102,
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
    const { sending, loading, code, smsLength } = this.state

    return (
      <>
        <div className={styles.sendToMsg}>
          <Trans
            id="Login.00128"
            defaultMessage="验证码已发送至您的手机：{mobile}"
            values={{ mobile: this.getCurrentMobile() }}
          />
        </div>
        <div className={styles.sendHint}>
          <Trans id="Login.00129" defaultMessage="请输入验证码" />
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
        <div className={classNames([styles.verifyActions])}>
          {this.fromUrl === 'login' ? (
            <a className={styles.verify} onClick={this.handleLogin}>
              <Trans id="Login.00130" defaultMessage="密码登录" />
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
            <Trans id="Login.00024" defaultMessage="下一步" />
          </Button>
        </div>
      </>
    )
  }
}

export default VerifyPage
