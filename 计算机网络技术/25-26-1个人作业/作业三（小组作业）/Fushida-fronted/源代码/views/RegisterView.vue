<template>
  <div class="register-container">
    <div class="register-box">
      <el-card class="register-card">
        <template #header>
          <div class="card-header">
            <img src="@/assets/logo.png" alt="logo" class="logo" />
          </div>
        </template>
        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          label-width="0px"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入账号"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
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
              @click="handleregister"
              :loading="loading"
              size="large"
            >
              注 册
            </el-button>
          </el-form-item>
          <el-form-item>
            <span>已有账号，</span>
            <el-button type="text" @click="$router.push('/login')">返回登录</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { user_register } from '@/api/user'

const router = useRouter()
const registerFormRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
})

const registerRules = reactive({
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 4, message: '账号不能小于4位数', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能小于6位数', trigger: 'blur' },
  ],
})

const handleregister = () => {
  registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      const response = await user_register(registerForm.username, registerForm.password)
      loading.value = false
      if (response.code === 1) {
        ElMessage.success(response.msg || '注册成功！')
        router.push('/login')
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 100vh;
  width: 100%;

  background-color: #f0f2f5;
}

.register-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.register-title {
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

.register-card {
  width: 400px;
}

.card-header {
  text-align: center;
  font-size: 20px;
}
</style>
