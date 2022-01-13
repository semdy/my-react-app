import React, { PureComponent } from 'react'
import { Button } from 'antd'
import { intl, Trans } from '@/locales'
import Icon from '@/components/Icon'
import { openWindowInNewTab } from '@/utils/space'
import { getRedirectUri } from '@/utils/utils'
import img from '@/assets/img/invite-success.png'
import styles from './CreateSuccess.module.less'

class CreateSuccess extends PureComponent {
  handleClick = () => {
    const { history } = this.props
    history.push('/')
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

  handleGoAdmin = () => {
    openWindowInNewTab('https://admin.imsdom.com', localStorage.getItem('ims_token'))
  }

  render() {
    return (
      <div className={styles.createSuccess}>
        <div className={styles.stepActions}>
          <Icon name="close" size="18px" className={styles.stepClose} onClick={this.handleClose} />
        </div>
        <div className={styles.stepMain}>
          <div className={styles.mainImg}>
            <img src={img} alt={intl.t({ id: 'Login.00050', defaultMessage: '创建成功' })} />
          </div>
          <div className={styles.stepMainTitle}>
            <Trans id="Login.00050" defaultMessage="创建成功" />
          </div>
          <div className={styles.successTip}>
            <Trans id="Login.00051" defaultMessage="您的IMSDOM团队已创建成功！快来体验吧！" />
          </div>
          <div className={styles.verifyAction}>
            <Button size="large" type="primary" onClick={this.handleClick}>
              <Trans id="Login.00052" defaultMessage="立即体验IMSDOM" />
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

export default CreateSuccess
