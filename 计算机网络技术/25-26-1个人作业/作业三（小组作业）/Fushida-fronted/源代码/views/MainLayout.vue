<template>
  <MainHeader />
  <el-container class="main-layout">
    <QRCodeDialog
      v-model:visible="dialogVisible"
      :qr-code-value="qrCodeValue"
      :align-center="true"
      @refresh="fetchQRCode"
    />

    <BindDialog v-model:visible="bindDialogVisible" @success="handleBindSuccess" />

    <el-main class="main-content">
      <div class="action-bar">
        <el-card class="action-panel" shadow="never" style="border-radius: 10px; padding: 16px">
          <el-row :gutter="24" justify="center" align="middle">
            <el-col :span="6" class="action-col">
              <el-popover content="查看校园卡余额、展示付款码" width="210" placement="bottom">
                <template #reference>
                  <div class="action-card" @click="handleCampusCardClick">
                    <el-icon :size="60" color="#409EFF"><CreditCard /></el-icon>
                    <div class="card-text">校园卡</div>
                  </div>
                </template>
              </el-popover>
            </el-col>

            <el-col :span="6" class="action-col">
              <el-popover content="展示身份码，用于出入门禁" width="200" placement="bottom">
                <template #reference>
                  <div class="action-card" @click="handleIdCodeClick">
                    <el-icon :size="60" color="#67C23A"><User /></el-icon>
                    <div class="card-text">身份码</div>
                  </div>
                </template>
              </el-popover>
            </el-col>

            <el-col :span="6" class="action-col">
              <el-popover
                content="选择图片进行二维码扫描，或拖动图片到此处"
                width="200"
                placement="bottom"
              >
                <template #reference>
                  <div
                    class="action-card"
                    :class="{ 'is-drag-over': isDragOver }"
                    @click="handleScanLoginClick"
                    @dragover.prevent="isDragOver = true"
                    @dragleave.prevent="isDragOver = false"
                    @drop.prevent="handleDrop"
                  >
                    <el-icon :size="60" color="#E6A23C"><Pointer /></el-icon>
                    <div class="card-text">{{ isDragOver ? '松开上传' : '选图扫码' }}</div>
                  </div>
                </template>
              </el-popover>
            </el-col>

            <el-col :span="6" class="action-col">
              <el-popover content="截取当前屏幕内容进行二维码扫描" width="240" placement="bottom">
                <template #reference>
                  <div
                    class="action-card"
                    @click="handleScreenshotLogin"
                    v-loading="screenshotLoading"
                  >
                    <el-icon :size="60" color="#E6A23C"><FullScreen /></el-icon>
                    <div class="card-text">截屏扫码</div>
                  </div>
                </template>
              </el-popover>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <el-divider />
      <div class="mini-program-grid">
        <template v-for="group in groupedMiniPrograms" :key="group.category">
          <h3 class="category-title" style="margin: 12px 12px">{{ group.category }}</h3>
          <el-card class="action-panel" shadow="never" style="border-radius: 10px">
            <el-row :gutter="12">
              <el-col :span="6" v-for="item in group.items" :key="item.id">
                <a :href="item.appUrl" target="_blank" class="program-link">
                  <el-card shadow="hover" class="program-card">
                    <el-image :src="item.icon" class="program-icon">
                      <template #error>
                        <div
                          class="program-icon"
                          style="display: flex; align-items: center; justify-content: center"
                        >
                          <svg
                            width="60"
                            height="60"
                            viewBox="0 0 60 60"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M44 16C44 22.6274 38.6274 28 32 28C29.9733 28 28.0639 27.4975 26.3896 26.6104L9 44L4 39L21.3896 21.6104C20.5025 19.9361 20 18.0267 20 16C20 9.37258 25.3726 4 32 4C34.0267 4 35.9361 4.50245 37.6104 5.38959L30 13L35 18L42.6104 10.3896C43.4975 12.0639 44 13.9733 44 16Z"
                              fill="none"
                              stroke="#333"
                              stroke-width="4"
                              stroke-linecap="square"
                              stroke-linejoin="bevel"
                            />
                          </svg>
                        </div>
                      </template>
                    </el-image>
                    <div>
                      <el-text class="program-name" line-clamp="2">{{ item.name }}</el-text>
                    </div>
                  </el-card>
                </a>
              </el-col>
            </el-row>
          </el-card>
        </template>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

import { useUserStore } from '@/store/user'
// API 导入
import { getAAP, getQRCode, fuStarScanQrcode } from '@/api/fstar'
import QRCodeDialog from '@/components/QRCodeDialog.vue'
import BindDialog from '@/components/BindDialog.vue'
import MainHeader from '@/components/MainHeader.vue'

const userStore = useUserStore()
const miniPrograms = ref([])

// 按 appCategory 分组
const CATEGORY_PRIORITY = [
  '综合服务',
  '教学服务',
  '学生服务',
  '公共服务',
  '网信服务',
  '财务服务',
  '资产服务',
  '办公服务',
  '事项办理',
  '图书馆服务',
  '科研服务',
  '其它服务',
]
const groupedMiniPrograms = computed(() => {
  const map = {}
  miniPrograms.value.forEach((item) => {
    const cat = item.appCategory || '其它服务'
    if (!map[cat]) map[cat] = []
    map[cat].push(item)
  })
  const groups = Object.keys(map).map((k) => ({ category: k, items: map[k] }))
  groups.sort((a, b) => {
    const ia = CATEGORY_PRIORITY.indexOf(a.category)
    const ib = CATEGORY_PRIORITY.indexOf(b.category)
    if (ia === -1 && ib === -1) return a.category.localeCompare(b.category)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
  return groups
})

// 身份码dialog
const dialogVisible = ref(false)
const qrCodeValue = ref('')

// 绑定账号dialog控制
const bindDialogVisible = ref(false)

const handleBindSuccess = () => {
  fetchMiniPrograms() // 绑定成功后重新加载列表
}

const fetchQRCode = async () => {
  qrCodeValue.value = ''
  try {
    const response = await getQRCode()
    if (response.code === 1001) {
      dialogVisible.value = false
      bindDialogVisible.value = true
      return
    }
    qrCodeValue.value = response.data
    console.log('获取二维码成功:', qrCodeValue.value)
  } catch (error) {
    ElMessage.error('获取二维码失败！')
    console.error(error)
  }
}

const handleCampusCardClick = () => {
  const campusCardProgram = miniPrograms.value.find((program) => program.name === '校园卡')
  if (campusCardProgram) {
    if (campusCardProgram.appUrl) {
      window.open(campusCardProgram.appUrl, '_blank')
    } else {
      ElMessage.warning('链接不存在')
    }
  } else {
    ElMessage.error('未找到“校园卡”功能')
  }
}

const handleIdCodeClick = () => {
  dialogVisible.value = true
  fetchQRCode()
}

// 新增：用于控制拖拽时的样式反馈
const isDragOver = ref(false)

// 1. 核心逻辑抽离：处理文件读取与上传
const handleScanFile = (file) => {
  if (!file) return

  // 简单的类型校验
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请拖入图片文件')
    return
  }

  const reader = new FileReader()
  reader.onload = async () => {
    const dataUrl = reader.result
    if (typeof dataUrl !== 'string') {
      ElMessage.error('无法读取图片')
      return
    }
    try {
      const res = await fuStarScanQrcode({ img: dataUrl })
      if (res.code === 1001) {
        bindDialogVisible.value = true
      } else if (res.code === 1) {
        ElMessage.success('扫码成功')
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('网络请求错误')
    }
  }
  reader.readAsDataURL(file)
}

// 2. 原有的点击上传逻辑
const handleScanLoginClick = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files?.[0]
    handleScanFile(file)
  }
  input.click()
}

// 拖拽释放处理
const handleDrop = (e) => {
  isDragOver.value = false // 重置样式
  const file = e.dataTransfer.files[0] // 获取拖拽的文件
  handleScanFile(file)
}

// 模拟从后端获取小程序列表
const fetchMiniPrograms = () => {
  getAAP()
    .then((response) => {
      // 检查特定状态码 1001：触发绑定流程
      if (response.code === 1001) {
        bindDialogVisible.value = true
        return
      }

      if (response.code === 1) {
        const perLoadApps = response.data
        if (perLoadApps) {
          miniPrograms.value = perLoadApps
        } else {
          ElMessage.error('获取小程序列表失败：数据结构异常')
        }
      } else {
        ElMessage.error('获取小程序列表失败')
      }
    })
    .catch(() => {
      ElMessage.error('获取小程序列表失败')
    })
}

// 截图加载状态
const screenshotLoading = ref(false)
// 处理截图登录逻辑
const handleScreenshotLogin = async () => {
  // 检查浏览器支持
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    ElMessage.error('您的浏览器不支持屏幕截图功能，请使用Chrome/Edge等现代浏览器')
    return
  }

  try {
    screenshotLoading.value = true
    // 调用浏览器API，请求屏幕/窗口分享
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'never' },
      audio: false,
    })

    // 创建隐藏的视频标签来读取流
    const video = document.createElement('video')
    video.srcObject = stream
    video.play()
    // 等待视频加载并播放
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve()
    })
    // 在 Canvas 上绘制当前帧
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    // 停止屏幕共享
    stream.getTracks().forEach((track) => track.stop())
    video.srcObject = null
    // 获取图片Base64数据
    const dataUrl = canvas.toDataURL('image/png')
    try {
      const res = await fuStarScanQrcode({ img: dataUrl })
      if (res.code === 1001) {
        bindDialogVisible.value = true // 需要绑定
      } else if (res.code === 1) {
        ElMessage.success('扫码登录成功')
      }
    } catch (apiErr) {
      console.error(apiErr)
      ElMessage.error('服务器请求失败')
    }
  } catch (err) {
    // 捕获用户取消分享
    if (err.name !== 'NotAllowedError') {
      console.error('截图失败:', err)
      ElMessage.error('截图失败')
    }
  } finally {
    screenshotLoading.value = false
  }
}

onMounted(() => {
  fetchMiniPrograms()
  userStore.loadUserFromLocalStorage()
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  flex-direction: column;
}

.main-content {
  flex-grow: 1;
  padding: 20px;
  background-color: #f5f7fa;
}
.action-bar {
  margin-bottom: 20px;
}
.action-card {
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.action-card :deep(.el-card__body) {
  padding: 3% 2%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-text {
  margin-top: 15px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
.program-link {
  text-decoration: none;
  color: inherit;
}
.program-card {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: none;
  margin: 2px;
}
.program-icon {
  width: 60px;
  height: 60px;
}
.program-name {
  font-size: 16px;
  line-height: 1;
  height: calc(1em * 2);
}

/* 拖拽时的激活样式 */
.action-card.is-drag-over {
  border-color: #e6a23c;
  transform: scale(1.2); /* 微微放大 */
}
</style>
