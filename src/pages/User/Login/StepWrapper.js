import React, { PureComponent } from 'react'
import Icon from '@/components/Icon'
import UserSlider from '@/components/UserSlider'
import { getRedirectUri } from '@/utils/utils'
import styles from './index.module.less'

export default function StepWrapper(props = {}) {
  return WrappedComponent => {
    return class extends PureComponent {
      componentDidMount() {
        document.body.style.overflow = 'hidden'
      }

      componentWillUnmount() {
        document.body.style.overflow = ''
      }

      handleBack = () => {
        this.props.history.goBack()
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

      render() {
        return (
          <div className={styles.nextActions}>
            <div className={styles.stepActions}>
              <Icon
                name="angle-left"
                size="22px"
                className={styles.stepBack}
                onClick={this.handleBack}
              />
              <Icon name="logo" size="150px" className={styles.stepLogo} />
              <Icon
                name="close"
                size="18px"
                className={styles.stepClose}
                onClick={this.handleClose}
              />
            </div>
            <div className={[styles.main, styles.stepMain].join(' ')}>
              <div className={styles.aside}>
                <UserSlider />
              </div>
              <div className={styles.login}>
                {props.title && (
                  <h1 style={{ textAlign: props.titleAlign || 'left' }}>{props.title}</h1>
                )}
                <WrappedComponent {...props} {...this.props} />
              </div>
            </div>
          </div>
        )
      }
    }
  }
}
