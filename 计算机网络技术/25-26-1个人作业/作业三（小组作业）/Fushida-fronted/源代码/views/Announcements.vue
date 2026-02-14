<template>
  <MainHeader />
  <el-container>
    <el-main style="padding: 20px">
      <el-row align="middle" justify="space-between" style="margin: 0 0 12px 0">
        <h2 style="margin: 0">公告</h2>
        <el-space>
          <el-input
            v-model="query"
            size="large"
            placeholder="搜索标题或来源"
            clearable
            style="width: 260px"
          />
          <el-button size="large" type="primary" @click="fetchAnnouncements">刷新</el-button>
        </el-space>
      </el-row>

      <el-skeleton :loading="loading" animated>
        <template #template>
          <el-skeleton-item variant="text" style="width: 100%; height: 72px; margin-top: 12px" />
        </template>

        <div v-if="!loading">
          <el-empty description="暂无公告" v-if="filteredAnnouncements.length === 0" />
          <el-row :gutter="12">
            <el-col :span="24" v-for="announcement in filteredAnnouncements" :key="announcement.id">
              <el-popover
                :visible="activeId === announcement.id"
                placement="top-start"
                width="50%"
                trigger="manual"
                :popper-class="'announcement-popover'"
                @update:visible="
                  (val) => {
                    if (val) showPopover(announcement.id)
                    else hidePopover(announcement.id)
                  }
                "
              >
                <div class="pop-content">
                  {{ announcement.content || '本公告无概要内容。' }}
                </div>
                <template #reference>
                  <el-card
                    class="announcement-card"
                    shadow="hover"
                    @click="openAnnouncement(announcement.url)"
                    @mouseenter="showPopover(announcement.id)"
                    @mouseleave="hidePopover(announcement.id)"
                    @touchstart.prevent="onTouchStart(announcement.id)"
                    @touchend.prevent="onTouchEnd(announcement.id)"
                  >
                    <el-row align="middle" justify="space-between">
                      <el-col :span="18">
                        <el-row align="middle" :gutter="10">
                          <el-col>
                            <div class="title-row">
                              <el-tag :type="tagType(announcement.origin)" size="large">
                                {{ announcement.origin }}
                              </el-tag>
                              <el-link
                                :underline="false"
                                class="announcement-title"
                                @click.stop="openAnnouncement(announcement.url)"
                              >
                                {{ announcement.title }}
                              </el-link>
                            </div>
                          </el-col>
                        </el-row>
                      </el-col>

                      <el-col :span="6" class="time-col">
                        <div class="time-text">{{ formatTime(announcement.time) }}</div>
                        <el-badge
                          v-if="announcement.badge"
                          :value="announcement.badge"
                          class="badge"
                        />
                      </el-col>
                    </el-row>
                  </el-card>
                </template>
              </el-popover>
            </el-col>
          </el-row>
        </div>
      </el-skeleton>
    </el-main>
  </el-container>
</template>

<script setup>
defineOptions({ name: 'AnnouncementsView' })
import MainHeader from '@/components/MainHeader.vue'
import { ref, onMounted, computed } from 'vue'
import { getAnnouncements } from '@/api/fstar'

const announcements = ref([])
const loading = ref(false)
const query = ref('')

const activeId = ref(null)
let touchHideTimer = null

const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const res = await getAnnouncements()
    if (res && res.code === 1) {
      announcements.value = Array.isArray(res.data) ? res.data : []
    } else {
      console.error(res?.msg || '获取公告失败')
      announcements.value = []
    }
  } catch (error) {
    console.error(error)
    announcements.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAnnouncements()
})

const filteredAnnouncements = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return announcements.value
  return announcements.value.filter((a) => {
    const title = (a.title || '').toLowerCase()
    const origin = (a.origin || '').toLowerCase()
    return title.includes(q) || origin.includes(q)
  })
})

const openAnnouncement = (url) => {
  if (!url) return
  window.open(url, '_blank')
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d.getTime())) return String(t)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return `${Math.floor(diff)} 秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  return d.toLocaleString()
}

const tagType = (origin) => {
  if (!origin) return 'info'
  if (/重要/i.test(origin)) return 'danger'
  return 'primary'
}

const showPopover = (id) => {
  clearTouchTimer()
  activeId.value = id
}
const hidePopover = (id) => {
  if (activeId.value === id) activeId.value = null
}
const onTouchStart = (id) => {
  clearTouchTimer()
  activeId.value = id
}
const onTouchEnd = (id) => {
  clearTouchTimer()
  touchHideTimer = setTimeout(() => {
    if (activeId.value === id) activeId.value = null
  }, 1500)
}
const clearTouchTimer = () => {
  if (touchHideTimer) {
    clearTimeout(touchHideTimer)
    touchHideTimer = null
  }
}
</script>

<style scoped>
.announcement-card {
  cursor: pointer;
  margin-bottom: 10px;
  border-radius: 12px;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}
.announcement-card:hover {
  transform: translateY(-4px);
}
.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.announcement-title {
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.time-col {
  text-align: right;
}
.time-text {
  color: #909399;
  font-size: 12px;
}
.badge {
  margin-top: 6px;
  display: inline-block;
}

.announcement-popover .pop-content {
  max-height: 220px;
  overflow: auto;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 6px 8px;
}
</style>
