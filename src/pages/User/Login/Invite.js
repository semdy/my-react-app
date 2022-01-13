import React, { PureComponent } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { Form, Input, Button, Select, notification } from 'antd'
import { PlusCircleOutlined } from '@ant-design/icons'
import { intl, Trans } from '@/locales'
import { userInvite } from '@/models/login'
import { getCountryList } from '@/services/user'
import StepWrapper from './StepWrapper'
import { getRegionInfo } from '@/utils/utils'
import styles from './index.module.less'

const FormItem = Form.Item
const { Option } = Select

@StepWrapper({ title: intl.t({ id: 'Login.00075', defaultMessage: '邀请团队成员' }) })
@connect(({ login }) => ({
  login
}))
class ImprovePage extends PureComponent {
  state = {
    values: [{}, {}],
    loading: false,
    countries: getRegionInfo()
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

  setLoading(status) {
    this.setState({
      loading: status
    })
  }

  handleSubmit = () => {
    const {
      dispatch,
      history,
      login: { teamId }
    } = this.props
    const { values } = this.state
    const noneMobile = values.every(item => !item.mobile)

    if (noneMobile) {
      return notification.error({
        message: intl.t({ id: 'Login.00076', defaultMessage: '提示信息' }),
        description: intl.t({ id: 'Login.00077', defaultMessage: '请至少填写一个成员' })
      })
    }

    const mobileList = values
      .filter(item => !!item.mobile)
      .map(item => ({ ...item, region: !item.region ? '+86' : item.region }))

    const hasInvalidMobile = mobileList.some(item => !/^1[3456789]\d{9}$/.test(item.mobile))

    if (hasInvalidMobile) {
      return notification.error({
        message: intl.t({ id: 'Login.00078', defaultMessage: '提示信息' }),
        description: intl.t({ id: 'Login.00079', defaultMessage: '填写的信息中有非法手机号' })
      })
    }

    this.setLoading(true)
    dispatch(
      userInvite(
        {
          mobileList: mobileList.map(item => item.mobile),
          teamId
        },
        {
          callback: () => {
            history.push('/user/createSuccess')
          }
        }
      )
    ).finally(() => {
      this.setLoading(false)
    })
  }

  handleRegionChange = (value, index) => {
    this.setState(state => ({
      values: state.values.map((item, i) => {
        if (index === i) {
          return { ...item, region: value }
        }
        return item
      })
    }))
  }

  handleInputChange = (value, index) => {
    this.setState(state => ({
      values: state.values.map((item, i) => {
        if (index === i) {
          return { ...item, mobile: value }
        }
        return item
      })
    }))
  }

  handleMore = () => {
    this.setState(
      state => {
        if (state.values.length >= 10) {
          return notification.error({
            message: intl.t({ id: 'Login.00076', defaultMessage: '提示信息' }),
            description: intl.t({ id: 'Login.00080', defaultMessage: '最多只能添加10位成员' })
          })
        }
        return {
          values: [...state.values, {}]
        }
      },
      () => {
        this.scroller.scrollTop = 1000 // force scroll to bottom
      }
    )
  }

  render() {
    const { values, countries, loading } = this.state

    const selectRegion = index => (
      <Select
        defaultValue="+86"
        size="large"
        style={{ width: 90 }}
        onChange={value => this.handleRegionChange(value, index)}
      >
        {countries.map(country => {
          return (
            <Option key={country.countryNo} value={country.countryNo}>
              {country.phoneCode}
            </Option>
          )
        })}
      </Select>
    )
    return (
      <>
        <div
          className={styles.inviteList}
          ref={node => {
            this.scroller = node
          }}
        >
          {values.map((value, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <FormItem key={`${value}-${i}`}>
              <Input
                value={value.mobile}
                addonBefore={selectRegion(i)}
                size="large"
                placeholder={intl.t({ id: 'Login.00071', defaultMessage: '请输入手机号' })}
                onChange={e => this.handleInputChange(e.target.value.replace(/\s/g, ''), i)}
              />
            </FormItem>
          ))}
        </div>
        <div>
          <a className={styles.inviteAction} onClick={this.handleMore}>
            <PlusCircleOutlined />
            <Trans id="Login.00081" defaultMessage="邀请更多" />
          </a>
        </div>
        <div className={classNames([styles.verifyAction, styles.right])}>
          <Link to="/user/createSuccess" className={styles.skip}>
            <Trans id="Login.00082" defaultMessage="跳过" />
          </Link>
          <Button size="large" type="primary" loading={loading} onClick={this.handleSubmit}>
            <Trans id="Login.00083" defaultMessage="下一步" />
          </Button>
        </div>
      </>
    )
  }
}

export default ImprovePage
