import React from 'react'
import ReactDOM from 'react-dom'
// import { ConnectedRouter } from 'connected-react-router'
import { Provider } from 'react-redux'
import createStore from './models/createStore'
import App from './App'
import * as errorListener from './errorListener'
import * as serviceWorker from './serviceWorker'
import reportWebVitals from './reportWebVitals'

import './index.css'

const initialState = window.INITIAL_STATE || {}
delete window.INITIAL_STATE

errorListener.init()

export const { store, history } = createStore(initialState)

const renderApp = Component => {
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        {/* <ConnectedRouter history={history}>
          <Component />
        </ConnectedRouter> */}
        <Component />
      </Provider>
    </React.StrictMode>,
    document.getElementById('root')
  )
}

renderApp(App)

if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default
    renderApp(NextApp)
  })
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
serviceWorker.register()
serviceWorker.checkAndNotifyReloadSW()
