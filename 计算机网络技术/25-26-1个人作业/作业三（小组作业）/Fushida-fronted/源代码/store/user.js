import { defineStore } from 'pinia'
import { ref } from 'vue'
import { user_login } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const username = ref('')
  const token = ref('')

  async function login(Pusername, password) {
    try {
      const response = await user_login(Pusername, password)

      username.value = response.data.username
      token.value = response.data.access_token
      console.log(username)
      console.log(token)
      localStorage.setItem('username', username.value)
      localStorage.setItem('token', token.value)

      return true
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  function logout() {
    username.value = ''
    token.value = ''
    localStorage.removeItem('username')
    localStorage.removeItem('token')
  }

  function loadUserFromLocalStorage() {
    const storedUsername = localStorage.getItem('username')
    const storedToken = localStorage.getItem('token')
    if (storedUsername && storedToken) {
      username.value = storedUsername
      token.value = storedToken
    }
  }

  return { username, token, login, logout, loadUserFromLocalStorage }
})
