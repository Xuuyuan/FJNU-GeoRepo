import request from '@/utils/request'

// 登录接口
export function user_login(username, password) {
  return request({
    url: '/user/login',
    method: 'post',
    data: { username, password },
  })
}

// 注册接口
export function user_register(username, password) {
  return request({
    url: '/user/register',
    method: 'post',
    data: { username, password },
  })
}
