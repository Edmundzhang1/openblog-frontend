<template>
  <main class="admin-page">
    <header class="page-header">
      <div class="container">
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.subtitle }}</p>
      </div>
    </header>

    <div class="container admin-workspace fade-in">
      <div class="workspace-bar">
        <div>
          <strong>{{ currentUser?.nickname || copy.defaultAdmin }}</strong>
          <span>UID {{ currentUser?.uid }}</span>
        </div>
        <button type="button" class="refresh-button" :disabled="loadingAll" @click="loadAll">
          <RefreshCw :size="16" aria-hidden="true" /> {{ copy.refresh }}
        </button>
      </div>

      <nav class="admin-tabs" aria-label="Admin sections">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="['tab-button', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <section v-show="activeTab === 'stats'" class="admin-section stats-section">
        <div class="section-heading">
          <div>
            <span class="section-index">01</span>
            <h2>{{ copy.statsTitle }}</h2>
            <p>{{ copy.statsHint }}</p>
          </div>
        </div>

        <div v-if="loadingStats" class="inline-state">{{ copy.loading }}</div>
        <div v-else-if="statsError" class="inline-state error-state">
          <p>{{ statsError }}</p>
          <button type="button" class="text-button" @click="loadStats">{{ copy.retry }}</button>
        </div>
        <div v-else class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon"><Users :size="22" aria-hidden="true" /></span>
            <div>
              <span class="stat-label">{{ copy.totalUsers }}</span>
              <strong class="stat-value">{{ stats.total_users }}</strong>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><User :size="22" aria-hidden="true" /></span>
            <div>
              <span class="stat-label">{{ copy.clientUsers }}</span>
              <strong class="stat-value">{{ stats.client_users }}</strong>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><Palette :size="22" aria-hidden="true" /></span>
            <div>
              <span class="stat-label">{{ copy.artistUsers }}</span>
              <strong class="stat-value">{{ stats.artist_users }}</strong>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><ShieldCheck :size="22" aria-hidden="true" /></span>
            <div>
              <span class="stat-label">{{ copy.adminUsers }}</span>
              <strong class="stat-value">{{ stats.admin_users }}</strong>
            </div>
          </div>
          <div class="stat-card highlight">
            <span class="stat-icon"><Clock :size="22" aria-hidden="true" /></span>
            <div>
              <span class="stat-label">{{ copy.pendingApplications }}</span>
              <strong class="stat-value">{{ stats.pending_applications }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section v-show="activeTab === 'config'" class="admin-section config-section">
        <div class="section-heading">
          <div>
            <span class="section-index">02</span>
            <h2>{{ copy.configTitle }}</h2>
            <p>{{ copy.configHint }}</p>
          </div>
          <span v-if="siteConfig.updated_at" class="updated-at">{{ copy.updated }} {{ formatDate(siteConfig.updated_at) }}</span>
        </div>

        <div v-if="loadingConfig" class="inline-state">{{ copy.loading }}</div>
        <div v-else-if="configError" class="inline-state error-state">
          <p>{{ configError }}</p>
          <button type="button" class="text-button" @click="loadConfig">{{ copy.retry }}</button>
        </div>
        <form v-else class="config-form" @submit.prevent="saveConfig">
          <div class="form-row">
            <div class="form-group">
              <label for="site-name">{{ copy.siteName }}</label>
              <input id="site-name" v-model.trim="configForm.site_name" maxlength="100" required>
            </div>
            <div class="form-group">
              <label for="icp-number">{{ copy.icpNumber }}</label>
              <input id="icp-number" v-model.trim="configForm.icp_number" maxlength="100">
            </div>
          </div>
          <div class="form-group">
            <label for="site-description">{{ copy.siteDescription }}</label>
            <textarea id="site-description" v-model.trim="configForm.site_description" maxlength="500" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="site-logo">{{ copy.logoUrl }}</label>
              <input id="site-logo" v-model.trim="configForm.site_logo_url" type="url" maxlength="500" placeholder="https://">
            </div>
            <div class="form-group">
              <label for="site-favicon">{{ copy.faviconUrl }}</label>
              <input id="site-favicon" v-model.trim="configForm.site_favicon_url" type="url" maxlength="500" placeholder="https://">
            </div>
          </div>
          <div class="form-group">
            <label for="copyright-text">{{ copy.copyright }}</label>
            <input id="copyright-text" v-model.trim="configForm.copyright_text" maxlength="255">
          </div>

          <p v-if="saveConfigError" class="form-error" role="alert">{{ saveConfigError }}</p>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary compact-button" :disabled="savingConfig">
              {{ savingConfig ? copy.saving : copy.saveConfig }}
            </button>
          </div>
        </form>
      </section>

      <section v-show="activeTab === 'blacklist'" class="admin-section blacklist-section">
        <div class="section-heading">
          <div>
            <span class="section-index">03</span>
            <h2>{{ copy.blacklistTitle }}</h2>
            <p>{{ copy.blacklistHint }}</p>
          </div>
          <span class="count-label">{{ blacklist.length }} {{ copy.records }}</span>
        </div>

        <form class="blacklist-form" @submit.prevent="addBlacklist">
          <div class="form-group compact-field">
            <label for="blacklist-type">{{ copy.type }}</label>
            <select id="blacklist-type" v-model="blacklistForm.type">
              <option value="EMAIL">Email</option>
              <option value="QQ">QQ</option>
            </select>
          </div>
          <div class="form-group compact-field value-field">
            <label for="blacklist-value">{{ copy.value }}</label>
            <input
              id="blacklist-value"
              v-model.trim="blacklistForm.value"
              :type="blacklistForm.type === 'EMAIL' ? 'email' : 'text'"
              minlength="3"
              maxlength="100"
              required
            >
          </div>
          <div class="form-group compact-field reason-field">
            <label for="blacklist-reason">{{ copy.reason }}</label>
            <input id="blacklist-reason" v-model.trim="blacklistForm.reason" maxlength="500">
          </div>
          <button type="submit" class="btn btn-primary compact-button add-button" :disabled="addingBlacklist">
            {{ addingBlacklist ? copy.adding : copy.addBlacklist }}
          </button>
        </form>

        <div v-if="loadingBlacklist" class="inline-state">{{ copy.loading }}</div>
        <div v-else-if="blacklistError" class="inline-state error-state">
          <p>{{ blacklistError }}</p>
          <button type="button" class="text-button" @click="loadBlacklist">{{ copy.retry }}</button>
        </div>
        <div v-else-if="blacklist.length" class="table-wrap">
          <table>
            <thead><tr><th>{{ copy.type }}</th><th>{{ copy.value }}</th><th>{{ copy.reason }}</th><th>{{ copy.createdAt }}</th><th><span class="sr-only">{{ copy.actions }}</span></th></tr></thead>
            <tbody>
              <tr v-for="item in blacklist" :key="item.id">
                <td><span class="type-badge">{{ item.type }}</span></td>
                <td class="value-cell">{{ item.value }}</td>
                <td>{{ item.reason || '-' }}</td>
                <td>{{ formatDate(item.created_at) }}</td>
                <td class="action-cell">
                  <button type="button" class="delete-button" :title="copy.remove" :disabled="removingId === item.id" @click="removeBlacklist(item)">
                    <span v-if="removingId === item.id">...</span>
                    <Trash2 v-else :size="16" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="inline-state">{{ copy.emptyBlacklist }}</div>
      </section>

      <section v-show="activeTab === 'applications'" class="admin-section applications-section">
        <div class="section-heading">
          <div>
            <span class="section-index">04</span>
            <h2>{{ copy.applicationTitle }}</h2>
            <p>{{ copy.applicationHint }}</p>
          </div>
          <span class="count-label">{{ applications.length }} {{ copy.pending }}</span>
        </div>

        <div v-if="loadingApplications" class="inline-state">{{ copy.loading }}</div>
        <div v-else-if="applicationsError" class="inline-state error-state">
          <p>{{ applicationsError }}</p>
          <button type="button" class="text-button" @click="loadApplications">{{ copy.retry }}</button>
        </div>
        <div v-else-if="applications.length" class="application-list">
          <article v-for="application in applications" :key="application.uid" class="application-card">
            <header>
              <div>
                <h3>{{ application.nickname }}</h3>
                <p>UID {{ application.uid }} · {{ application.email || '-' }}</p>
              </div>
              <time>{{ formatDate(application.applied_at) }}</time>
            </header>
            <div class="application-body">
              <div>
                <strong>{{ copy.applicationReason }}</strong>
                <p>{{ application.application_reason }}</p>
              </div>
              <div>
                <strong>{{ copy.portfolio }}</strong>
                <div class="portfolio-links">
                  <a v-for="(url, index) in application.portfolio_urls" :key="url" :href="url" target="_blank" rel="noopener noreferrer">
                    {{ copy.portfolio }} {{ index + 1 }} ↗
                  </a>
                </div>
              </div>
            </div>
            <footer>
              <input v-model.trim="rejectReasons[application.uid]" maxlength="500" :placeholder="copy.rejectReasonPlaceholder">
              <button type="button" class="approve-button" :disabled="reviewingUid === application.uid" @click="reviewApplication(application, 'APPROVE')">
                {{ copy.approve }}
              </button>
              <button type="button" class="reject-button" :disabled="reviewingUid === application.uid" @click="reviewApplication(application, 'REJECT')">
                {{ copy.reject }}
              </button>
            </footer>
          </article>
        </div>
        <div v-else class="inline-state">{{ copy.emptyApplications }}</div>
      </section>

      <section v-show="activeTab === 'users'" class="admin-section users-section">
        <div class="section-heading">
          <div>
            <span class="section-index">05</span>
            <h2>{{ copy.usersTitle }}</h2>
            <p>{{ copy.usersHint }}</p>
          </div>
          <div class="search-bar">
            <input
              v-model="searchKeyword"
              type="text"
              :placeholder="copy.searchPlaceholder"
              @keyup.enter="handleSearch"
            >
            <button type="button" class="btn-search" @click="handleSearch">{{ copy.search }}</button>
            <button v-if="searchKeyword" type="button" class="btn-clear" @click="clearSearch">{{ copy.clear }}</button>
          </div>
        </div>

        <div v-if="loadingUsers" class="inline-state">{{ copy.loading }}</div>
        <div v-else-if="usersError" class="inline-state error-state">
          <p>{{ usersError }}</p>
          <button type="button" class="text-button" @click="loadUsers(userPagination.page)">{{ copy.retry }}</button>
        </div>
        <div v-else-if="users.length" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>UID</th>
                <th>{{ copy.nickname }}</th>
                <th>{{ copy.email }}</th>
                <th>{{ copy.role }}</th>
                <th>{{ copy.artistStatus }}</th>
                <th>{{ copy.registeredAt }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.uid">
                <td class="value-cell">{{ user.uid }}</td>
                <td>{{ user.nickname }}</td>
                <td>{{ user.email || '-' }}</td>
                <td>
                  <select
                    v-model="user.role"
                    class="role-select"
                    @change="changeRole(user.uid, user.role)"
                  >
                    <option value="CLIENT">{{ copy.roles.CLIENT }}</option>
                    <option value="ARTIST">{{ copy.roles.ARTIST }}</option>
                    <option value="ADMIN">{{ copy.roles.ADMIN }}</option>
                  </select>
                </td>
                <td>
                  <span :class="['status-tag', user.artist_status]">
                    {{ formatArtistStatus(user.artist_status) }}
                  </span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="inline-state">{{ copy.emptyUsers }}</div>

        <div v-if="!loadingUsers && !usersError && userPagination.total_pages > 1" class="pagination">
          <button
            type="button"
            :disabled="userPagination.page <= 1"
            class="btn-page"
            @click="goPage(userPagination.page - 1)"
          >
            {{ copy.prevPage }}
          </button>
          <span class="page-info">
            {{ userPagination.page }} / {{ userPagination.total_pages }}
          </span>
          <button
            type="button"
            :disabled="userPagination.page >= userPagination.total_pages"
            class="btn-page"
            @click="goPage(userPagination.page + 1)"
          >
            {{ copy.nextPage }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script>
import { inject } from 'vue'
import { RefreshCw, Trash2, Users, User, Palette, ShieldCheck, Clock } from '@lucide/vue'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest, showToast } from '../utils/eventBus'
import { getCurrentUser } from '../utils/auth'
import { refreshSiteConfig } from '../state/siteConfig'

const CONTENT = {
  zh: {
    title: '管理后台', subtitle: '平台总览、站点信息、访问黑名单、画师入驻审核与用户管理', defaultAdmin: '管理员', refresh: '全部刷新',
    tabs: { stats: '总览', config: '站点配置', blacklist: '黑名单', applications: '画师审批', users: '用户管理' },
    loading: '加载中...', retry: '重新加载',
    statsTitle: '平台总览', statsHint: '关键指标一览', totalUsers: '总用户', clientUsers: '普通用户', artistUsers: '画师', adminUsers: '管理员', pendingApplications: '待审核申请',
    configTitle: '站点配置', configHint: '修改公开展示的站点基本信息', updated: '更新于',
    siteName: '站点名称', siteDescription: '站点描述', logoUrl: 'Logo 地址', faviconUrl: 'Favicon 地址', icpNumber: 'ICP备案号', copyright: '版权信息',
    saveConfig: '保存配置', saving: '保存中...', configSaved: '站点配置已更新',
    blacklistTitle: '访问黑名单', blacklistHint: '阻止指定邮箱或 QQ 参与认证', records: '条记录', type: '类型', value: '值', reason: '原因', createdAt: '创建时间', actions: '操作',
    addBlacklist: '加入黑名单', adding: '添加中...', remove: '移除', removed: '已移出黑名单', added: '已加入黑名单', emptyBlacklist: '当前没有黑名单记录。', confirmRemove: '确定移除这条黑名单记录吗？',
    applicationTitle: '画师入驻审批', applicationHint: '仅显示当前待审核的申请', pending: '待处理', applicationReason: '申请说明', portfolio: '作品集',
    rejectReasonPlaceholder: '拒绝时必须填写原因', approve: '通过', reject: '拒绝', rejectReasonRequired: '拒绝申请前请填写原因', approved: '申请已通过', rejected: '申请已拒绝', emptyApplications: '当前没有待审核申请。',
    usersTitle: '用户管理', usersHint: '搜索用户并调整角色', searchPlaceholder: '搜索 UID 或昵称...', search: '搜索', clear: '清除',
    nickname: '昵称', email: '邮箱', role: '角色', artistStatus: '画师状态', registeredAt: '注册时间', emptyUsers: '未找到用户',
    prevPage: '上一页', nextPage: '下一页', roleUpdated: '角色更新成功', confirmRoleChange: '确认将该用户的角色切换为',
    roles: { CLIENT: '普通用户', ARTIST: '画师', ADMIN: '管理员' },
    artistStatuses: { UNAPPLIED: '未申请', PENDING: '审核中', APPROVED: '已通过', REJECTED: '已拒绝', '': '-' }
  },
  en: {
    title: 'Admin Dashboard', subtitle: 'Platform overview, site information, access blocks, artist applications, and user management', defaultAdmin: 'Administrator', refresh: 'Refresh all',
    tabs: { stats: 'Overview', config: 'Site Config', blacklist: 'Blacklist', applications: 'Applications', users: 'Users' },
    loading: 'Loading...', retry: 'Try again',
    statsTitle: 'Platform Overview', statsHint: 'Key metrics at a glance', totalUsers: 'Total users', clientUsers: 'Clients', artistUsers: 'Artists', adminUsers: 'Admins', pendingApplications: 'Pending applications',
    configTitle: 'Site Configuration', configHint: 'Edit public-facing site information', updated: 'Updated',
    siteName: 'Site name', siteDescription: 'Site description', logoUrl: 'Logo URL', faviconUrl: 'Favicon URL', icpNumber: 'ICP number', copyright: 'Copyright text',
    saveConfig: 'Save configuration', saving: 'Saving...', configSaved: 'Site configuration updated.',
    blacklistTitle: 'Access Blacklist', blacklistHint: 'Block an email or QQ account from authentication', records: 'records', type: 'Type', value: 'Value', reason: 'Reason', createdAt: 'Created', actions: 'Actions',
    addBlacklist: 'Add to blacklist', adding: 'Adding...', remove: 'Remove', removed: 'Blacklist entry removed.', added: 'Added to blacklist.', emptyBlacklist: 'No blacklist entries.', confirmRemove: 'Remove this blacklist entry?',
    applicationTitle: 'Artist Applications', applicationHint: 'Only pending applications are shown', pending: 'pending', applicationReason: 'Application statement', portfolio: 'Portfolio',
    rejectReasonPlaceholder: 'A reason is required when rejecting', approve: 'Approve', reject: 'Reject', rejectReasonRequired: 'Enter a rejection reason first.', approved: 'Application approved.', rejected: 'Application rejected.', emptyApplications: 'No applications are waiting for review.',
    usersTitle: 'User Management', usersHint: 'Search users and adjust roles', searchPlaceholder: 'Search by UID or nickname...', search: 'Search', clear: 'Clear',
    nickname: 'Nickname', email: 'Email', role: 'Role', artistStatus: 'Artist status', registeredAt: 'Registered', emptyUsers: 'No users found.',
    prevPage: 'Previous', nextPage: 'Next', roleUpdated: 'Role updated.', confirmRoleChange: 'Switch this user\'s role to ',
    roles: { CLIENT: 'Client', ARTIST: 'Artist', ADMIN: 'Admin' },
    artistStatuses: { UNAPPLIED: 'Not applied', PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', '': '-' }
  }
}

function emptyConfigForm() {
  return { site_name: '', site_description: '', site_logo_url: '', site_favicon_url: '', icp_number: '', copyright_text: '' }
}

function emptyStats() {
  return { total_users: 0, client_users: 0, artist_users: 0, admin_users: 0, pending_applications: 0 }
}

export default {
  name: 'AdminDashboard',
  components: { RefreshCw, Trash2, Users, User, Palette, ShieldCheck, Clock },
  setup() { return { i18n: inject('i18n') } },
  data() {
    return {
      activeTab: 'stats',
      currentUser: getCurrentUser(), siteConfig: {}, configForm: emptyConfigForm(), blacklist: [], applications: [],
      stats: emptyStats(), users: [], searchKeyword: '',
      userPagination: { page: 1, page_size: 20, total: 0, total_pages: 1 },
      blacklistForm: { type: 'EMAIL', value: '', reason: '' }, rejectReasons: {},
      loadingStats: false, loadingConfig: false, loadingBlacklist: false, loadingApplications: false, loadingUsers: false,
      statsError: '', configError: '', saveConfigError: '', blacklistError: '', applicationsError: '', usersError: '',
      savingConfig: false, addingBlacklist: false, removingId: null, reviewingUid: null
    }
  },
  computed: {
    locale() { return this.i18n.getLocale() },
    copy() { return CONTENT[this.locale] },
    tabs() {
      return ['stats', 'config', 'blacklist', 'applications', 'users'].map((key) => ({ key, label: this.copy.tabs[key] }))
    },
    loadingAll() {
      return this.loadingStats || this.loadingConfig || this.loadingBlacklist || this.loadingApplications || this.loadingUsers
    }
  },
  mounted() { this.loadAll() },
  methods: {
    loadAll() {
      return Promise.allSettled([this.loadStats(), this.loadConfig(), this.loadBlacklist(), this.loadApplications(), this.loadUsers(1)])
    },
    async loadStats() {
      this.loadingStats = true
      this.statsError = ''
      try {
        const data = await apiRequest(API_ENDPOINTS.ADMIN_STATS, { showError: false })
        this.stats = { ...emptyStats(), ...(data || {}) }
      } catch (error) { this.statsError = error.message } finally { this.loadingStats = false }
    },
    async loadConfig() {
      this.loadingConfig = true
      this.configError = ''
      try {
        const data = await apiRequest(API_ENDPOINTS.ADMIN_SITE_CONFIG, { showError: false })
        this.siteConfig = data || {}
        this.configForm = Object.keys(emptyConfigForm()).reduce((form, key) => {
          form[key] = data?.[key] || ''
          return form
        }, {})
      } catch (error) { this.configError = error.message } finally { this.loadingConfig = false }
    },
    async saveConfig() {
      this.savingConfig = true
      this.saveConfigError = ''
      try {
        const body = { ...this.configForm }
        await apiRequest(API_ENDPOINTS.ADMIN_SITE_CONFIG, { method: 'PATCH', body })
        await refreshSiteConfig()
        showToast(this.copy.configSaved, 'success')
        await this.loadConfig()
      } catch (error) { this.saveConfigError = error.message } finally { this.savingConfig = false }
    },
    async loadBlacklist() {
      this.loadingBlacklist = true
      this.blacklistError = ''
      try {
        const data = await apiRequest(`${API_ENDPOINTS.ADMIN_BLACKLIST}?page=1&page_size=100`, { showError: false })
        this.blacklist = Array.isArray(data?.list) ? data.list : []
      } catch (error) { this.blacklistError = error.message } finally { this.loadingBlacklist = false }
    },
    async addBlacklist() {
      this.addingBlacklist = true
      try {
        await apiRequest(API_ENDPOINTS.ADMIN_BLACKLIST, { method: 'POST', body: this.blacklistForm })
        this.blacklistForm.value = ''
        this.blacklistForm.reason = ''
        showToast(this.copy.added, 'success')
        await this.loadBlacklist()
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.addingBlacklist = false }
    },
    async removeBlacklist(item) {
      if (!window.confirm(this.copy.confirmRemove)) return
      this.removingId = item.id
      try {
        await apiRequest(API_ENDPOINTS.ADMIN_BLACKLIST_ITEM(item.id), { method: 'DELETE' })
        showToast(this.copy.removed, 'success')
        await this.loadBlacklist()
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.removingId = null }
    },
    async loadApplications() {
      this.loadingApplications = true
      this.applicationsError = ''
      try {
        const data = await apiRequest(`${API_ENDPOINTS.ADMIN_ARTIST_APPLICATIONS}?page=1&page_size=100`, { showError: false })
        this.applications = Array.isArray(data?.applications) ? data.applications : []
      } catch (error) { this.applicationsError = error.message } finally { this.loadingApplications = false }
    },
    async reviewApplication(application, action) {
      const reason = String(this.rejectReasons[application.uid] || '').trim()
      if (action === 'REJECT' && !reason) {
        showToast(this.copy.rejectReasonRequired, 'error')
        return
      }
      this.reviewingUid = application.uid
      try {
        await apiRequest(API_ENDPOINTS.ADMIN_ARTIST_APPLICATION(application.uid), {
          method: 'PATCH', body: { action, ...(action === 'REJECT' ? { reject_reason: reason } : {}) }
        })
        showToast(action === 'APPROVE' ? this.copy.approved : this.copy.rejected, 'success')
        delete this.rejectReasons[application.uid]
        // 审批会影响总览指标与用户角色，一起刷新
        await Promise.allSettled([this.loadApplications(), this.loadStats(), this.loadUsers(this.userPagination.page)])
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.reviewingUid = null }
    },
    async loadUsers(page = 1) {
      this.loadingUsers = true
      this.usersError = ''
      try {
        const params = new URLSearchParams()
        params.append('page', String(page))
        params.append('page_size', String(this.userPagination.page_size || 20))
        if (this.searchKeyword.trim()) {
          params.append('keyword', this.searchKeyword.trim())
        }
        const data = await apiRequest(`${API_ENDPOINTS.ADMIN_USERS}?${params.toString()}`, { showError: false })
        this.users = Array.isArray(data?.list) ? data.list : []
        this.userPagination = data?.pagination || { page: 1, page_size: 20, total: 0, total_pages: 1 }
      } catch (error) { this.usersError = error.message } finally { this.loadingUsers = false }
    },
    handleSearch() { this.loadUsers(1) },
    clearSearch() {
      this.searchKeyword = ''
      this.loadUsers(1)
    },
    goPage(page) {
      if (page < 1 || page > this.userPagination.total_pages) return
      this.loadUsers(page)
    },
    async changeRole(uid, newRole) {
      if (!window.confirm(`${this.copy.confirmRoleChange}${this.formatRoleName(newRole)}？`)) {
        // 取消时重新加载列表以恢复下拉框原值
        this.loadUsers(this.userPagination.page)
        return
      }
      try {
        await apiRequest(API_ENDPOINTS.ADMIN_USER_ROLE(uid), { method: 'PATCH', body: { role: newRole } })
        showToast(this.copy.roleUpdated, 'success')
        // 角色变化会影响总览指标，一起刷新
        await Promise.allSettled([this.loadStats(), this.loadUsers(this.userPagination.page)])
      } catch (_) {
        /* apiRequest 已经展示了接口错误 */
        this.loadUsers(this.userPagination.page)
      }
    },
    formatArtistStatus(status) {
      const map = this.copy.artistStatuses
      return map[status] ?? status ?? '-'
    },
    formatRoleName(role) {
      return this.copy.roles[role] || role
    },
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return new Intl.DateTimeFormat(this.locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
    }
  }
}
</script>

<style scoped>
.admin-workspace { margin: 38px auto 72px; background: #fff; border: 1px solid #E5E5E5; }
.workspace-bar { min-height: 66px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 14px 24px; background: #fff; color: var(--text-dark); border-bottom: 1px solid #E5E5E5; }
.workspace-bar > div { display: flex; align-items: baseline; gap: 12px; }
.workspace-bar span { color: var(--text-muted); font-size: 0.8rem; }
.refresh-button { min-height: 38px; display: inline-flex; align-items: center; gap: 7px; padding: 0 12px; border: 1px solid #E5E5E5; border-radius: 8px; background: #fff; color: var(--text-dark); font: inherit; cursor: pointer; transition: var(--transition); }
.admin-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding: 10px 24px; border-bottom: 1px solid #E5E5E5; background: #FAFAFA; }
.tab-button { min-height: 38px; padding: 0 16px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--text-muted); font: inherit; font-weight: 600; cursor: pointer; transition: var(--transition); }
.tab-button:hover { color: var(--text-dark); background: #F0F0F0; }
.tab-button.active { background: #fff; border-color: #E5E5E5; color: var(--primary-color); }
.admin-section { padding: 64px 28px; border-bottom: 1px solid #E5E5E5; }
.admin-section:last-child { border-bottom: 0; }
.section-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.section-index { display: block; margin-bottom: 6px; color: var(--text-muted); font: 800 0.72rem/1 monospace; }
.section-heading h2 { margin: 0; font-size: 1.25rem; }
.section-heading p { margin: 5px 0 0; color: var(--text-muted); }
.updated-at, .count-label { color: var(--text-muted); font-size: 0.8rem; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.stat-card { display: flex; align-items: center; gap: 14px; padding: 20px; border: 1px solid #E5E5E5; border-radius: 8px; background: #FAFAFA; transition: var(--transition); }
.stat-card.highlight { background: rgba(212, 165, 116, 0.08); border-color: rgba(212, 165, 116, 0.35); }
.stat-icon { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 8px; background: #fff; border: 1px solid #E5E5E5; color: var(--primary-color); }
.stat-label { display: block; margin-bottom: 4px; color: var(--text-muted); font-size: 0.82rem; }
.stat-value { display: block; color: var(--text-dark); font-size: 1.5rem; }
.config-form { max-width: 860px; }
.form-group { margin-bottom: 18px; }
.form-group textarea { min-height: 84px; }
.form-actions { display: flex; justify-content: flex-end; }
.compact-button { min-height: 42px; padding: 0 18px; border-radius: 8px; font-size: 0.9rem; }
.form-error { margin: 0 0 14px; padding: 11px 13px; background: #FEF2F2; color: #B91C1C; border-left: 3px solid #EF4444; }
.blacklist-form { display: grid; grid-template-columns: 130px minmax(170px, 0.8fr) minmax(210px, 1fr) auto; align-items: end; gap: 12px; margin-bottom: 22px; padding: 18px; background: #F5F5F5; }
.compact-field { margin: 0; }
.compact-field label { font-size: 0.82rem; }
.add-button { margin-bottom: 0; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #E5E5E5; vertical-align: top; }
th { color: var(--text-muted); font-size: 0.78rem; }
td { font-size: 0.88rem; }
.type-badge { display: inline-block; padding: 3px 7px; border-radius: 8px; background: #F5F5F5; color: rgba(26, 26, 26, 0.65); font-size: 0.72rem; font-weight: 700; }
.value-cell { font-family: monospace; overflow-wrap: anywhere; }
.action-cell { width: 48px; text-align: right; }
.delete-button { width: 30px; height: 30px; display: inline-grid; place-items: center; border: 1px solid #FCA5A5; border-radius: 8px; background: #fff; color: #B91C1C; cursor: pointer; transition: var(--transition); }
.application-list { display: grid; gap: 14px; }
.application-card { border: 1px solid #E5E5E5; border-radius: 8px; overflow: hidden; }
.application-card header { display: flex; justify-content: space-between; gap: 18px; padding: 16px 18px; background: #FAFAFA; border-bottom: 1px solid #E5E5E5; }
.application-card h3 { margin: 0; font-size: 1rem; }
.application-card header p, .application-card time { margin: 3px 0 0; color: var(--text-muted); font-size: 0.78rem; }
.application-body { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.5fr); gap: 24px; padding: 18px; }
.application-body strong { display: block; margin-bottom: 7px; font-size: 0.82rem; }
.application-body p { margin: 0; color: var(--text-light); white-space: pre-wrap; overflow-wrap: anywhere; }
.portfolio-links { display: grid; gap: 6px; }
.portfolio-links a { color: var(--primary-color); font-size: 0.85rem; text-decoration: underline; overflow-wrap: anywhere; transition: var(--transition); }
.application-card footer { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 8px; padding: 13px 18px; border-top: 1px solid #E5E5E5; }
.application-card footer input { min-width: 0; height: 40px; padding: 0 11px; border: 1px solid #E5E5E5; border-radius: 8px; font: inherit; }
.approve-button, .reject-button { min-height: 40px; padding: 0 14px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: var(--transition); }
.approve-button { border: 1px solid var(--primary-color); background: var(--primary-color); color: #fff; }
.reject-button { border: 1px solid #FCA5A5; background: #fff; color: #B91C1C; }
.search-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.search-bar input { width: 220px; height: 40px; padding: 0 12px; border: 1px solid #E5E5E5; border-radius: 8px; font: inherit; }
.search-bar input:focus { outline: none; border-color: var(--primary-color); }
.btn-search, .btn-clear { min-height: 40px; padding: 0 16px; border: 0; border-radius: 8px; font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.btn-search { background: var(--primary-color); color: #fff; }
.btn-clear { background: #F3F4F6; color: #6B7280; }
.role-select { min-width: 100px; padding: 6px 10px; border: 1px solid #E0E0E0; border-radius: 8px; background: #fff; font-size: 0.85rem; cursor: pointer; }
.role-select:focus { outline: none; border-color: var(--primary-color); }
.status-tag { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 500; }
.status-tag.UNAPPLIED { background: rgba(156, 163, 175, 0.15); color: #6B7280; }
.status-tag.PENDING { background: rgba(212, 165, 116, 0.15); color: #8B6B2F; }
.status-tag.APPROVED { background: rgba(107, 142, 107, 0.15); color: var(--primary-color); }
.status-tag.REJECTED { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #E5E5E5; }
.btn-page { min-height: 38px; padding: 0 16px; background: #fff; border: 1px solid #E5E5E5; border-radius: 8px; font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.btn-page:hover:not(:disabled) { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { color: var(--text-muted); font-size: 0.9rem; }
.inline-state { padding: 34px 18px; background: #FAFAFA; color: var(--text-muted); text-align: center; }
.inline-state p { margin: 0; }
.error-state { color: #B91C1C; }
.text-button { margin-top: 8px; border: 0; background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; transition: var(--transition); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 860px) {
  .blacklist-form { grid-template-columns: 120px minmax(0, 1fr); }
  .reason-field { grid-column: 1 / 2; }
  .add-button { align-self: end; }
  .application-body { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .admin-workspace { margin-top: 24px; border-left: 0; border-right: 0; }
  .workspace-bar, .admin-tabs, .admin-section { padding-left: 18px; padding-right: 18px; }
  .section-heading, .application-card header { flex-direction: column; }
  .form-row, .blacklist-form { grid-template-columns: 1fr; }
  .reason-field { grid-column: auto; }
  .application-card footer { grid-template-columns: 1fr 1fr; }
  .application-card footer input { grid-column: 1 / 3; }
  .search-bar input { width: 100%; }
}
</style>
