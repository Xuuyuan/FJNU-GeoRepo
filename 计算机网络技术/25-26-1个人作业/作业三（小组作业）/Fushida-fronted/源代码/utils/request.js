import axios from 'axios'
import { ElMessage } from 'element-plus'

import router from '@/router'

const service = axios.create({
  baseURL: 'https://fsd-api.nekoark.com',
  // baseURL: 'http://localhost:9000',
  timeout: 10000, // 请求超时时间
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  },
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    console.log(res)
    if (res.code !== 1) {
      // 1 表示成功
      ElMessage.error(res.msg || 'Error')
    }
    return res
  },
  (error) => {
    console.error('响应错误:', error.message)
    if (error.response && error.response.status === 401) {
      router.push('/login')
    }
    return Promise.reject(error)
  },
)

export default service
