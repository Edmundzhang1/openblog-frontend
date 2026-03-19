<template>
  <div class="admin-page">
    <header class="page-header">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <div class="container">
      <section class="admin-banner">
        <div>
          <strong>{{ content.welcome }}{{ currentUser?.username || content.defaultAdmin }}</strong>
          <p>{{ content.bannerDesc }}</p>
        </div>
        <router-link to="/orders" class="btn-ghost">{{ content.bannerAction }}</router-link>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <span class="stat-label">{{ content.stats.totalUsers }}</span>
          <strong class="stat-value">{{ stats.totalUsers }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">{{ content.stats.clientUsers }}</span>
          <strong class="stat-value">{{ stats.clientUsers }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">{{ content.stats.adminUsers }}</span>
          <strong class="stat-value">{{ stats.adminUsers }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">{{ content.stats.orders }}</span>
          <strong class="stat-value">{{ stats.orders }}</strong>
        </article>
      </section>

      <section class="quick-actions">
        <router-link to="/chat" class="action-card">
          <span class="action-icon">💬</span>
          <div>
            <h3>{{ content.actions.chatTitle }}</h3>
            <p>{{ content.actions.chatDesc }}</p>
          </div>
        </router-link>
        <router-link to="/blog" class="action-card">
          <span class="action-icon">📰</span>
          <div>
            <h3>{{ content.actions.blogTitle }}</h3>
            <p>{{ content.actions.blogDesc }}</p>
          </div>
        </router-link>
        <router-link to="/todo" class="action-card">
          <span class="action-icon">📅</span>
          <div>
            <h3>{{ content.actions.todoTitle }}</h3>
            <p>{{ content.actions.todoDesc }}</p>
          </div>
        </router-link>
      </section>

      <section class="dashboard-grid">
        <article class="panel">
          <div class="panel-header">
            <h2>{{ content.usersTitle }}</h2>
            <button class="panel-action" @click="refreshData">{{ content.refresh }}</button>
          </div>

          <div v-if="users.length" class="table-wrap">
            <table class="users-table">
              <thead>
                <tr>
                  <th>{{ content.userTable.username }}</th>
                  <th>{{ content.userTable.role }}</th>
                  <th>{{ content.userTable.email }}</th>
                  <th>{{ content.userTable.createdAt }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.username }}</td>
                  <td>
                    <span :class="['role-badge', user.role]">{{ formatRole(user.role) }}</span>
                  </td>
                  <td>{{ user.email || '-' }}</td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">{{ content.emptyUsers }}</div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <h2>{{ content.ordersTitle }}</h2>
          </div>

          <div class="order-list">
            <div v-for="order in orders" :key="order.id" class="order-item">
              <div>
                <div class="order-title">{{ order.id }}</div>
                <div class="order-meta">
                  <span>{{ order.client_name }}</span>
                  <span>{{ formatDate(order.created_at) }}</span>
                </div>
              </div>
              <div class="order-side">
                <span class="status-badge">{{ formatStatus(order.status) }}</span>
                <span class="order-budget">{{ order.budget || content.pendingBudget }}</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { getAllUsers, getCurrentUser } from '../utils/auth'

const COMMISSIONS_STORAGE_KEY = 'furest.frontend.commissions'

const ADMIN_CONTENT = {
  zh: {
    title: '管理后台',
    subtitle: '纯前端演示模式下的管理员工作台',
    welcome: '欢迎，',
    defaultAdmin: '管理员',
    bannerDesc: '当前没有后端服务，用户和订单数据均来自浏览器本地存储，方便你直接验证登录和角色分流。',
    bannerAction: '查看订单查询页',
    usersTitle: '账号列表',
    ordersTitle: '最近订单',
    refresh: '刷新数据',
    emptyUsers: '暂无账号数据',
    pendingBudget: '待沟通',
    stats: {
      totalUsers: '总账号数',
      clientUsers: '普通用户',
      adminUsers: '管理员',
      orders: '本地订单'
    },
    actions: {
      chatTitle: '消息中心',
      chatDesc: '进入站内消息页，检查登录态下的会话访问。',
      blogTitle: '内容页',
      blogDesc: '查看博客与动态展示，确认管理员登录后仍可访问公开页面。',
      todoTitle: '排期工作台',
      todoDesc: '切换到排期页，验证账号登录后可继续处理个人日程。'
    },
    userTable: {
      username: '用户名',
      role: '角色',
      email: '邮箱',
      createdAt: '创建时间'
    },
    roleMap: {
      admin: '管理员',
      user: '普通用户'
    },
    statusMap: {
      submitted: '已提交',
      quoted: '已报价',
      confirmed: '已确认',
      in_progress: '进行中',
      completed: '已完成'
    }
  },
  en: {
    title: 'Admin Dashboard',
    subtitle: 'Administrator workspace for the frontend-only demo',
    welcome: 'Welcome, ',
    defaultAdmin: 'Admin',
    bannerDesc: 'There is no backend running. User and order data are loaded from browser storage so you can test role-based login directly.',
    bannerAction: 'Open order tracking',
    usersTitle: 'Accounts',
    ordersTitle: 'Recent Orders',
    refresh: 'Refresh',
    emptyUsers: 'No account data available.',
    pendingBudget: 'Pending',
    stats: {
      totalUsers: 'Total Accounts',
      clientUsers: 'Client Users',
      adminUsers: 'Admins',
      orders: 'Local Orders'
    },
    actions: {
      chatTitle: 'Messages',
      chatDesc: 'Open the chat page to verify access after admin sign-in.',
      blogTitle: 'Content',
      blogDesc: 'Browse the blog page and confirm public routes still work after login.',
      todoTitle: 'Schedule',
      todoDesc: 'Jump to the schedule page to continue testing post-login flows.'
    },
    userTable: {
      username: 'Username',
      role: 'Role',
      email: 'Email',
      createdAt: 'Created'
    },
    roleMap: {
      admin: 'Admin',
      user: 'User'
    },
    statusMap: {
      submitted: 'Submitted',
      quoted: 'Quoted',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed'
    }
  }
}

const FALLBACK_ORDERS = [
  {
    id: 'DEMO123',
    client_name: '测试用户',
    created_at: '2026-03-16T09:00:00.000Z',
    status: 'in_progress',
    budget: '¥300-500'
  },
  {
    id: 'FR20260318A1B2',
    client_name: 'Demo Client',
    created_at: '2026-03-18T08:30:00.000Z',
    status: 'submitted',
    budget: '¥500-800'
  }
]

export default {
  name: 'AdminDashboard',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      currentUser: null,
      users: [],
      orders: []
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return ADMIN_CONTENT[this.locale]
    },
    stats() {
      return {
        totalUsers: this.users.length,
        clientUsers: this.users.filter((user) => user.role === 'user').length,
        adminUsers: this.users.filter((user) => user.role === 'admin').length,
        orders: this.orders.length
      }
    }
  },
  mounted() {
    this.refreshData()
  },
  methods: {
    refreshData() {
      this.currentUser = getCurrentUser()
      this.users = getAllUsers()
      this.orders = this.loadOrders()
    },
    loadOrders() {
      try {
        const raw = localStorage.getItem(COMMISSIONS_STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        if (Array.isArray(parsed) && parsed.length) {
          return parsed
            .map((order) => ({
              id: order.order_id || order.id,
              client_name: order.client_name || 'Guest',
              created_at: order.created_at,
              status: order.status || 'submitted',
              budget: order.budget || ''
            }))
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        }
      } catch (error) {
        console.warn('读取本地订单失败', error)
      }

      return FALLBACK_ORDERS
    },
    formatDate(value) {
      if (!value) return '-'
      return new Intl.DateTimeFormat(this.locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(value))
    },
    formatRole(role) {
      return this.content.roleMap[role] || role
    },
    formatStatus(status) {
      return this.content.statusMap[status] || status
    }
  }
}
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: var(--white);
  padding: 60px 0;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.admin-banner {
  background: linear-gradient(135deg, rgba(107, 142, 107, 0.12), rgba(212, 165, 116, 0.2));
  border: 1px solid rgba(107, 142, 107, 0.2);
  border-radius: var(--radius);
  padding: 24px 28px;
  margin: 40px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.admin-banner strong {
  display: block;
  color: var(--text-dark);
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.admin-banner p {
  color: var(--text-light);
  margin: 0;
}

.btn-ghost {
  flex-shrink: 0;
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--primary-color);
  border: 1px solid rgba(107, 142, 107, 0.3);
  background: rgba(255, 255, 255, 0.65);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card,
.panel,
.action-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.stat-card {
  padding: 24px;
}

.stat-label {
  display: block;
  color: var(--text-light);
  margin-bottom: 10px;
}

.stat-value {
  display: block;
  font-size: 2rem;
  color: var(--text-dark);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.action-card {
  padding: 22px;
  display: flex;
  gap: 16px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.action-icon {
  font-size: 1.75rem;
}

.action-card h3 {
  margin-bottom: 8px;
  color: var(--text-dark);
}

.action-card p {
  margin: 0;
  color: var(--text-light);
  line-height: 1.6;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 24px;
  margin-bottom: 60px;
}

.panel {
  padding: 24px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-header h2 {
  margin: 0;
  color: var(--text-dark);
}

.panel-action {
  border: none;
  background: rgba(107, 142, 107, 0.12);
  color: var(--primary-color);
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
}

.table-wrap {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 14px 10px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.users-table th {
  color: var(--text-light);
  font-weight: 600;
}

.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
}

.role-badge.admin {
  background: rgba(74, 107, 74, 0.16);
  color: var(--primary-color);
}

.role-badge.user {
  background: rgba(212, 165, 116, 0.18);
  color: #9b6b2f;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-light);
}

.order-title {
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 8px;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--text-light);
  font-size: 0.92rem;
}

.order-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-badge {
  background: rgba(107, 142, 107, 0.14);
  color: var(--primary-color);
}

.order-budget {
  color: var(--text-dark);
  font-weight: 600;
}

.empty-state {
  color: var(--text-light);
  padding: 24px 0;
}

@media (max-width: 1024px) {
  .stats-grid,
  .quick-actions,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .admin-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .order-side {
    align-items: flex-start;
  }
}
</style>
