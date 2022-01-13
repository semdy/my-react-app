import AsyncComponent from '@/components/AsyncComponent'
import { importScript } from '@/utils/loader'

export default [
  // user
  {
    path: '/user',
    component: AsyncComponent(() => import('../layouts/UserLayout')),
    routes: [
      { path: '/user', redirect: '/user/login' },
      {
        path: '/user/login',
        component: AsyncComponent(() => import('./User/Login')),
        routes: [
          {
            path: '/user/login/qrcode',
            component: AsyncComponent(() => import('./User/Login/QrcodeLogin'))
          },
          {
            path: '/user/login/verify/:from?',
            component: AsyncComponent(() => import('./User/Login/Verify'))
          },
          {
            path: '/user/login/password',
            component: AsyncComponent(() => import('./User/Login/Password'))
          },
          {
            path: '/user/login/setPassword/:from?',
            component: AsyncComponent(() => import('./User/Login/SetPassword'))
          },
          {
            path: '/user/login/modifyPassword',
            component: AsyncComponent(() => import('./User/Login/ModifyPassword'))
          },
          {
            path: '/user/login/choice',
            component: AsyncComponent(() => import('./User/Login/Choice'))
          },
          {
            path: '/user/login/create/improve',
            component: AsyncComponent(() => import('./User/Login/Improve'))
          },
          {
            path: '/user/login/team/invite',
            component: AsyncComponent(() => import('./User/Login/Invite'))
          },
          {
            path: '/user/login/team/success',
            component: AsyncComponent(() => import('./User/Login/Success'))
          }
        ]
      },
      {
        path: '/user/mailLogin',
        component: AsyncComponent(() => import('./User/Login/MailLogin')),
        routes: [
          {
            path: '/user/mailLogin/qrcode',
            component: AsyncComponent(() => import('./User/Login/QrcodeLogin'))
          },
          {
            path: '/user/mailLogin/verify/:from?',
            component: AsyncComponent(() => import('./User/Login/MailVerify'))
          }
        ]
      },
      {
        path: '/user/adDomain',
        component: AsyncComponent(() => import('./User/Login/AdDomain')),
        routes: [
          {
            path: '/user/adDomain/password',
            component: AsyncComponent(() => import('./User/Login/AdDomainPassword'))
          },
          {
            path: '/user/adDomain/bindMobile',
            component: AsyncComponent(() => import('./User/Login/AdDomainBind'))
          },
          {
            path: '/user/adDomain/verify',
            component: AsyncComponent(() => import('./User/Login/AdDomainVerify'))
          },
          {
            path: '/user/adDomain/success',
            component: AsyncComponent(() => import('./User/Login/AdDomainSuccess'))
          }
        ]
      },
      {
        path: '/user/createSuccess',
        component: AsyncComponent(() => import('./User/Login/CreateSuccess'))
      }
    ]
  },
  // show icons
  {
    path: '/icons',
    component:
      process.env.NODE_ENV === 'development' ? AsyncComponent(() => import('./Icons/index')) : null
  },
  // app
  {
    path: '/',
    requireAuth: true,
    component: AsyncComponent(
      () => import(/* webpackPrefetch: 2000 */ '../layouts/BasicLayout'),
      () => importScript('./vendors/sdk/nim-8.4.0.js')
    ),
    routes: [
      { path: '/', redirect: '/dashboard', isWork: true },
      {
        path: '/dashboard',
        isWork: true,
        component: null
      }
    ]
  }
]
