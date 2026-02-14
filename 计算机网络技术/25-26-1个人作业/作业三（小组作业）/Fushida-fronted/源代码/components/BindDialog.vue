<template>
  <el-dialog
    v-model="dialogVisible"
    title="绑定【福Star】账号"
    width="400px"
    :modal="false"
    modal-penetrable
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    :align-center="true"
    :center="true"
    @closed="resetBindForm"
    @open="handleDialogOpen"
  >
    <el-tabs v-model="activeTab" class="bind-tabs" stretch @tab-change="handleTabChange">
      <el-tab-pane label="二维码扫描" name="qrcode">
        <div class="qr-container" v-loading="qrLoading">
          <div v-if="qrCodeUrl" class="qr-box">
            <img :src="qrCodeUrl" alt="扫码绑定" />
            <p class="qr-tip">请打开【福Star】APP扫描二维码进行绑定</p>
            <p class="qr-sub-tip">绑定成功后刷新本页面即可</p>
          </div>
          <div v-else-if="!qrLoading" class="qr-error">
            <el-button link type="primary" @click="initQrCode">获取二维码失败，点击重试</el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="账号登录" name="account">
        <el-form :model="bindForm" autocomplete="off" class="account-form">
          <div class="qr-box">
            <p class="qr-sub-tip">该方案与【福Star】APP无法同时登录</p>
            <p class="qr-sub-tip">建议使用二维码扫描的方式进行绑定</p>
          </div>

          <template v-if="bindStep === 1">
            <el-form-item label="账号">
              <el-input
                v-model="bindForm.username"
                placeholder="请输入福Star绑定的手机号"
                name="fustar_bind_u_xx"
                autocomplete="off"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="bindForm.password"
                type="password"
                placeholder="请输入福Star的密码"
                name="fustar_bind_p_xx"
                autocomplete="new-password"
                show-password
                readonly
                onfocus="this.removeAttribute('readonly');"
              />
            </el-form-item>
          </template>

          <template v-else>
            <el-alert
              title="需要进一步验证身份"
              type="info"
              :closable="false"
              style="margin-bottom: 15px"
            />
            <el-form-item label="账号">
              <el-input v-model="bindForm.username" disabled />
            </el-form-item>

            <el-form-item label="图形验证">
              <div class="captcha-row">
                <el-input
                  v-model="bindForm.graphicCode"
                  placeholder="输入右侧字符"
                  style="width: 120px"
                />
                <div class="captcha-img-box" @click="getCaptchaImage" title="点击刷新">
                  <img v-if="captchaBase64" :src="captchaBase64" alt="验证码" />
                  <span v-else>加载中...</span>
                </div>
              </div>
            </el-form-item>

            <el-form-item label="短信验证">
              <div class="sms-row">
                <el-input
                  v-model="bindForm.smsCode"
                  placeholder="输入短信验证码"
                  style="width: 150px"
                />
                <el-button
                  type="primary"
                  link
                  @click="sendSmsCode"
                  :disabled="!bindForm.graphicCode"
                >
                  发送验证码
                </el-button>
              </div>
            </el-form-item>
          </template>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer" v-if="activeTab === 'account'">
        <el-button type="primary" @click="handleBindSubmit" :loading="bindLoading">
          绑定账号
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import {
  fuStarLogin,
  fuStarLoginGetCaptha,
  fuStarLoginGetVericode,
  fuStarLoginBySms,
  generateTicket, // 确保api文件中已导出此方法
} from '@/api/fstar'
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible', 'success'])

// 双向绑定处理
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

// Tab控制
const activeTab = ref('qrcode') // 默认使用二维码

// 二维码相关状态
const qrLoading = ref(false)
const qrCodeUrl = ref('')

// 账号登录相关状态
const bindStep = ref(1) // 1: 账号密码, 2: 验证码
const bindLoading = ref(false)
const captchaBase64 = ref('')

const bindForm = reactive({
  username: '',
  password: '',
  graphicCode: '',
  smsCode: '',
})

// 重置表单
const resetBindForm = () => {
  activeTab.value = 'qrcode' // 重置回默认
  bindStep.value = 1
  bindForm.username = ''
  bindForm.password = ''
  bindForm.graphicCode = ''
  bindForm.smsCode = ''
  captchaBase64.value = ''
  bindLoading.value = false
  qrCodeUrl.value = ''
}

// 弹窗打开时逻辑
const handleDialogOpen = () => {
  if (activeTab.value === 'qrcode') {
    initQrCode()
  }
}

// 切换Tab逻辑
const handleTabChange = (tabName) => {
  if (tabName === 'qrcode' && !qrCodeUrl.value) {
    initQrCode()
  }
}

// 生成二维码逻辑
const initQrCode = async () => {
  qrLoading.value = true
  qrCodeUrl.value = ''
  try {
    const res = await generateTicket()
    if (res.code === 1) {
      // 兼容直接返回ticket或在data对象中
      const ticket = res.data?.ticket || res.data // 根据实际返回结构取值

      if (ticket) {
        // 拼接跳转链接
        const baseUrl = window.location.origin
        const targetUrl = `${baseUrl}/getUserInfo?ticket=${ticket}`

        // 生成二维码 Base64
        qrCodeUrl.value = await QRCode.toDataURL(targetUrl, {
          width: 200,
          margin: 2,
          errorCorrectionLevel: 'M',
        })
      } else {
        ElMessage.error('未能获取有效的Ticket')
      }
    } else {
      ElMessage.error(res.message || '获取二维码配置失败')
    }
  } catch (error) {
    console.error('QR Generate Error:', error)
    ElMessage.error('生成二维码失败')
  } finally {
    qrLoading.value = false
  }
}

// 获取图形验证码
const getCaptchaImage = async () => {
  try {
    const res = await fuStarLoginGetCaptha({ fustar_username: bindForm.username })
    if (res.code === 1) {
      if (res.data?.meta?.code === 0) {
        const rawImg = res.data.data
        captchaBase64.value = rawImg.startsWith('data:image')
          ? rawImg
          : `data:image/png;base64,${rawImg}`
      } else {
        ElMessage.error(res.data?.meta?.message || '图形验证码获取失败')
      }
    } else {
      ElMessage.error('图形验证码服务异常')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络请求错误')
  }
}

// 发送短信验证码
const sendSmsCode = async () => {
  if (!bindForm.graphicCode) {
    return ElMessage.warning('请先输入图形验证码')
  }

  try {
    const res = await fuStarLoginGetVericode({
      fustar_username: bindForm.username,
      graphic_code: bindForm.graphicCode,
    })

    if (res.code === 1) {
      if (res.data?.meta?.code === 0) {
        ElMessage.success('短信验证码已发送')
      } else {
        ElMessage.error(res.data?.meta?.message || '发送短信失败')
        getCaptchaImage()
      }
    } else {
      ElMessage.error('短信服务异常')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络请求错误')
  }
}

// 处理绑定提交按钮 (仅用于账号登录模式)
const handleBindSubmit = async () => {
  if (bindStep.value === 1) {
    // 步骤1：账号密码登录
    if (!bindForm.username || !bindForm.password) {
      return ElMessage.warning('请输入账号和密码')
    }

    bindLoading.value = true
    try {
      const res = await fuStarLogin({
        fustar_username: bindForm.username,
        fustar_password: bindForm.password,
      })

      bindLoading.value = false

      if (res.code === 1) {
        ElMessage.success('绑定成功')
        dialogVisible.value = false
        emit('success') // 通知父组件刷新列表
      } else if (res.code === 1002) {
        // 需要下一步操作
        bindStep.value = 2
        getCaptchaImage()
      } else {
        ElMessage.error(res.message || '绑定失败')
      }
    } catch (error) {
      bindLoading.value = false
      console.error(error)
      ElMessage.error('登录请求失败')
    }
  } else {
    // 步骤2：短信验证码提交
    if (!bindForm.smsCode) {
      return ElMessage.warning('请输入短信验证码')
    }

    bindLoading.value = true
    try {
      const res = await fuStarLoginBySms({
        fustar_username: bindForm.username,
        code: bindForm.smsCode,
      })

      bindLoading.value = false

      if (res.code === 1) {
        if (res.data?.meta?.code === 0) {
          ElMessage.success('账号绑定成功')
          dialogVisible.value = false
          emit('success') // 通知父组件刷新列表
        } else {
          ElMessage.error(res.data?.meta?.message || '验证失败')
        }
      } else {
        ElMessage.error('绑定服务异常')
      }
    } catch (error) {
      bindLoading.value = false
      console.error(error)
      ElMessage.error('网络请求错误')
    }
  }
}
</script>

<style scoped>
.bind-tabs {
  margin-bottom: 10px;
}
.account-form {
  margin-top: 20px;
}

/* 二维码样式 */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
}
.qr-box {
  text-align: center;
}
.qr-box img {
  width: 200px;
  height: 200px;
  display: block;
  margin: 0 auto 15px;
}
.qr-tip {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 8px 0;
}
.qr-sub-tip {
  font-size: 13px;
  color: #909399;
  margin: 0;
}
.qr-error {
  text-align: center;
  color: #f56c6c;
}

/* 原有样式 */
.captcha-row,
.sms-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.captcha-img-box {
  width: 100px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
}
.captcha-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.el-alert {
  margin: 5px 20px 20px 20px;
}
.el-alert:first-child {
  margin: 0;
}
</style>
