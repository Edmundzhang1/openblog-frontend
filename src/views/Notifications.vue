<template>
  <main class="notifications-page fade-in">
    <header class="page-header">
      <div class="container">
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.subtitle }}</p>
      </div>
    </header>

    <section class="notifications-section">
      <div class="container notification-layout">
        <div class="notification-toolbar">
          <div class="filter-control" :aria-label="copy.filterLabel">
            <button type="button" :class="{ active: !unreadOnly }" @click="setFilter(false)">
              {{ copy.all }}
            </button>
            <button type="button" :class="{ active: unreadOnly }" @click="setFilter(true)">
              {{ copy.unread }}
              <span v-if="unreadCount">{{ unreadCount }}</span>
            </button>
          </div>

          <div class="toolbar-actions">
            <button
              type="button"
              class="icon-action"
              :title="copy.refresh"
              :aria-label="copy.refresh"
              :disabled="loading"
              @click="loadNotifications"
            >
              <RefreshCw :size="18" :class="{ spinning: loading }" aria-hidden="true" />
            </button>
            <button type="button" class="mark-all" :disabled="markingAll || unreadCount === 0" @click="markAllRead">
              <CheckCheck :size="18" aria-hidden="true" />
              {{ copy.markAll }}
            </button>
          </div>
        </div>

        <div v-if="loading && notifications.length === 0" class="notification-state">
          <RefreshCw :size="24" class="spinning" aria-hidden="true" />
          <p>{{ copy.loading }}</p>
        </div>

        <div v-else-if="errorMessage" class="notification-state error-state" role="alert">
          <p>{{ errorMessage }}</p>
          <button type="button" @click="loadNotifications">{{ copy.retry }}</button>
        </div>

        <div v-else-if="notifications.length" class="notification-list">
          <article
            v-for="item in notifications"
            :key="item.id"
            class="notification-item"
            :class="{ unread: !item.is_read }"
          >
            <div class="notification-type" :class="typeClass(item.type)">
              <PackageCheck v-if="item.type === 'DELIVERY'" :size="20" aria-hidden="true" />
              <ClipboardList v-else-if="item.type === 'ORDER_UPDATE'" :size="20" aria-hidden="true" />
              <Bell v-else :size="20" aria-hidden="true" />
            </div>
            <div class="notification-content">
              <header>
                <h2>{{ item.title }}</h2>
                <span v-if="!item.is_read" class="unread-dot" :title="copy.unreadLabel"></span>
              </header>
              <p>{{ item.content }}</p>
              <time :datetime="item.created_at">{{ formatDate(item.created_at) }}</time>
            </div>
            <div class="notification-actions">
              <button
                v-if="!item.is_read"
                type="button"
                class="icon-action"
                :title="copy.markRead"
                :aria-label="copy.markRead"
                :disabled="markingIds.has(item.id)"
                @click="markRead(item)"
              >
                <Check :size="18" aria-hidden="true" />
              </button>
              <button v-if="item.related_id" type="button" class="open-related" @click="openRelated(item)">
                {{ copy.viewOrder }}
                <ExternalLink :size="16" aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>

        <div v-else class="notification-state empty-state">
          <Inbox :size="32" aria-hidden="true" />
          <strong>{{ unreadOnly ? copy.noUnread : copy.empty }}</strong>
          <p>{{ copy.emptyHint }}</p>
        </div>

        <nav v-if="pagination.total_pages > 1" class="pagination" :aria-label="copy.pagination">
          <button type="button" :disabled="pagination.page <= 1 || loading" @click="changePage(-1)">
            <ChevronLeft :size="18" aria-hidden="true" />
            {{ copy.previous }}
          </button>
          <span>{{ copy.page.replace('{page}', pagination.page).replace('{total}', pagination.total_pages) }}</span>
          <button type="button" :disabled="pagination.page >= pagination.total_pages || loading" @click="changePage(1)">
            {{ copy.next }}
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </section>
  </main>
</template>

<script>
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Inbox,
  PackageCheck,
  RefreshCw
} from '@lucide/vue'
import { inject } from 'vue'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest, eventBus, showToast } from '../utils/eventBus'

const CONTENT = {
  zh: {
    title: '通知中心', subtitle: '集中查看订单进度、交付物与系统提醒', filterLabel: '通知筛选',
    all: '全部', unread: '未读', refresh: '刷新通知', markAll: '全部已读', loading: '正在加载通知...',
    retry: '重新加载', markRead: '标记为已读', viewOrder: '查看订单', unreadLabel: '未读通知',
    empty: '暂无通知', noUnread: '没有未读通知', emptyHint: '订单状态或交付进度变化后，通知会显示在这里。',
    markedAll: '已将全部通知标记为已读', pagination: '通知分页', previous: '上一页', next: '下一页',
    page: '第 {page} / {total} 页'
  },
  en: {
    title: 'Notifications', subtitle: 'Review order, delivery, and system updates in one place', filterLabel: 'Notification filter',
    all: 'All', unread: 'Unread', refresh: 'Refresh notifications', markAll: 'Mark all read', loading: 'Loading notifications...',
    retry: 'Try again', markRead: 'Mark as read', viewOrder: 'View order', unreadLabel: 'Unread notification',
    empty: 'No notifications yet', noUnread: 'You are all caught up', emptyHint: 'Order and delivery updates will appear here.',
    markedAll: 'All notifications marked as read.', pagination: 'Notification pages', previous: 'Previous', next: 'Next',
    page: 'Page {page} of {total}'
  }
}

export default {
  name: 'Notifications',
  components: {
    Bell, Check, CheckCheck, ChevronLeft, ChevronRight, ClipboardList,
    ExternalLink, Inbox, PackageCheck, RefreshCw
  },
  setup() {
    return { i18n: inject('i18n') }
  },
  data() {
    return {
      notifications: [],
      unreadCount: 0,
      unreadOnly: false,
      loading: false,
      markingAll: false,
      markingIds: new Set(),
      errorMessage: '',
      pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 }
    }
  },
  computed: {
    copy() {
      return CONTENT[this.i18n.getLocale()]
    }
  },
  mounted() {
    this.loadNotifications()
  },
  methods: {
    async loadNotifications() {
      this.loading = true
      this.errorMessage = ''
      try {
        const query = new URLSearchParams({
          unread_only: String(this.unreadOnly),
          page: String(this.pagination.page),
          page_size: String(this.pagination.page_size)
        })
        const data = await apiRequest(`${API_ENDPOINTS.NOTIFICATIONS}?${query}`, { showError: false })
        this.notifications = Array.isArray(data?.notifications) ? data.notifications : []
        this.unreadCount = Math.max(0, Number(data?.unread_count || 0))
        this.pagination = { ...this.pagination, ...(data?.pagination || {}) }
        eventBus.emit('notifications-updated')
      } catch (error) {
        this.errorMessage = error.message
      } finally {
        this.loading = false
      }
    },
    setFilter(unreadOnly) {
      if (this.unreadOnly === unreadOnly) return
      this.unreadOnly = unreadOnly
      this.pagination.page = 1
      this.loadNotifications()
    },
    async markRead(item) {
      if (item.is_read || this.markingIds.has(item.id)) return
      this.markingIds = new Set(this.markingIds).add(item.id)
      try {
        await apiRequest(API_ENDPOINTS.NOTIFICATION_READ(item.id), { method: 'PATCH' })
        item.is_read = true
        this.unreadCount = Math.max(0, this.unreadCount - 1)
        if (this.unreadOnly) {
          const remainingTotal = Math.max(0, this.pagination.total - 1)
          const totalPages = Math.ceil(remainingTotal / this.pagination.page_size)
          this.pagination.page = Math.min(this.pagination.page, Math.max(1, totalPages))
          await this.loadNotifications()
        } else {
          eventBus.emit('notifications-updated')
        }
      } finally {
        const next = new Set(this.markingIds)
        next.delete(item.id)
        this.markingIds = next
      }
    },
    async markAllRead() {
      if (this.unreadCount === 0 || this.markingAll) return
      this.markingAll = true
      try {
        await apiRequest(API_ENDPOINTS.NOTIFICATION_READ_ALL, { method: 'PATCH' })
        this.notifications = this.unreadOnly ? [] : this.notifications.map((item) => ({ ...item, is_read: true }))
        this.unreadCount = 0
        eventBus.emit('notifications-updated')
        showToast(this.copy.markedAll, 'success')
      } finally {
        this.markingAll = false
      }
    },
    async openRelated(item) {
      if (!item.is_read) {
        try {
          await this.markRead(item)
        } catch {
          // 阅读状态是次要操作，不应阻止用户查看关联订单。
        }
      }
      await this.$router.push({ path: '/orders', query: { order: item.related_id } })
    },
    changePage(delta) {
      const nextPage = this.pagination.page + delta
      if (nextPage < 1 || nextPage > this.pagination.total_pages) return
      this.pagination.page = nextPage
      this.loadNotifications()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    typeClass(type) {
      return {
        ORDER_UPDATE: 'order-type',
        DELIVERY: 'delivery-type',
        SYSTEM: 'system-type'
      }[type] || 'system-type'
    },
    formatDate(value) {
      if (!value) return '-'
      return new Intl.DateTimeFormat(this.i18n.getLocale() === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(value))
    }
  }
}
</script>

<style scoped>
.notifications-section { padding: 64px 20px; }
.notification-layout { max-width: 920px; }
.notification-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 20px; }
.filter-control { display: inline-flex; padding: 3px; border: 1px solid #E5E5E5; border-radius: 8px; background: #F5F5F5; }
.filter-control button { min-height: 36px; padding: 0 16px; border: 0; border-radius: 8px; background: transparent; color: var(--text-muted); font: inherit; font-weight: 700; cursor: pointer; transition: var(--transition); }
.filter-control button.active { background: #fff; color: var(--primary-color); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.filter-control span { display: inline-grid; place-items: center; min-width: 19px; height: 19px; margin-left: 5px; padding: 0 5px; border-radius: 10px; background: #EF4444; color: #fff; font-size: 0.68rem; }
.toolbar-actions, .notification-actions { display: flex; align-items: center; gap: 9px; }
.icon-action { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid #E5E5E5; border-radius: 8px; background: #fff; color: var(--text-dark); cursor: pointer; transition: var(--transition); }
.mark-all, .open-related { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 38px; border: 0; border-radius: 8px; font: inherit; font-weight: 700; cursor: pointer; transition: var(--transition); }
.mark-all { padding: 0 14px; background: var(--primary-color); color: #fff; }
.open-related { padding: 0 12px; background: #EFF6FF; color: var(--primary-color); white-space: nowrap; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.notification-list { display: grid; gap: 10px; }
.notification-item { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; gap: 15px; align-items: start; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; background: #fff; box-shadow: var(--shadow); transition: var(--transition); }
.notification-item.unread { border-left: 4px solid var(--primary-color); background: #fff; }
.notification-type { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; }
.order-type { background: #EFF6FF; color: #1D4ED8; }
.delivery-type { background: #FFFBEB; color: #B45309; }
.system-type { background: #F5F5F5; color: rgba(26, 26, 26, 0.65); }
.notification-content { min-width: 0; }
.notification-content header { display: flex; align-items: center; gap: 8px; }
.notification-content h2 { margin: 0; font-size: 1rem; line-height: 1.45; }
.notification-content p { margin: 6px 0 8px; color: var(--text-muted); line-height: 1.65; overflow-wrap: anywhere; }
.notification-content time { color: var(--text-muted); font-size: 0.78rem; }
.unread-dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: #EF4444; }
.notification-state { min-height: 280px; display: grid; place-items: center; align-content: center; gap: 10px; color: var(--text-muted); text-align: center; }
.notification-state p { margin: 0; }
.notification-state button { min-height: 38px; padding: 0 15px; border: 0; border-radius: 8px; background: var(--primary-color); color: #fff; cursor: pointer; transition: var(--transition); }
.error-state { color: #B91C1C; }
.empty-state strong { color: var(--text-dark); font-size: 1.05rem; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 28px; }
.pagination button { display: inline-flex; align-items: center; gap: 5px; min-height: 38px; padding: 0 12px; border: 1px solid #E5E5E5; border-radius: 8px; background: #fff; color: var(--text-dark); cursor: pointer; transition: var(--transition); }
.pagination span { color: var(--text-muted); font-size: 0.88rem; }
.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 680px) {
  .notifications-section { padding: 28px 14px 52px; }
  .notification-toolbar { align-items: stretch; }
  .notification-toolbar, .notification-item { grid-template-columns: 1fr; }
  .notification-toolbar { display: grid; }
  .filter-control { display: grid; grid-template-columns: 1fr 1fr; }
  .toolbar-actions { justify-content: flex-end; }
  .notification-item { display: grid; grid-template-columns: 42px minmax(0, 1fr); padding: 16px; }
  .notification-actions { grid-column: 1 / -1; justify-content: flex-end; }
  .pagination { gap: 8px; }
  .pagination button { padding: 0 8px; }
}
</style>
