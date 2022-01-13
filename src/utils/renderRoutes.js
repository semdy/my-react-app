import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { store } from '@/index'
import teamManager from '@/services/memory/teamManager'

function getRouteParams() {
  let {
    login: { token }
  } = store.getState()

  if (!token) {
    token = localStorage.getItem('ims_token')
  }

  return {
    isLogin: !!token
  }
}

function renderRoutes(routes, unAuthRedirect = '/user/login', extraProps = {}, switchProps = {}) {
  return routes ? (
    <Switch {...switchProps}>
      {routes.map(route => (
        <Route
          key={route.key || route.path}
          path={route.path}
          exact={route.redirect ? true : route.exact}
          strict={route.strict}
          render={props => {
            const { isLogin } = getRouteParams()
            const hasIm = teamManager.getConfig('hasIm')
            const hasWork = teamManager.getConfig('hasWork')

            if ((route.requireAuth && isLogin) || !route.requireAuth) {
              if (route.isWork && !hasWork) {
                return <Redirect to={{ pathname: '/chat', state: { from: props.location } }} />
              }
              if (route.isIm && !hasIm) {
                return <Redirect to={{ pathname: '/dashboard', state: { from: props.location } }} />
              }
              if (route.redirect) {
                return (
                  <Redirect to={{ pathname: route.redirect, state: { from: props.location } }} />
                )
              }
              if (route.render) {
                return route.render({ ...props, ...extraProps, route })
              }
              if (route.component) {
                return (
                  <route.component {...props} {...extraProps} route={route}>
                    {route.routes && renderRoutes(route.routes, unAuthRedirect)}
                  </route.component>
                )
              }
              return null
            }
            return <Redirect to={{ pathname: unAuthRedirect, state: { from: props.location } }} />
          }}
        />
      ))}
    </Switch>
  ) : null
}

export default renderRoutes
