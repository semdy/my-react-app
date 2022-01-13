export const langStorageName = 'ims_i18n_lang'

let currentLang

export function getCurrentLang() {
  if (currentLang) return currentLang
  const lang = localStorage.getItem(langStorageName) || navigator.language || navigator.userLanguage
  if (lang.substr(0, 2) === 'en') {
    currentLang = 'en'
    return currentLang
  }
  switch (lang) {
    case 'zh-TW':
    case 'zh_tw':
    case 'zh-HK':
    case 'zh_hk':
    case 'zh-Hant-CN':
    case 'zh-Hant-HK':
    case 'zh-Hant-MO':
    case 'zh-Hant-SG':
    case 'zh-Hant-TW':
    case 'zh-Hant':
      currentLang = 'zh_tw'
      break
    default:
      currentLang = 'zh_cn'
  }
  return currentLang
}

export function getMomentLocale(lang) {
  if (lang === 'en') {
    return 'en'
  }
  if (lang === 'zh_tw') {
    return 'zh-tw'
  }
  return 'zh-cn'
}

export function getLanguageList() {
  return [
    {
      name: '简体中文',
      value: 'zh_cn',
      icon: '🇨🇳'
    },
    {
      name: '繁体中文',
      value: 'zh_tw',
      icon: '🇭🇰'
    },
    {
      name: 'English',
      value: 'en',
      icon: '🇬🇧'
    }
  ]
}

export function changeLanguage(lang) {
  localStorage.setItem(langStorageName, lang)
  window.location.reload()
}
