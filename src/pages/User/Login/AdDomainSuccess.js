import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { Button } from 'antd'
import { enterTeam } from '@/services/user'
import cookieManager from '@/utils/cookie'
import { dealLoginWithRedirectUri, getRedirectUri } from '@/utils/utils'
import { openWindowInNewTab } from '@/utils/space'
import { intl, Trans } from '@/locales'
import Icon from '@/components/Icon'
import img from '@/assets/img/invite-success.png'
import StepWrapper from './StepWrapper'
import styles from './CreateSuccess.module.less'

@StepWrapper({ title: intl.t({ id: 'Login.00028', defaultMessage: '绑定手机号成功!' }) })
@connect(({ login }) => ({
  login
}))
class AdDomainSuccess extends PureComponent {
  state = {
    loading: false
  }

  setLoading = bool => {
    this.setState({
      loading: bool
    })
  }

  handleClose = () => {
    const { history } = this.props
    const redirectUri = getRedirectUri()
    if (redirectUri) {
      history.push(`/user/login?redirectUri=${redirectUri}`)
    } else {
      history.push('/user/login')
    }
  }

  handleClick = () => {
    const { history } = this.props
    this.setLoading(true)
    enterTeam({})
      .then(response => {
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
      })
      .finally(() => {
        this.setLoading(false)
      })
  }

  handleGoAdmin = () => {
    openWindowInNewTab('https://admin.imsdom.com', localStorage.getItem('ims_token'))
  }

  render() {
    const { loading } = this.state

    return (
      <div className={styles.createSuccess}>
        <div className={styles.stepActions}>
          <Icon name="close" size="18px" className={styles.stepClose} onClick={this.handleClose} />
        </div>
        <div className={styles.stepMain}>
          <div className={styles.mainImg}>
            <img src={img} alt={intl.t({ id: 'Login.00029', defaultMessage: '创建成功' })} />
          </div>
          <div className={styles.stepMainTitle}>
            <Trans id="Login.00030" defaultMessage="绑定手机号成功！" />
          </div>
          <div className={styles.successTip}>
            <Trans
              id="Login.00031"
              defaultMessage="您已经加入【{name}】团队，快来体验吧！"
              values={{ name: localStorage.getItem('ims_teamName') }}
            />
          </div>
          <div className={styles.verifyAction}>
            <Button size="large" type="primary" onClick={this.handleClick} loading={loading}>
              <Trans id="Login.00032" defaultMessage="立即体验IMSDOM" />
            </Button>
          </div>
          <div className={styles.successHint}>
            <Trans
              id="Login.00033"
              defaultMessage="您可以<span>访问管理后台</span>添加团队成员"
              values={{
                span: text => (
                  <span className={styles.goAdminBtn} onClick={this.handleGoAdmin}>
                    {text}
                  </span>
                )
              }}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default AdDomainSuccess
