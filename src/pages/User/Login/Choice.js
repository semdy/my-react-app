import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, Form, Modal, Spin } from 'antd'
import classNames from 'classnames'
import { getBrowser } from '@/utils/utils'
import { intl, Trans } from '@/locales'
import Icon from '@/components/Icon'
import { choiceTeam, declineInvitation, obtainTeam } from '@/services/user'
import cookieManager from '@/utils/cookie'
import SelectTeam from '@/components/SelectTeam'
import appConfig from '@/config/app'
import StepWrapper from './StepWrapper'

import styles from './index.module.less'

const FormItem = Form.Item
const ChoiceTitle = (
  <span style={{ marginLeft: 20 }}>
    <Trans id="Login.00040" defaultMessage="选择团队" />
  </span>
)

@StepWrapper({ title: ChoiceTitle })
@connect(({ login }) => ({
  login
}))
class Choice extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      fetchLoading: true,
      list: [],
      ids: ''
    }
  }

  componentDidMount() {
    this.getList()
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  onKeyDown = e => {
    const { list, ids } = this.state

    if (e.keyCode === 13 && !(list.length === 0)) {
      this.handleNext(ids)
    }
  }

  async getList() {
    const response = await obtainTeam()
    this.setState({
      fetchLoading: false
    })

    if (response) {
      this.setState({
        list: response.teamList || [],
        ids: (response.teamList && response.teamList[0] && response.teamList[0].teamId) || ''
      })
    }
  }

  // eslint-disable-next-line
  getTeam(ids) {
    const device = getBrowser().name
    return choiceTeam({
      teamId: ids,
      softwareId: appConfig.softwareId,
      versionId: appConfig.versionId,
      device
    })
  }

  setLoading(status) {
    this.setState({
      loading: status
    })
  }

  handleNext = teamId => {
    const { history } = this.props
    // const response = this.getTeam(teamId)
    // console.log('from getTeam')
    // if (teamId !== '') {
    history.push('/')
    localStorage.setItem('ims_teamId', teamId)
    cookieManager.setCookie('ims_teamId', teamId)
    // }
  }

  choiceTeams(id) {
    this.setState({
      ids: id
    })
  }

  declineInvitations(team) {
    Modal.confirm({
      title: intl.t({ id: 'Login.00041', defaultMessage: '拒绝邀请' }),
      content: intl.t(
        { id: 'Login.00042', defaultMessage: '是否拒绝"{name}"团队邀请？' },
        { name: team.teamName }
      ),
      cancelText: intl.t({ id: 'Login.00043', defaultMessage: '取消' }),
      okText: intl.t({ id: 'Login.00044', defaultMessage: '确定' }),
      onOk: () => {
        this.refuse(team.teamId)
        this.setState(({ list }) => ({
          list: list.filter(item => item.teamId !== team.teamId)
        }))
      }
    })
  }

  async refuse(id) {
    this.response = await declineInvitation({ teamId: id })
  }

  renderContent = ({ list, ids }) => {
    if (list.length === 1) {
      this.handleNext(list[0].teamId)
      return
    }
    if (list.length !== 0) {
      return list.map(item => (
        <div
          key={item.teamId}
          className={classNames(styles.team, {
            [styles.active]: ids === item.teamId
          })}
        >
          <SelectTeam
            avatar={item.teamName}
            name={item.teamName}
            tag={
              item.isCurrent === true
                ? intl.t({ id: 'Login.00045', defaultMessage: '默认' })
                : '' || item.invited === true
                ? intl.t({ id: 'Login.00046', defaultMessage: '新团队' })
                : ''
            }
            onClick={() => this.choiceTeams(item.teamId)}
          />
          {item.invited && (
            <span className={styles.delete} onClick={() => this.declineInvitations(item)}>
              ×
            </span>
          )}
        </div>
      ))
    }
    return (
      <div className={styles.tips}>
        {/* <div>您还没有加入任何团队!</div> */}
        <div>
          <Trans id="Login.00047" defaultMessage="可以点击下方创建团队体验IMSDOM!" />
        </div>
      </div>
    )
  }

  render() {
    const { loading, fetchLoading, list, ids } = this.state

    return (
      <>
        <div className={styles.choiceTeam}>
          <Trans id="Login.00048" defaultMessage="请选择一个团队" />
        </div>
        <div className={styles.teamList}>
          {fetchLoading ? <Spin className={styles.spin} /> : this.renderContent({ list, ids })}
        </div>
        <FormItem className={styles.nextStep}>
          <div className={styles.createTeam}>
            <Icon name="plus-circle" className={styles.icon} />
            <Link to="/user/login/create/improve">
              <Trans id="Login.00049" defaultMessage="创建团队" />
            </Link>
          </div>
          <Button
            size="large"
            className={styles.steps}
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={list.length === 0}
            onClick={() => this.handleNext(ids)}
          >
            <Trans id="Login.00024" defaultMessage="下一步" />
          </Button>
        </FormItem>
      </>
    )
  }
}

export default Choice
