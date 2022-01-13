import request from '@/utils/request'

const server = 'user'

// 通过手机查询账号状态
export async function queryAccountStatus(params) {
  return request.post(server, '/user/login/type', params)
}

// 通过密码登录
export async function loginByPassword(params, token) {
  if (!token) {
    return request.post(server, '/user/password/login', params, true)
  }
  return request(server, '/user/password/login', {
    body: params,
    headers: { token },
    method: 'POST'
  })
}
