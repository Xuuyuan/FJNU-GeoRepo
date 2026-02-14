<template>
  <div class="login-container">
    <div class="login-box">
      <el-card class="login-card">
        <template #header>
          <div class="card-header">
            <img src="@/assets/logo.png" alt="logo" class="logo" />
          </div>
        </template>
        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0px">
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              show-password
              :prefix-icon="Lock"
              size="large"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              style="width: 100%"
              @click="handleLogin"
              :loading="loading"
              size="large"
            >
              登 录
            </el-button>
          </el-form-item>
          <el-form-item>
            <span>还没有账号？</span>
            <el-button type="text" @click="$router.push('/register')">立即注册</el-button>
            <el-button type="text" @click="forgetPasswordDialogVisible = true">忘记密码</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>

  <el-dialog v-model="forgetPasswordDialogVisible" title="提示" :show-close="false">
    <span>忘记密码请联系管理员处理。QQ：337845818</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="forgetPasswordDialogVisible = false">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)
const forgetPasswordDialogVisible = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const loginRules = reactive({
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 4, message: '账号不能小于4位数', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能小于6位数', trigger: 'blur' },
  ],
})

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      const success = await userStore.login(loginForm.username, loginForm.password)
      loading.value = false
      if (success) {
        ElMessage.success('登录成功！')
        router.push('/')
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 100vh;
  width: 100%;

  background-color: #f0f2f5;
}

.login-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-title {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.logo {
  height: 44px;
  margin-right: 16px;
}

h1 {
  font-size: 30px;
  color: #333;
  margin: 0;
}

.login-card {
  width: 400px;
}

.card-header {
  text-align: center;
  font-size: 20px;
}
</style>
