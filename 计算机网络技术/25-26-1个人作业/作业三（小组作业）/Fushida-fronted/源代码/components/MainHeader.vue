<template>
  <ChangePasswordDialog
    v-model:visible="changePasswordDialogVisible"
    :loading="isSubmitting"
    @submit="handleChangePassword"
  />
  <el-header class="main-header">
    <div class="header-left">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
      <el-menu
        mode="horizontal"
        :ellipsis="false"
        :default-active="$route.path"
        router
        style="border-bottom: none"
      >
        <el-menu-item index="/">主页</el-menu-item>
        <el-menu-item index="/announcements">公告</el-menu-item>
      </el-menu>
    </div>
    <div class="header-right">
      <el-dropdown @command="handleCommand">
        <span
          class="el-dropdown-link no-focus"
          tabindex="0"
          style="outline: none; box-shadow: none"
        >
          {{ userStore.username }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="unbind" :icon="Remove">解除绑定</el-dropdown-item>
            <el-dropdown-item command="openPasswordDialog" :icon="Operation"
              >修改密码</el-dropdown-item
            >

            <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>
<script setup>
import { Operation, SwitchButton, Remove } from '@element-plus/icons-vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import { useUserStore } from '@/store/user'
// API 导入
import { changePassword, unbind } from '@/api/fstar'

const changePasswordDialogVisible = ref(false)
const isSubmitting = ref(false) // 控制提交按钮的 loading 状态

const handleChangePassword = async (payload) => {
  const { oldPassword, newPassword } = payload

  // 开启加载状态
  isSubmitting.value = true

  try {
    const res = await changePassword({ old_password: oldPassword, new_password: newPassword })
    if (res.code === 1) {
      ElMessage.success('密码修改成功，请重新登录')
      // 退出登录，等待1秒
      await new Promise((resolve) => setTimeout(resolve, 1000))
      userStore.logout()
      handleCommand('force_logout')
    } else {
      throw new Error(res.msg || '修改失败')
    }
    changePasswordDialogVisible.value = false

    // logout()
  } catch (error) {
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

const userStore = useUserStore()
const router = useRouter()

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('您确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        localStorage.removeItem('token')
        router.push('/login')
        ElMessage.success('已成功退出登录')
      })
      .catch(() => {})
  } else if (command === 'openPasswordDialog') {
    changePasswordDialogVisible.value = true
  } else if (command === 'force_logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'unbind') {
    ElMessageBox.confirm('您确定要解除绑定福Star账号吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        unbind().then((res) => {
          if (res.code === 1) {
            ElMessage.success('解绑成功')
            // 刷新页面
            window.location.reload()
          } else {
            ElMessage.error(res.msg || '解绑失败')
          }
        })
      })
      .catch(() => {})
  }
}

onMounted(() => {
  userStore.loadUserFromLocalStorage()
})
</script>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
}
.header-left {
  display: flex;
  align-items: center;
}
.logo {
  height: 40px;
  margin-right: 20px;
}
.header-right .el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}
</style>
