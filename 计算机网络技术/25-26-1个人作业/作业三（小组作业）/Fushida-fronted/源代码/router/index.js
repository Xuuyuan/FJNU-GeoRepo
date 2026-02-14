import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import MainLayout from '../views/MainLayout.vue'
import GetUserInfoLayout from '../views/GetUserInfoLayout.vue'
import AnnouncementsLayout from '../views/Announcements.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: '登录' },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { title: '注册' },
    },
    {
      path: '/',
      name: 'main',
      component: MainLayout,
      meta: { requiresAuth: true, title: '首页' },
    },
    {
      path: '/getUserInfo',
      name: 'getUserInfo',
      component: GetUserInfoLayout,
      meta: { title: '快速绑定账号' },
    },
    {
      path: '/announcements',
      name: 'announcements',
      component: AnnouncementsLayout,
      meta: { requiresAuth: true, title: '公告' },
    },
  ],
})

const mainTitle = '福师达'

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} | ${mainTitle}`
  } else {
    document.title = mainTitle
  }

  const isLoggedIn = !!localStorage.getItem('token')

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
