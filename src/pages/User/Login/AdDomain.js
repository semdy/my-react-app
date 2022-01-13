import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Checkbox, Form, Button, Input, Modal } from 'antd'
import { intl, Trans } from '@/locales'
import UserSlider from '@/components/UserSlider'
import { resetUserStatus } from '@/models/login'
import { getRedirectUri } from '@/utils/utils'
import { getDomainUrl } from '@/services/user'
import styles from './index.module.less'

const USER_STATUS = {
  1001: 'LOGIN_WITH_VERIFY',
  1002: 'LOGIN_WITH_PWD',
  1003: 'LOGIN_WITH_NO'
}

@connect(({ login }) => ({
  login
}))
class AdDomain extends PureComponent {
  formRef = React.createRef()

  state = {
    autoLogin: true,
    loading: false,
    fields: [
      {
        name: ['domainAccount'],
        value: ''
      }
    ]
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextUserStatus = USER_STATUS[nextProps.login.userStatus]
    if (nextUserStatus !== prevState.userStatus) {
      return {
        userStatus: nextUserStatus
      }
    }
    return null
  }

  componentDidUpdate(prevProps, prevState) {
    const { userStatus } = this.state
    const { history, dispatch } = this.props
    if (prevState.userStatus !== userStatus) {
      let route = '/user/mailLogin'
      switch (userStatus) {
        case 'LOGIN_WITH_VERIFY':
          route = '/user/mailLogin/verify/register'
          break
        case 'LOGIN_WITH_PWD':
          route = '/user/login/password'
          break
        case 'LOGIN_WITH_NO':
          this.handleNoTeam()
          break
        default:
          return this.doLogin()
      }
      dispatch(resetUserStatus())
      const redirectUri = getRedirectUri()
      if (redirectUri) {
        history.push(`${route}?redirectUri=${redirectUri}`)
      } else {
        history.push(`${route}`)
      }
    }
  }

  // componentWillUnmount = () => {
  //   this.setState = (state, callback) => {
  //   }
  // }

  setLoading(status) {
    this.setState({
      loading: status
    })
  }

  doLogin = () => {}

  handleNoTeam = () => {
    Modal.warning({
      title: intl.t({ id: 'Login.00001', defaultMessage: '登陆错误' }),
      content: intl.t({
        id: 'Login.00002',
        defaultMessage: '您的资料不属于任何企业，请向您的企业管理员确认'
      }),
      className: styles.onTeamModal,
      okText: intl.t({ id: 'Login.00004', defaultMessage: '了解' })
    })
  }

  handleMobileLogin = e => {
    e.preventDefault()
    const { history } = this.props
    const redirectUri = getRedirectUri()
    if (redirectUri) {
      history.push(`/user/login?redirectUri=${redirectUri}`)
    } else {
      history.push('/user/login')
    }
  }

  handleMailLogin = e => {
    e.preventDefault()
    const { history } = this.props
    const redirectUri = getRedirectUri()
    if (redirectUri) {
      history.push(`/user/mailLogin?redirectUri=${redirectUri}`)
    } else {
      history.push('/user/mailLogin')
    }
  }

  handleFormFinish = async ({ domainAccount }) => {
    const { history } = this.props
    this.setLoading(true)
    getDomainUrl({ domainAccount })
      .then(res => {
        localStorage.setItem('ims_domainAccount', domainAccount)
        localStorage.setItem('ims_domainControlUrl', res.domainControlUrl)

        const redirectUri = getRedirectUri()
        if (redirectUri) {
          history.push(`/user/adDomain/password?redirectUri=${redirectUri}`)
        } else {
          history.push('/user/adDomain/password')
        }
      })
      .finally(() => {
        this.setLoading(false)
      })
  }

  handleFieldsChange = v => {
    const newObj = { ...v[0] }

    if (typeof newObj.value === 'string') {
      newObj.value = newObj.value.replace(/\s/g, '')
    }

    this.setState({
      fields: [newObj]
    })
  }

  render() {
    const { children } = this.props
    const { autoLogin, loading, fields } = this.state

    return (
      <div className={styles.main}>
        <div className={styles.aside}>
          <UserSlider />
        </div>
        <div className={styles.login}>
          <h1>
            <Trans id="Login.00005" defaultMessage="AD域登录" />
          </h1>
          <Form
            ref={this.formRef}
            onFinish={this.handleFormFinish}
            validateTrigger="onBlur"
            initialValues={{
              domainAccount: '',
              autoLogin
            }}
            fields={fields}
            onFieldsChange={this.handleFieldsChange}
          >
            <Form.Item
              className={styles.mailBox}
              name="domainAccount"
              rules={[
                {
                  required: true,
                  message: intl.t({ id: 'Login.00006', defaultMessage: '请输入域账号' })
                }
              ]}
            >
              <Input
                size="large"
                placeholder={intl.t({ id: 'Login.00007', defaultMessage: '域账号' })}
                autoFocus
              />
            </Form.Item>
            <Form.Item>
              <a className={styles.verify}>
                <span className={styles.loginWithMail} onClick={this.handleMobileLogin}>
                  <Trans id="Login.00008" defaultMessage="手机号登录" />
                </span>
              </a>
              <a className={styles.verify}>
                <span className={styles.loginWithMail} onClick={this.handleMailLogin}>
                  <Trans id="Login.00009" defaultMessage="邮箱登录" />
                </span>
              </a>
            </Form.Item>
            <Form.Item className={styles.rememberLogin}>
              <Form.Item noStyle name="autoLogin" valuePropName="checked">
                <Checkbox style={{ marginTop: 9 }}>
                  <Trans id="Login.00010" defaultMessage="15天内自动登录" />
                </Checkbox>
              </Form.Item>
              <Button
                size="large"
                className={styles.loginButton}
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                <Trans id="Login.00011" defaultMessage="下一步" />
              </Button>
            </Form.Item>
          </Form>
          <div className={styles.createHelperEmail}>
            <Trans id="Login.00012" defaultMessage="点击下一步代表您已同意并阅读" />
            <Trans
              id="Login.00013"
              defaultMessage="<service>《IMSDOM协议》</service>和<privacy>《隐私政策》</privacy>"
              values={{
                service: text => (
                  <a
                    href="https://www.imsdom.com/service"
                    data-target="internal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {text}
                  </a>
                ),
                privacy: text => (
                  <a
                    href="https://www.imsdom.com/privacy"
                    data-target="internal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {text}
                  </a>
                )
              }}
            />
          </div>
        </div>
        {children}
      </div>
    )
  }
}

export default AdDomain
