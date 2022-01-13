import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Checkbox, Form, Button, Input, Select, Modal } from 'antd'
import { intl, Trans } from '@/locales'
import UserSlider from '@/components/UserSlider'
import { getAccountStatus, setLoginMobile, resetUserStatus } from '@/models/login'
import { validateByCountry } from '@/utils/validator'
import { clearCountDownCache, getRedirectUri, getRegionInfo } from '@/utils/utils'
import { getCountryList } from '@/services/user'
import LoginEntryIcon from './LoginEntryIcon'
import styles from './index.module.less'

const FormItem = Form.Item
const { Option } = Select

const USER_STATUS = {
  1001: 'LOGIN_WITH_VERIFY',
  1002: 'LOGIN_WITH_PWD',
  1003: 'LOGIN_WITH_NO'
}

@connect(({ login }) => ({
  login
}))
class LoginPage extends PureComponent {
  formRef = React.createRef()

  state = {
    // country: '中国',
    phoneCode: '+86',
    mobile: '',
    autoLogin: true,
    loading: false,
    validateStatus: '',
    help: undefined,
    countries: getRegionInfo(),
    fields: [
      {
        name: ['mobile'],
        value: ''
      }
      // {
      //   name: ['country'],
      //   value: 1001
      // }
    ]
  }

  componentDidMount() {
    getCountryList()
      .then(value => {
        const countries = value.countryList
        if (Object.prototype.toString.call(countries) === '[object Array]') {
          this.setState({ countries })
        }
      })
      .catch(e => console.log(e))
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
      let route = ''
      switch (userStatus) {
        case 'LOGIN_WITH_VERIFY':
          route = 'verify/register'
          break
        case 'LOGIN_WITH_PWD':
          route = 'password'
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
        history.push(`/user/login/${route}?redirectUri=${redirectUri}`)
      } else {
        history.push(`/user/login/${route}`)
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

  doLogin = () => {}

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

  handleAdDomainLogin = e => {
    e.preventDefault()
    const { history } = this.props
    const redirectUri = getRedirectUri()
    if (redirectUri) {
      history.push(`/user/adDomain?redirectUri=${redirectUri}`)
    } else {
      history.push('/user/adDomain')
    }
  }

  // handleRegister = () => {
  //   const { history } = this.props
  //   history.push('/user/register')
  // }

  handleCreateImprove = () => {
    const { history } = this.props
    history.push('/user/login/create/improve')
  }

  handleNoTeam = () => {
    const modalEvent = Modal.warning({
      title: intl.t({ id: 'Login.00062', defaultMessage: '登陆错误' }),
      content: (
        <div>
          <div>
            <Trans
              id="Login.00063"
              defaultMessage="系统中尚未查询到您的团队信息，您可以选择<span>创建新团队</span>"
              values={{
                span: text => (
                  <span
                    className={styles.titleDescCreate}
                    onClick={() => {
                      modalEvent.destroy()
                      this.handleCreateImprove()
                    }}
                  >
                    {text}
                  </span>
                )
              }}
            />
          </div>
          <div>
            <Trans id="Login.00064" defaultMessage="若您已有团队，请联系团队管理员确认" />
          </div>
        </div>
      ),
      className: styles.onTeamModal,
      width: 470,
      okText: intl.t({ id: 'Login.00065', defaultMessage: '了解' })
    })
  }

  handleFormFinish = ({ /* region, */ mobile }) => {
    const { dispatch } = this.props
    this.setLoading(true)
    dispatch(setLoginMobile(mobile))
    dispatch(getAccountStatus({ account: mobile, type: 1, countryNo: this.props.login.countryNo }))
      .catch(e => {
        this.setHelp(e.message)
      })
      .finally(() => {
        this.setLoading(false)
      })
    clearCountDownCache()
    localStorage.setItem('ims_mobile', mobile)
  }

  handleFormFinishFailed = ({ errorFields }) => {
    this.setState({
      validateStatus: 'error'
    })
    if (errorFields && errorFields.length > 0) {
      this.setHelp(errorFields[0].errors[0])
    }
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

  renderPhoneCode = () => {
    const { countries } = this.state
    return (
      <FormItem
        noStyle
        name="country"
        rules={[
          {
            required: true,
            message: intl.t({ id: 'Login.00066', defaultMessage: '请选择国家' })
          }
        ]}
      >
        <Select
          size="large"
          className={styles.phoneCode}
          onChange={value => {
            const { dispatch } = this.props
            const form = this.formRef.current
            const { mobile } = form.getFieldsValue()
            const [phoneCode, countryNo] = value.split('|')
            this.setState({ mobile, phoneCode })
            dispatch({
              type: 'setCountryNo',
              payload: { countryNo }
            })
          }}
        >
          {countries.map(country => (
            <Option value={`${country.phoneCode}|${country.countryNo}`} key={country.countryNo}>
              {country.phoneCode}
            </Option>
          ))}
        </Select>
      </FormItem>
    )
  }

  render() {
    const { children, login } = this.props
    const {
      mobile,
      autoLogin,
      phoneCode,
      /* countries, */
      loading,
      help,
      validateStatus,
      fields
    } = this.state

    // const selectRegion = getFieldDecorator('region', {
    //   initialValue: region
    // })(
    //   <Select style={{ width: 90 }} value={phoneCode} size="large">
    //     {/* 数据只跟国家走不能自选  */}
    //   </Select>
    // )

    // const selectRegion = (
    //   <Select style={{ width: 90 }} value={phoneCode} size="large" disabled>
    //   </Select>
    // )

    return (
      <div className={styles.main}>
        <div className={styles.aside}>
          <UserSlider />
        </div>
        <div className={styles.login}>
          <h1>
            <Trans id="Login.00067" defaultMessage="手机号登录" />
          </h1>
          <LoginEntryIcon
            entry="login"
            type="qrcode"
            title={intl.t({ id: 'Login.00068', defaultMessage: '扫码登录' })}
          />
          <div className={styles.titleDesc}>
            <Trans id="Login.00069" defaultMessage="还没有团队?" />
            <span className={styles.titleDescCreate} onClick={this.handleCreateImprove}>
              <Trans id="Login.00070" defaultMessage="免费创建" />
            </span>
          </div>
          <Form
            ref={this.formRef}
            validateTrigger="onSubmit"
            onFinish={this.handleFormFinish}
            onFinishFailed={this.handleFormFinishFailed}
            fields={fields}
            initialValues={{
              country: phoneCode,
              mobile,
              autoLogin
            }}
            onFieldsChange={this.handleFieldsChange}
          >
            {/* <FormItem className="form-item-with-addon">
              <span className="form-item-addon">国家</span>
              <FormItem
                name="country"
                noStyle
                rules={[
                  {
                    required: true,
                    message: '请选择国家'
                  }
                ]}
              >
                <Select
                  size="large"
                  onChange={value => {
                    const { dispatch } = this.props
                    const form = this.formRef.current
                    const { mobile } = form.getFieldsValue()
                    const [phoneCode, countryNo] = value.split('|')
                    this.setState({ mobile, phoneCode })
                    dispatch({
                      type: 'setCountryNo',
                      payload: { countryNo }
                    })
                  }}
                >
                  {countries.map(country => (
                    <Option
                      value={`${country.phoneCode}|${country.countryNo}`}
                      key={country.countryNo}
                    >
                      {country.countryName}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </FormItem> */}
            <FormItem
              className={styles.p}
              name="mobile"
              validateStatus={validateStatus}
              help={help}
              rules={[
                {
                  required: true,
                  message: intl.t({ id: 'Login.00071', defaultMessage: '请输入手机号' })
                },
                {
                  validator: validateByCountry(login.countryNo)()
                }
              ]}
            >
              <Input
                // addonBefore={selectRegion}
                addonBefore={this.renderPhoneCode()}
                size="large"
                placeholder={intl.t({ id: 'Login.00071', defaultMessage: '请输入手机号' })}
                autoFocus
                onChange={e => {
                  const val = e.target.value
                  if (val.length === 0) {
                    this.setHelp(intl.t({ id: 'Login.00071', defaultMessage: '请输入手机号' }))
                  } else {
                    this.setHelp('')
                  }
                }}
              />
            </FormItem>
            <FormItem>
              <a className={styles.verify}>
                <span className={styles.loginWithMail} onClick={this.handleMailLogin}>
                  <Trans id="Login.00072" defaultMessage="邮箱登录" />
                </span>
              </a>
              <a className={styles.verify}>
                <span className={styles.loginWithMail} onClick={this.handleAdDomainLogin}>
                  <Trans id="Login.00073" defaultMessage="AD域登录" />
                </span>
              </a>
            </FormItem>
            <FormItem className={styles.rememberLogin}>
              <FormItem name="autoLogin" valuePropName="checked" noStyle>
                <Checkbox style={{ marginTop: 9 }}>
                  <Trans id="Login.00074" defaultMessage="15天内自动登录" />
                </Checkbox>
              </FormItem>
              <Button
                size="large"
                className={styles.loginButton}
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                <Trans id="Login.00024" defaultMessage="下一步" />
              </Button>
            </FormItem>
            {/*
              <div className={styles.logonDesc}>
                <span>还没有账号?</span>
                <span className={styles.logonDescLink} onClick={this.handleRegister}>
                  点击注册
                </span>
              </div>createHelperLogon
             */}
            <div className={styles.createHelper}>
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
          </Form>
        </div>
        {children}
      </div>
    )
  }
}

export default LoginPage
