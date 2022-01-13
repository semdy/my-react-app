import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Form, Input, Button } from 'antd'
import { password } from '@/utils/validator'
import { setLoginPassword } from '@/models/login'
import { enterTeam } from '@/services/user'
import cookieManager from '@/utils/cookie'
import { dealLoginWithRedirectUri } from '@/utils/utils'
import { intl, Trans } from '@/locales'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

@StepWrapper({ title: intl.t({ id: 'Login.00099', defaultMessage: '修改密码' }) })
@connect(({ login }) => ({
  login
}))
class ModifyPassword extends PureComponent {
  formRef = React.createRef()

  constructor(props) {
    super(props)
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
          <Trans id="Login.00100" defaultMessage="请输入您的新密码" />
        </h4>
        <div className={styles.passwordBox}>
          <Form.Item
            name="password"
            validateTrigger="onBlur"
            rules={[
              {
                required: true,
                message: intl.t({ id: 'Login.00101', defaultMessage: '请输入密码' })
              },
              { validator: password() }
            ]}
            help={intl.t({ id: 'Login.00102', defaultMessage: '至少8个字符，同时包含字母和数字' })}
          >
            <Input.Password
              size="large"
              placeholder={intl.t({ id: 'Login.00101', defaultMessage: '请输入密码' })}
            />
          </Form.Item>
          <Form.Item
            name="repeatPassword"
            className={styles.repeatPassword}
            rules={[
              {
                required: true,
                message: intl.t({ id: 'Login.00101', defaultMessage: '请输入密码' })
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error(intl.t({ id: 'Login.00103', defaultMessage: '请保持两次密码一致' }))
                  )
                }
              })
            ]}
          >
            <Input.Password
              size="large"
              placeholder={intl.t({ id: 'Login.00104', defaultMessage: '请重新输入密码' })}
            />
          </Form.Item>
        </div>
        <div className={styles.verifyAction}>
          <div />
          <Button size="large" type="primary" htmlType="submit" loading={loading}>
            <Trans id="Login.00093" defaultMessage="下一步" />
          </Button>
        </div>
      </Form>
    )
  }
}

export default ModifyPassword
