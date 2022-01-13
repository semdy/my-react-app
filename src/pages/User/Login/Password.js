import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Form, Input, Button } from 'antd'
// import { password } from '@/utils/validator'
import { loginWithPassword } from '@/models/login'
import { enterTeam } from '@/services/user'
import appConfig from '@/config/app'
import cookieManager from '@/utils/cookie'
import { intl, Trans } from '@/locales'
import { dealLoginWithRedirectUri, getRedirectUri } from '@/utils/utils'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

@StepWrapper({ title: intl.t({ id: 'Login.00105', defaultMessage: '输入密码' }) })
@connect(({ login }) => ({
  login
}))
class PasswordPage extends PureComponent {
  formRef = React.createRef()

  mobileFromCache = localStorage.getItem('ims_mobile')

  mailFromCache = localStorage.getItem('ims_mail')

  state = {
    loading: false,
    validateStatus: '',
    help: undefined
  }

  setLoading(status) {
    this.setState({
      loading: status
    })
  }

  setHelp(text) {
    this.setState({
      help: text,
      validateStatus: text ? 'error' : ''
    })
  }

  getMobile = () => {
    const {
      login: { loginMobile }
    } = this.props
    const imsMobile = localStorage.getItem('ims_mobile')
    return loginMobile || imsMobile || ''
  }

  handleVerifyLogin = () => {
    const { history } = this.props

    let redirectUri = getRedirectUri()
    if (redirectUri) {
      redirectUri = `?redirectUri=${redirectUri}`
    }

    const loginMobile = this.getMobile()

    if (loginMobile) {
      history.push(`/user/login/verify/login${redirectUri}`)
    } else {
      history.push(`/user/mailLogin/verify/login${redirectUri}`)
    }
  }

  handleForget = () => {
    const { history } = this.props

    let redirectUri = getRedirectUri()
    if (redirectUri) {
      redirectUri = `?redirectUri=${redirectUri}`
    }

    const loginMobile = this.getMobile()

    if (loginMobile) {
      history.push(`/user/login/verify/forget${redirectUri}`)
    } else {
      history.push(`/user/mailLogin/verify/forget${redirectUri}`)
    }
  }

  handleFormFinish = ({ password }) => {
    const {
      login: { loginMobile, loginMail },
      history,
      dispatch
    } = this.props

    this.setLoading(true)
    const mobile = loginMobile || this.mobileFromCache
    const mail = loginMail || this.mailFromCache
    dispatch(
      loginWithPassword(
        {
          account: mobile || mail,
          password,
          type: mobile ? 1 : 2,
          softwareId: appConfig.softwareId
        },
        {
          callback: async () => {
            const response = await enterTeam({})
            if (response.needSetPassword) {
              history.push('/user/login/password')
            } else {
              let route = ''
              switch (String(response.teamType)) {
                case '1':
                  route = '/user/login/choice'
                  break
                case '2':
                  route = '/user/login/create/improve'
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
          }
        }
      )
    )
      .catch(e => {
        this.setHelp(e.message)
      })
      .finally(() => {
        this.setLoading(false)
      })
  }

  handleFormFinishFailed = () => {
    this.setState({
      validateStatus: 'error'
    })
  }

  render() {
    const {
      login: { loginMobile, loginMail }
    } = this.props

    const { loading, help, validateStatus } = this.state

    return (
      <Form
        ref={this.formRef}
        onFinish={this.handleFormFinish}
        onFinishFailed={this.handleFormFinishFailed}
        initialValues={{ password: '' }}
      >
        <h4>
          <Trans
            id="Login.00106"
            defaultMessage="请输入{account}的密码完成登录"
            values={{
              account: loginMobile || loginMail || this.mobileFromCache || this.mailFromCache
            }}
          />
        </h4>
        <div className={styles.passwordBox}>
          <Form.Item
            name="password"
            validateStatus={validateStatus}
            help={help}
            rules={[
              {
                required: true,
                message: intl.t({ id: 'Login.00107', defaultMessage: '请输入密码' })
              } /* , { validator: password() } */
            ]}
          >
            <Input.Password
              autoFocus
              size="large"
              placeholder={intl.t({ id: 'Login.00107', defaultMessage: '请输入密码' })}
              onChange={e => {
                const val = e.target.value
                if (val.length === 0) {
                  this.setHelp(intl.t({ id: 'Login.00107', defaultMessage: '请输入密码' }))
                } else {
                  this.setHelp('')
                }
              }}
            />
          </Form.Item>
        </div>
        <a className={styles.verify} onClick={this.handleForget}>
          <Trans id="Login.00108" defaultMessage="忘记密码" />
        </a>
        <div className={styles.verifyAction}>
          <a className={styles.verify} onClick={this.handleVerifyLogin}>
            <Trans id="Login.00109" defaultMessage="验证码登录" />
          </a>
          <Button size="large" type="primary" htmlType="submit" loading={loading}>
            <Trans id="Login.00110" defaultMessage="下一步" />
          </Button>
        </div>
      </Form>
    )
  }
}

export default PasswordPage
