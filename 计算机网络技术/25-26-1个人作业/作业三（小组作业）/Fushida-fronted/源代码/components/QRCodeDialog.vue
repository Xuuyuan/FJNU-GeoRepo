<template>
  <el-dialog
    :model-value="visible"
    title="我的身份码"
    width="50%"
    @close="handleClose"
    center
    :close-on-click-modal="false"
    :show-close="false"
  >
    <div class="qrcode-container">
      <QrcodeVue v-if="qrCodeValue" :value="qrCodeValue" :size="200" level="H" />
      <div v-else class="qrcode-loading">正在加载...</div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleRefresh">刷新</el-button>
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue'

// props 定义，在父级窗口调用
const props = defineProps({
  // 控制对话框是否显示
  visible: {
    type: Boolean,
    required: true,
  },
  qrCodeValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:visible', 'refresh'])

const handleClose = () => {
  emit('update:visible', false)
}

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped>
.qrcode-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.qrcode-loading {
  color: #999;
}

.dialog-footer {
  display: flex;
  justify-content: space-around;
}

.dialog-footer .el-button {
  width: 40%;
}
</style>
