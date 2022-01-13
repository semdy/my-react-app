import React, { PureComponent } from 'react'
import renderRoutes from '@/utils/renderRoutes'
import LocaleWrapper from '@/locales/Wrapper'
import routes from '@/pages/router.config'
import '@/style/app.less'

class App extends PureComponent {
  componentDidCatch(err, info) {
    console.error('App Render Error:', err, info)
  }

  render() {
    const { appShow } = this.state
    return appShow ? <LocaleWrapper>{renderRoutes(routes)}</LocaleWrapper> : null
  }
}

export default App
