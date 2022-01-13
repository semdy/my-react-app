import appConfigObj from '@/config/app'

const cookie = {
  setCookie(name, value) {
    const days = 1
    const exp = new Date()
    exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${escape(value)};expires=${exp.toGMTString()};domain=.${
      appConfigObj.appOrigin
    };path=/`
  },
  readCookie(name) {
    let arr = null
    const reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`)
    // eslint-disable-next-line no-cond-assign
    if (document.cookie && (arr = document.cookie.match(reg))) {
      return unescape(arr[2])
    }
    return null
  },
  delCookie(name) {
    const cval = this.readCookie(name)
    if (cval != null) {
      document.cookie = `${name}=${cval};expires=${new Date(0).toGMTString()};domain=.${
        appConfigObj.appOrigin
      };path=/`
    }
  }
}

export default cookie
