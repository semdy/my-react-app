import React, { memo } from 'react'
import DocumentTitle from 'react-document-title'
import defaultSettings from '@/defaultSettings'
import SelectLang from '@/components/SelectLang'
import styles from './UserLayout.module.less'

/* const copyright = (
  <Fragment>
    Copyright <Icon type="copyright" /> 2019 {title}
  </Fragment>
) */

const NativeAppHeader = (() => {
  if (process.env.REACT_APP_TYPE === 'win') {
    const { AppHeader } = require('@/components/natives')
    return AppHeader
  }
  if (process.env.REACT_APP_TYPE === 'mac' || process.env.REACT_APP_TYPE === 'linux') {
    return require('@/components/natives/MacNativeHeader').default
  }
  return React.Fragment
})()

const UserLayout = memo(({ children }) => (
  <DocumentTitle title={`登录 - ${defaultSettings.title}`}>
    <div className={styles.container}>
      <NativeAppHeader />
      <div className={styles.content}>{children}</div>
      <SelectLang className={styles.selectLang} />
      {/* <GlobalFooter copyright={copyright} /> */}
    </div>
  </DocumentTitle>
))

export default UserLayout
