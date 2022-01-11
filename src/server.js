import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ConnectedRouter, push } from 'connected-react-router'
import { Provider } from 'react-redux'
import serialize from 'serialize-javascript'
import createStore from './models/createStore'
import App from './App'

const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'
const targetFolder = isDev ? 'public' : 'dist'

const templatePath = path.resolve(__dirname, '..', targetFolder, 'index.html')
let template = fs.readFileSync(templatePath, 'utf-8')

export default (req, res, next, isNoHtml) => {
  const { store, history } = createStore({}, true)

  // once `store` is configured, dispatch the proper route into
  store.dispatch(push(req.originalUrl))

  const preloadState = serialize(store.getState())
  const markup = isNoHtml
    ? ''
    : ReactDOMServer.renderToString(
        // eslint-disable-next-line
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <App />
          </ConnectedRouter>
        </Provider>
      )

  template = template
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
    .replace('window.INITIAL_STATE={}', `window.INITIAL_STATE = ${preloadState}`)

  if (isDev) {
    template = template
      .replace(/%PUBLIC_URL%/g, process.env.PUBLIC_URL)
      .replace('</body>', '<script type="text/javascript" src="/bundle.js"></script>\n</body>')
  }

  return res.status(200).send(template)
}
