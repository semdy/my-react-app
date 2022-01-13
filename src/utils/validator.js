/* eslint-disable no-useless-escape */
export const tel = msg => async (rule, value) => {
  if (value && !/^1[3456789]\d{9}$/.test(value)) {
    throw new Error(msg || '手机号格式不正确')
  }
}

export const password = msg => async (rule, value) => {
  if (value && (/(^[a-zA-Z]+$)|(^\d+$)/.test(value) || value.length < 8)) {
    throw new Error(msg || '至少8个字符，同时包含字母和数字')
  }
}

export const mail = msg => async (rule, value) => {
  const reg =
    /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/
  if (value && !reg.test(value)) {
    throw new Error(msg || '邮箱格式不正确')
  }
}

export function validateByCountry(country) {
  country = `${country}`
  let mobileRule = ''
  switch (country) {
    case '1001':
      // 中国
      mobileRule =
        '^(\\+?0?86\\-?)?((13[0-9])|(15[^4])|(16[0-9])|(18[0-9])|(19[0-9])|(17[0-8])|(147))\\d{8}$'
      break
    case '1002':
      // 美国
      mobileRule = '^(\\+?1\\-?)?[2-9]\\d{2}[2-9](?!11)\\d{6}$'
      break
    case '1003':
      // 日本
      mobileRule = '^(\\+?81\\-?)\\d{1,4}[ \\-]?\\d{1,4}[ \\-]?\\d{4}$'
      break
    case '1004':
      // 韩国
      mobileRule = '^(\\+?82\\-?)?0{0,1}[7,1](?:\\d{8}|\\d{9})$'
      break
    case '1005':
      // 英国
      mobileRule = '^(\\+?44\\-?)?7\\d{9}$'
      break
    case '1006':
      // 中国台湾
      mobileRule = '^(\\+?886\\-?)?9\\d{8}$'
      break
    default:
      mobileRule = '.+'
  }
  mobileRule = new RegExp(mobileRule)
  return msg => async (rule, value) => {
    if (value && !mobileRule.test(value)) {
      throw new Error(msg || '手机号格式不正确')
    }
  }
}
