import React, { PureComponent } from 'react'
import { Appear } from '@/components/AppearWrapper'
import config from './config'

class Wrapper extends PureComponent {
  timer = null

  timeoutTimer = null

  timerDelay = 2000

  componentDidMount() {
    this.timeoutTimer = setTimeout(() => {
      const { joined, account } = this.props
      if (!joined) {
        window.netcall.removeFromMeeting(account)
      }
    }, config.callingTimeout)
  }

  componentWillUnmount() {
    this.clearTimer()
    this.clearTimeoutTimer()
  }

  handleAppear = () => {
    const { account, myAccount, joined } = this.props
    // 自己不做切换
    if (joined && account !== myAccount) {
      this.clearTimer()
      this.timer = setTimeout(() => {
        // 主持人不做切换
        // if (this.props.isCaller) return
        window.netcall.startRemoteStreamMeeting({ account })
      }, this.timerDelay)
    }
  }

  handleDisappear = () => {
    const { account, myAccount, joined } = this.props
    if (joined && account !== myAccount) {
      this.clearTimer()
      this.timer = setTimeout(() => {
        // if (this.props.isCaller) return
        window.netcall.stopRemoteStreamMeeting(account)
      }, this.timerDelay)
    }
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer)
  }

  clearTimeoutTimer() {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer)
  }

  render() {
    const { children } = this.props
    return (
      <Appear onAppear={this.handleAppear} onDisappear={this.handleDisappear}>
        {children}
      </Appear>
    )
  }
}

export default Wrapper
