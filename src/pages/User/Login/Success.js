import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { Button } from 'antd'
import { intl, Trans } from '@/locales'
import StepWrapper from './StepWrapper'
import styles from './index.module.less'

@StepWrapper({ title: intl.t({ id: 'Login.00123', defaultMessage: '恭喜你！创建团队成功！' }) })
@connect(({ login }) => ({
  login
}))
class ImprovePage extends PureComponent {
  handleClick = () => {
    const { history } = this.props
    history.push('/')
  }

  render() {
    return (
      <>
        <div className={styles.successTip}>
          <Trans id="Login.00124" defaultMessage="您的IMSDOM团队已创建成功！" />
        </div>
        <div className={styles.successHint}>
          <Trans
            id="Login.00125"
            defaultMessage="您可以<span>立即体验IMSDOM</span>，也可以<span>访问管理后台</span>添加团队成员"
            values={{ span: text => <a href="/">{text}</a> }}
          />
        </div>
        <div className={classNames([styles.verifyActions, styles.right])}>
          <Button size="large" type="primary" onClick={this.handleClick}>
            <Trans id="Login.00126" defaultMessage="立即体验IMSDOM" />
          </Button>
        </div>
      </>
    )
  }
}

export default ImprovePage
