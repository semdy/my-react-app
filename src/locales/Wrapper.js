import React from 'react'
import { IntlProvider } from 'react-intl'
import { ConfigProvider } from 'antd'
import moment from 'moment'
import IntlGlobalProvider, { getCurrentLang } from '@/locales'

import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'
import 'dayjs/locale/en'

const localeInfo = {
  zh_cn: {
    locale: 'zh-CN',
    momentLocale: 'zh-cn',
    messages: window.ims_translations,
    antd: require('antd/lib/locale/zh_CN')
  },
  en: {
    locale: 'en',
    momentLocale: 'en',
    messages: window.ims_translations,
    antd: require('antd/lib/locale/en_US')
  },
  zh_tw: {
    locale: 'zh-TW',
    momentLocale: 'zh-tw',
    messages: window.ims_translations,
    antd: require('antd/lib/locale/zh_TW')
  }
}

const appLocale = localeInfo[getCurrentLang()]

// const baseNavigator = false
// const useLocalStorage = true
// const cacheLocale = localStorage.getItem('ims_locale')
//
// if (useLocalStorage && cacheLocale && localeInfo[cacheLocale]) {
//   appLocale = localeInfo[cacheLocale]
// } else if (baseNavigator && localeInfo[navigator.language]) {
//   appLocale = localeInfo[navigator.language]
// } else {
//   appLocale = localeInfo['zh_cn']
// }

moment.locale(appLocale.momentLocale)

export default function LocaleWrapper(props) {
  return (
    <IntlProvider
      locale={appLocale.locale}
      messages={appLocale.messages}
      defaultLocale={appLocale.locale}
    >
      <ConfigProvider locale={appLocale.antd.default || appLocale.antd}>
        <IntlGlobalProvider>{props.children}</IntlGlobalProvider>
      </ConfigProvider>
    </IntlProvider>
  )
}
