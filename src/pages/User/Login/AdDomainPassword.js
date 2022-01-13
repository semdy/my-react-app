import React, { PureComponent } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'
import { Form, Input, Button, notification } from 'antd'
import { setLoginToken } from '@/models/login'
import { enterTeam } from '@/services/user'
import cookieManager from '@/utils/cookie'
import { dealLoginWithRedirectUri, getRedirectUri } from '@/utils/utils'
import { intl, Trans } from '@/locales'
import appConfig from '@/config/app'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

const notificationKey = 'domainLoginError'

const makeRequest = (url, data) => {
  return fetch(url, {
    body: JSON.stringify(data),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      version: appConfig.versionId
    },
    method: 'POST'
  }).then(response => response.json())
}

@StepWrapper({ title: '输入密码' })
@connect(({ login }) => ({
  login
}))
class AdDomainPassword extends PureComponent {
  formRef = React.createRef()

  state = {
    loading: false,
    validateStatus: '',
    help: undefined,
    domainAccount: '',
    domainControlUrl: ''
  }

  componentDidMount() {
    this.getDomainInfo()
  }

  getDomainInfo() {
    const domainAccount = localStorage.getItem('ims_domainAccount')
    const domainControlUrl = localStorage.getItem('ims_domainControlUrl')

    if (domainAccount && domainControlUrl) {
      this.setState({
        domainAccount,
        domainControlUrl
      })
    } else {
      const { history } = this.props
      const redirectUri = getRedirectUri()
      if (redirectUri) {
        history.replace(`/user/adDomain?redirectUri=${redirectUri}`)
      } else {
        history.replace('/user/adDomain')
      }
    }
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

  handleFormFinish = ({ password }) => {
    const {
      // login: { loginMobile, loginMail },
      dispatch,
      history
    } = this.props
    const { domainAccount, domainControlUrl } = this.state

    this.setLoading(true)
    const url = `${domainControlUrl}/ad/auth`
    const data = {
      username: domainAccount,
      password,
      softwareId: appConfig.softwareId
    }
    makeRequest(url, data)
      .then(res => {
        if (res.code === 0) {
          if (res.data.token) {
            dispatch({
              type: 'setToken',
              payload: res.data
            })
            setLoginToken(res.data.token)
            localStorage.setItem('ims_teamName', res.data.teamName)
          }
          if (res.data.needBindMobile) {
            const redirectUri = getRedirectUri()
            if (redirectUri) {
              history.push(`/user/adDomain/bindMobile?redirectUri=${redirectUri}`)
            } else {
              history.push('/user/adDomain/bindMobile')
            }
          } else {
            this.handleLogin()
          }
        } else {
          notification.error({
            key: notificationKey,
            message: res.message
          })
        }
      })
      .catch(() => {
        notification.error({
          key: notificationKey,
          message: intl.t({ id: 'Login.00025', defaultMessage: '请检查域控服务器' })
        })
      })
      .finally(() => {
        this.setLoading(false)
      })
  }

  handleLogin = async () => {
    const { history } = this.props

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

  handleFormFinishFailed = () => {
    this.setState({
      validateStatus: 'error'
    })
  }

  render() {
    // const {
    //   login: { loginMobile, loginMail }
    // } = this.props

    const { loading, help, validateStatus, domainAccount } = this.state

    return (
      <Form
        ref={this.formRef}
        onFinish={this.handleFormFinish}
        onFinishFailed={this.handleFormFinishFailed}
        initialValues={{ password: '' }}
      >
        <h4>
          <Trans
            id="Login.00026"
            defaultMessage="请输入{account}的密码完成登录"
            values={{ account: domainAccount }}
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
                message: intl.t({ id: 'Login.00027', defaultMessage: '请输入密码' })
              } /* , { validator: password() } */
            ]}
          >
            <Input.Password
              autoFocus
              size="large"
              placeholder={intl.t({ id: 'Login.00027', defaultMessage: '请输入密码' })}
              onChange={e => {
                const val = e.target.value
                if (val.length === 0) {
                  this.setHelp(intl.t({ id: 'Login.00027', defaultMessage: '请输入密码' }))
                } else {
                  this.setHelp('')
                }
              }}
            />
          </Form.Item>
        </div>
        {/*
          <a className={styles.verify} onClick={this.handleForget}>
            忘记密码
          </a>
         */}
        <div className={classNames(styles.verifyAction, styles.right)}>
          <Button size="large" type="primary" htmlType="submit" loading={loading}>
            <Trans id="Login.00024" defaultMessage="下一步" />
          </Button>
        </div>
      </Form>
    )
  }
}

export default AdDomainPassword
