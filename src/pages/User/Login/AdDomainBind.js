import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Form, Button, Input, Select } from 'antd'
import { intl, Trans } from '@/locales'
import { validateByCountry } from '@/utils/validator'
import { clearCountDownCache, getRedirectUri, getRegionInfo } from '@/utils/utils'
import { getCountryList } from '@/services/user'
import StepWrapper from '@/pages/User/Login/StepWrapper'
import styles from './index.module.less'

const FormItem = Form.Item
const { Option } = Select

const USER_STATUS = {
  1001: 'LOGIN_WITH_VERIFY',
  1002: 'LOGIN_WITH_PWD',
  1003: 'LOGIN_WITH_NO'
}

@StepWrapper({ title: intl.t({ id: 'Login.00014', defaultMessage: '输入手机号' }) })
@connect(({ login }) => ({
  login
}))
class AdDomainBind extends PureComponent {
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

  handleCreateImprove = () => {
    const { history } = this.props
    history.push('/user/login/create/improve')
  }

  handleFormFinish = ({ /* region, */ mobile }) => {
    clearCountDownCache()
    localStorage.setItem('ims_mobile', mobile)

    const { history } = this.props
    const redirectUri = getRedirectUri()
    if (redirectUri) {
      history.push(`/user/adDomain/verify?redirectUri=${redirectUri}`)
    } else {
      history.push('/user/adDomain/verify')
    }
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
            message: intl.t({ id: 'Login.00021', defaultMessage: '请选择国家' })
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
    const { login } = this.props
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

    return (
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
        <div className={styles.titleDesc}>
          <Trans
            id="Login.00022"
            defaultMessage="请绑定域账号<span>{account}</span>的手机号"
            values={{
              account: localStorage.getItem('ims_domainAccount'),
              span: text => (
                <span className={styles.titleDescDomain} onClick={this.handleCreateImprove}>
                  {text}
                </span>
              )
            }}
          />
        </div>
        <div className={styles.passwordBox}>
          <FormItem
            className={styles.p}
            name="mobile"
            validateStatus={validateStatus}
            help={help}
            rules={[
              {
                required: true,
                message: intl.t({ id: 'Login.00023', defaultMessage: '请输入手机号' })
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
              placeholder={intl.t({ id: 'Login.00023', defaultMessage: '请输入手机号' })}
              autoFocus
              onChange={e => {
                const val = e.target.value
                if (val.length === 0) {
                  this.setHelp(intl.t({ id: 'Login.00023', defaultMessage: '请输入手机号' }))
                } else {
                  this.setHelp('')
                }
              }}
            />
          </FormItem>
        </div>
        <FormItem className={styles.rememberLogin}>
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
      </Form>
    )
  }
}

export default AdDomainBind
