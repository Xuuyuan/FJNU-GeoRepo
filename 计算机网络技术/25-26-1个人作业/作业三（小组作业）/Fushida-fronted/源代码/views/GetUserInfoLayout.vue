<template>
  <div class="bind-page">
    <div v-if="loading" class="loading-box">
      <el-icon class="is-loading" :size="40" color="#409eff"><Loading /></el-icon>
      <p class="status-text">正在处理...</p>
      <p class="sub-text">{{ loadingText }}</p>
    </div>

    <el-result v-else :icon="resultStatus" :title="resultTitle" :sub-title="resultSubTitle">
    </el-result>
  </div>
</template>

<script setup>
// 1. 引入本地工具类
import '@/utils/toongine.js'

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { loginByToken } from '@/api/fstar'

const route = useRoute()

// 状态控制
const loading = ref(true)
const loadingText = ref('初始化中')
// resultStatus: 'success' | 'warning' | 'info' | 'error'
const resultStatus = ref('info')
const resultTitle = ref('')
const resultSubTitle = ref('')

// 用于防止超时后回调又回来了，导致状态混乱
let isProcessed = false
let timeoutTimer = null

// 核心流程
const initBind = async () => {
  loading.value = true
  resultStatus.value = 'info'
  loadingText.value = '正在检查环境...'
  isProcessed = false

  // 1. 获取 Ticket
  const ticket = route.query.ticket
  if (!ticket) {
    endProcess('error', '绑定失败', '未检测到Ticket参数')
    return
  }

  // 2. 检查 toongine 环境
  loadingText.value = '正在呼起福Star环境...'
  const toongineReady = await waitForToongine()
  if (!toongineReady) {
    endProcess('warning', '环境错误', '请在【福Star】APP内访问此页面')
    return
  }

  // 3. 调用 Bridge 获取用户信息 (带超时控制)
  loadingText.value = '正在验证身份...'
  getJsBridgeUserInfo(ticket)
}

// 等待 toongine 注入 (轮询检测)
const waitForToongine = () => {
  return new Promise((resolve) => {
    let attempts = 0
    const check = () => {
      if (window.toongine && window.toongine.tcPublic && window.toongine.tcPublic.user) {
        resolve(true)
      } else {
        attempts++
        if (attempts < 20) {
          // 最多等待约2秒
          setTimeout(check, 100)
        } else {
          resolve(!!window.toongine)
        }
      }
    }
    check()
  })
}

// 调用 JSBridge (增加了超时机制)
const getJsBridgeUserInfo = (ticket) => {
  // 设置超时定时器 (1秒)
  // 如果用户不在APP内，Bridge永远不会回调，需要手动断开
  timeoutTimer = setTimeout(() => {
    if (!isProcessed) {
      console.warn('JSBridge调用超时')
      endProcess('error', '环境检测超时', '请确保您正在【福Star】APP内打开此页面')
    }
  }, 1000)

  try {
    window.toongine.tcPublic.user.getUserInfo({
      params: {},
      callback: function (response) {
        // 如果已经超时处理过了，这里就不要再执行了
        if (isProcessed) return

        // 收到回调，清除定时器
        clearTimeout(timeoutTimer)

        // 检查 JSBridge 返回
        if (response && response.code === 0 && response.data) {
          const personToken = response.data.personToken
          if (personToken) {
            // 4. 发送给后端进行绑定
            handleBackendBind(ticket, personToken)
          } else {
            endProcess('error', '绑定失败', '无法获取有效的用户Token')
          }
        } else {
          endProcess('error', '绑定失败', response.msg || '无法读取用户信息')
        }
      },
    })
  } catch (e) {
    console.error(e)
    if (!isProcessed) {
      clearTimeout(timeoutTimer)
      endProcess('error', '绑定失败', 'JSBridge调用异常')
    }
  }
}

// 调用后端绑定接口
const handleBackendBind = async (ticket, personToken) => {
  loadingText.value = '正在提交绑定...'
  try {
    const res = await loginByToken({
      ticket: ticket,
      fustar_token: personToken,
    })

    if (res.code === 1) {
      endProcess('success', '绑定成功', '请回到浏览器后刷新页面')
    } else {
      const errorMsg = res.msg || '服务器验证未通过'
      endProcess('error', '绑定失败', errorMsg)
    }
  } catch (error) {
    console.error(error)
    endProcess('error', '绑定失败', '网络连接错误，请稍后重试')
  }
}

// 统一结束处理
const endProcess = (status, title, subTitle) => {
  // 标记流程结束，防止后续的超时或回调重复触发
  isProcessed = true
  if (timeoutTimer) clearTimeout(timeoutTimer)

  loading.value = false
  resultStatus.value = status
  resultTitle.value = title
  resultSubTitle.value = subTitle
}

onMounted(() => {
  initBind()
})
</script>

<style scoped>
.bind-page {
  padding: 40px 20px;
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-box {
  margin-top: 100px;
  text-align: center;
}

.status-text {
  margin-top: 20px;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.sub-text {
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}
</style>
