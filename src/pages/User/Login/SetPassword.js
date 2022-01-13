import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Form, Input, Button } from 'antd'
import cookieManager from '@/utils/cookie'
import { password } from '@/utils/validator'
import { enterTeam } from '@/services/user'
import { setLoginPassword } from '@/models/login'
import { dealLoginWithRedirectUri } from '@/utils/utils'
import { intl, Trans } from '@/locales'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

@StepWrapper({ title: intl.t({ id: 'Login.00117', defaultMessage: '设置密码' }) })
@connect(({ login }) => ({
  login
}))
class SetPasswordPage extends PureComponent {
  formRef = React.createRef()

  fromUrl = ''

  constructor(props) {
    super(props)

    const {
      match: { params }
    } = props
    this.fromUrl = params.from || ''

    this.state = {
      loading: false
    }
  }

  setLoading(status) {
    this.setState({
      loading: status
    })
  }

  handleFormFinish = ({ password }) => {
    const { history, dispatch } = this.props
    this.setLoading(true)
    dispatch(
      setLoginPassword(
        { password },
        {
          callback: async () => {
            const response = await enterTeam({})
            let route = ''
            switch (String(response.teamType)) {
              case '1':
                // if (this.fromUrl) {
                //   route = '/user/login/team/invite'
                // } else {
                //   route = '/user/login/choice'
                // }
                route = '/user/login/choice'
                break
              case '2':
                route = '/user/login/create/improve'
                break
              case '3':
                // if (this.fromUrl) {
                //   route = '/user/login/team/invite'
                // } else {
                //   localStorage.setItem('ims_teamId', response.teamId)
                //   cookieManager.setCookie('ims_teamId', response.teamId)
                //   route = '/'
                // }
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
      )
    ).finally(() => {
      this.setLoading(false)
    })
  }

  render() {
    const { loading } = this.state

    return (
      <Form
        ref={this.formRef}
        onFinish={this.handleFormFinish}
        initialValues={{
          password: ''
        }}
      >
        <h4>
          <Trans id="Login.00118" defaultMessage="为了您的账号安全，请设置密码" />
        </h4>
        <div className={styles.passwordBox}>
          <Form.Item
            name="password"
            validateTrigger="onBlur"
            rules={[
              {
                required: true,
                message: intl.t({ id: 'Login.00119', defaultMessage: '请设置密码' })
              },
              { validator: password() }
            ]}
            // help="至少8个字符，同时包含字母和数字"
          >
            <Input.Password
              size="large"
              placeholder={intl.t({ id: 'Login.00119', defaultMessage: '请设置密码' })}
            />
          </Form.Item>
          <Form.Item
            name="repeatPassword"
            className={styles.repeatPassword}
            rules={[
              {
                required: true,
                message: intl.t({ id: 'Login.00120', defaultMessage: '请重新输入密码' })
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error(intl.t({ id: 'Login.00121', defaultMessage: '请保持两次密码一致' }))
                  )
                }
              })
            ]}
          >
            <Input.Password
              size="large"
              placeholder={intl.t({ id: 'Login.00122', defaultMessage: '请重新输入密码' })}
            />
          </Form.Item>
        </div>
        <div className={styles.verifyAction}>
          <div> </div>
          <Button size="large" type="primary" htmlType="submit" loading={loading}>
            <Trans id="Login.00024" defaultMessage="下一步" />
          </Button>
        </div>
      </Form>
    )
  }
}

export default SetPasswordPage
