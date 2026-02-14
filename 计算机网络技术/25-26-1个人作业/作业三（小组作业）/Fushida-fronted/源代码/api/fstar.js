import request from '@/utils/request'

// getAAP
export function getAAP() {
  return request({
    url: '/fustar/getaap',
    method: 'post',
  })
}

// getQRCode
export function getQRCode() {
  return request({
    url: '/fustar/get_qrcode',
    method: 'post',
  })
}

// fuStarLogin 福Star登录
export function fuStarLogin(data) {
  return request({
    url: '/fustar/login',
    method: 'post',
    data: data,
  })
}

// fuStarLoginGetCaptha 获取图形验证码
export function fuStarLoginGetCaptha(data) {
  return request({
    url: '/fustar/login_get_captha',
    method: 'post',
    data: data,
  })
}

// fuStarLoginGetVericode 获取短信验证码
export function fuStarLoginGetVericode(data) {
  return request({
    url: '/fustar/login_send_vericode',
    method: 'post',
    data: data,
  })
}

// fuStarLoginBySms 通过短信验证码绑定账号
export function fuStarLoginBySms(data) {
  return request({
    url: '/fustar/login_by_sms',
    method: 'post',
    data: data,
  })
}

// fuStarScanQrcode 扫描二维码
export function fuStarScanQrcode(data) {
  return request({
    url: '/fustar/scan_qrcode',
    method: 'post',
    data: data,
  })
}

// changePassword 修改密码
export function changePassword(data) {
  return request({
    url: '/user/changePassword',
    method: 'post',
    data: data,
  })
}

// unbind 解绑福Star账号
export function unbind() {
  return request({
    url: '/fustar/unbind',
    method: 'post',
  })
}

// getAnnouncements 获取公告列表
export function getAnnouncements() {
  return request({
    url: '/get_announcements',
    method: 'post',
  })
}

// generateTicket 生成临时ticket
export function generateTicket() {
  return request({
    url: '/fustar/generate_ticket',
    method: 'post',
  })
}

// loginByToken 通过token绑定福Star账号
export function loginByToken(data) {
  return request({
    url: '/fustar/login_by_token',
    method: 'post',
    data: data,
  })
}
