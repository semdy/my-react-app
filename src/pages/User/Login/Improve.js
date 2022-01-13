import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { Form, Input, Button, Checkbox, Select } from 'antd'
import { intl, Trans } from '@/locales'
import { validateByCountry } from '@/utils/validator'
import { clearCountDownCache, getRedirectUri, getRegionInfo } from '@/utils/utils'
import { setLoginMobile, setCreateImprove /* userCreateTeam */ } from '@/models/login'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

const FormItem = Form.Item
const { Option } = Select

const peopleNumberList = [
  { code: 1, text: '0-10' },
  { code: 2, text: '11-50' },
  { code: 3, text: '51-100' },
  { code: 4, text: '101-200' },
  { code: 5, text: intl.t({ id: 'Login.00053', defaultMessage: '超过200' }) }
]

@StepWrapper({ title: intl.t({ id: 'Login.00054', defaultMessage: '创建团队' }) })
@connect(({ login }) => ({
  login
}))
class ImprovePage extends PureComponent {
  formRef = React.createRef()

  state = {
    loading: false,
    teamSize: 1,
    phoneCode: '+86',
    mobile: '',
    countries: getRegionInfo(),
    fields: [
      {
        name: ['mobile'],
        value: ''
      }
    ]
  }

  setLoading(status) {
    this.setState({
      loading: status
    })
  }

  handleChangeSelect = value => {
    this.setState({
      teamSize: value
    })
  }

  handleFormFinish = ({ teamMemberName, companyName, mobile }) => {
    const { history, dispatch } = this.props
    const { teamSize, countryNo } = this.state
    // this.setLoading(true)

    const createInfo = {
      teamSize,
      teamMemberName,
      companyName,
      mobile,
      countryNo
    }

    // dispatch(
    //   userCreateTeam(createInfo, {
    //     callback: () => {
    //       history.push('/user/login/team/invite')
    //     }
    //   })
    // ).finally(() => {
    //   this.setLoading(false)
    // })

    dispatch(setCreateImprove(createInfo))
    dispatch(setLoginMobile(mobile))
    localStorage.setItem('ims_createImprove', JSON.stringify(createInfo))
    localStorage.setItem('ims_mobile', mobile)
    clearCountDownCache()

    const redirectUri = getRedirectUri()
    if (redirectUri) {
      history.push(`/user/login/verify/createTeam?redirectUri=${redirectUri}`)
    } else {
      history.push('/user/login/verify/createTeam')
    }
  }

  handleFieldsChange = v => {
    const newObj = { ...v[0] }

    const name = newObj.name && newObj.name[0]
    if (typeof newObj.value === 'string' && name === 'mobile') {
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
            message: intl.t({ id: 'Login.00055', defaultMessage: '请选择国家' })
          }
        ]}
      >
        <Select
          size="large"
          className={styles.improvePhoneCode}
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
    const { loading, teamSize, phoneCode, mobile, fields } = this.state

    return (
      <Form
        ref={this.formRef}
        onFinish={this.handleFormFinish}
        fields={fields}
        initialValues={{
          teamMemberName: '',
          companyName: '',
          peopleNumber: '0-10',
          withSubscript: true,
          country: phoneCode,
          mobile
        }}
        onFieldsChange={this.handleFieldsChange}
      >
        <FormItem
          name="teamMemberName"
          rules={[
            { required: true, message: intl.t({ id: 'Login.00056', defaultMessage: '请输入姓名' }) }
          ]}
        >
          <Input
            className={styles.inputWithPrefix}
            prefix={
              <span className={styles.formItemPrefix}>
                <Trans id="Login.00057" defaultMessage="姓名" />
              </span>
            }
            size="large"
            allowClear
            autoFocus
          />
        </FormItem>
        <FormItem
          name="mobile"
          rules={[
            {
              required: true,
              message: intl.t({ id: 'Login.00023', defaultMessage: '请输入手机号' })
            },
            {
              validator: validateByCountry(this.props.login.countryNo)()
            }
          ]}
        >
          <Input
            addonBefore={this.renderPhoneCode()}
            size="large"
            placeholder={intl.t({ id: 'Login.00023', defaultMessage: '请输入手机号' })}
          />
        </FormItem>
        <FormItem
          name="companyName"
          rules={[
            {
              required: true,
              message: intl.t({ id: 'Login.00058', defaultMessage: '请输入团队名称' })
            }
          ]}
        >
          <Input
            className={styles.inputWithPrefix}
            prefix={
              <span className={styles.formItemPrefix}>
                <Trans id="Login.00059" defaultMessage="团队名称" />
              </span>
            }
            size="large"
            allowClear
          />
        </FormItem>
        <FormItem name="teamSize">
          <div className={styles.peopleNumberInput}>
            <div className={styles.prefix}>
              <Trans id="Login.00060" defaultMessage="团队人数" />
            </div>
            <Select
              className={styles.peopleNumberSelect}
              value={teamSize}
              size="large"
              bordered={false}
              onChange={this.handleChangeSelect}
            >
              {peopleNumberList.map(item => (
                <Option key={item.code} value={item.code}>
                  {item.text}
                </Option>
              ))}
            </Select>
          </div>
        </FormItem>
        <FormItem name="withSubscript" valuePropName="checked">
          <Checkbox>
            <Trans
              id="Login.00061"
              defaultMessage="我同意通过电话、短信、邮件或其他方式接收IMSDOM产品和服务信息。"
            />
          </Checkbox>
        </FormItem>
        <div className={classNames([styles.verifyAction, styles.right])}>
          <Button size="large" type="primary" htmlType="submit" loading={loading}>
            <Trans id="Login.00024" defaultMessage="下一步" />
          </Button>
        </div>
      </Form>
    )
  }
}

export default ImprovePage
