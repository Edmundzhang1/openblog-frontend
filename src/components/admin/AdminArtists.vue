<template>
  <div class="admin-artists">
    <div class="section-heading">
      <div>
        <span class="section-index">06</span>
        <h2>{{ copy.title }}</h2>
        <p>{{ copy.hint }}</p>
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

    <div v-if="loading" class="inline-state">{{ copy.loading }}</div>
    <div v-else-if="error" class="inline-state error-state">
      <p>{{ error }}</p>
      <button type="button" class="text-button" @click="loadArtists(pagination.page)">{{ copy.retry }}</button>
    </div>
    <div v-else-if="artists.length" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ copy.avatar }}</th>
            <th>{{ copy.nickname }}</th>
            <th>{{ copy.slug }}</th>
            <th>{{ copy.verified }}</th>
            <th>{{ copy.commissionOpen }}</th>
            <th>{{ copy.directoryVisible }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="artist in artists" :key="artist.uid">
            <td>
              <img v-if="artist.avatar" :src="getAssetUrl(artist.avatar)" :alt="artist.nickname" class="artist-avatar">
              <span v-else class="artist-avatar avatar-fallback">{{ (artist.nickname || '?').charAt(0) }}</span>
            </td>
            <td>
              {{ artist.nickname }}
              <span class="uid-text">UID {{ artist.uid }}</span>
            </td>
            <td class="value-cell">
              <router-link :to="`/@${artist.slug || artist.uid}`" target="_blank" class="slug-link">{{ artist.slug || artist.uid }}</router-link>
            </td>
            <td>
              <span :class="['flag-badge', { on: artist.artist_verified }]">{{ artist.artist_verified ? copy.yes : copy.no }}</span>
            </td>
            <td>
              <span :class="['flag-badge', { on: artist.commission_open }]">{{ artist.commission_open ? copy.yes : copy.no }}</span>
            </td>
            <td>
              <button
                type="button"
                :class="['switch', { on: artist.directory_visible }]"
                :title="copy.directoryVisible"
                :disabled="togglingUid === artist.uid"
                @click="toggleDirectory(artist)"
              >
                <span class="switch-dot"></span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="inline-state">{{ copy.empty }}</div>

    <div v-if="!loading && !error && pagination.total_pages > 1" class="pagination">
      <button
        type="button"
        :disabled="pagination.page <= 1"
        class="btn-page"
        @click="goPage(pagination.page - 1)"
      >
        {{ copy.prevPage }}
      </button>
      <span class="page-info">{{ pagination.page }} / {{ pagination.total_pages }}</span>
      <button
        type="button"
        :disabled="pagination.page >= pagination.total_pages"
        class="btn-page"
        @click="goPage(pagination.page + 1)"
      >
        {{ copy.nextPage }}
      </button>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS, getAssetUrl } from '../../config/api'
import { apiRequest, showToast } from '../../utils/eventBus'

const CONTENT = {
  zh: {
    title: '画师名录', hint: '管理画师在公开名录中的展示', searchPlaceholder: '搜索 UID 或昵称...', search: '搜索', clear: '清除',
    loading: '加载中...', retry: '重新加载', empty: '未找到画师',
    avatar: '头像', nickname: '昵称', slug: '主页路径', verified: '已认证', commissionOpen: '接稿中', directoryVisible: '在名录中展示',
    yes: '是', no: '否', updated: '名录展示状态已更新', prevPage: '上一页', nextPage: '下一页'
  },
  en: {
    title: 'Artist Directory', hint: 'Control which artists appear in the public directory', searchPlaceholder: 'Search by UID or nickname...', search: 'Search', clear: 'Clear',
    loading: 'Loading...', retry: 'Try again', empty: 'No artists found.',
    avatar: 'Avatar', nickname: 'Nickname', slug: 'Page path', verified: 'Verified', commissionOpen: 'Open', directoryVisible: 'Show in directory',
    yes: 'Yes', no: 'No', updated: 'Directory visibility updated.', prevPage: 'Previous', nextPage: 'Next'
  }
}

export default {
  name: 'AdminArtists',
  setup() { return { i18n: inject('i18n') } },
  data() {
    return {
      artists: [], searchKeyword: '',
      pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 },
      loading: false, error: '', togglingUid: null
    }
  },
  computed: {
    locale() { return this.i18n.getLocale() },
    copy() { return CONTENT[this.locale] }
  },
  mounted() { this.loadArtists(1) },
  methods: {
    getAssetUrl,
    async loadArtists(page = 1) {
      this.loading = true
      this.error = ''
      try {
        const params = new URLSearchParams()
        params.append('page', String(page))
        params.append('page_size', String(this.pagination.page_size || 20))
        params.append('role', 'ARTIST')
        if (this.searchKeyword.trim()) {
          params.append('keyword', this.searchKeyword.trim())
        }
        const data = await apiRequest(`${API_ENDPOINTS.ADMIN_USERS}?${params.toString()}`, { showError: false })
        this.artists = Array.isArray(data?.list) ? data.list : []
        this.pagination = data?.pagination || { page: 1, page_size: 20, total: 0, total_pages: 1 }
      } catch (error) { this.error = error.message } finally { this.loading = false }
    },
    handleSearch() { this.loadArtists(1) },
    clearSearch() {
      this.searchKeyword = ''
      this.loadArtists(1)
    },
    goPage(page) {
      if (page < 1 || page > this.pagination.total_pages) return
      this.loadArtists(page)
    },
    async toggleDirectory(artist) {
      const next = !artist.directory_visible
      // 先乐观更新，失败时回滚
      artist.directory_visible = next
      this.togglingUid = artist.uid
      try {
        await apiRequest(API_ENDPOINTS.ADMIN_USER_DIRECTORY(artist.uid), {
          method: 'PATCH', body: { directory_visible: next }
        })
        showToast(this.copy.updated, 'success')
      } catch (_) {
        /* apiRequest 已经展示了接口错误 */
        artist.directory_visible = !next
      } finally {
        this.togglingUid = null
      }
    }
  }
}
</script>

<style scoped>
.section-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.section-index { display: block; margin-bottom: 6px; color: var(--text-muted); font: 800 0.72rem/1 monospace; }
.section-heading h2 { margin: 0; font-size: 1.25rem; }
.section-heading p { margin: 5px 0 0; color: var(--text-muted); }
.search-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.search-bar input { width: 220px; height: 40px; padding: 0 12px; border: 1px solid #E5E7EB; border-radius: var(--radius); font: inherit; }
.search-bar input:focus { outline: none; border-color: var(--primary-color); }
.btn-search, .btn-clear { min-height: 40px; padding: 0 16px; border: 0; border-radius: var(--radius); font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.btn-search { background: var(--primary-color); color: #fff; }
.btn-clear { background: #F3F4F6; color: var(--text-light); }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #E5E7EB; vertical-align: middle; }
th { color: var(--text-muted); font-size: 0.78rem; }
td { font-size: 0.88rem; }
.value-cell { font-family: monospace; overflow-wrap: anywhere; }
.slug-link { color: var(--primary-color); text-decoration: none; }
.slug-link:hover { text-decoration: underline; }
.artist-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; display: inline-grid; place-items: center; }
.avatar-fallback { background: #F3F4F6; color: var(--text-muted); font-weight: 700; }
.uid-text { display: block; color: var(--text-muted); font-size: 0.75rem; }
.flag-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius); background: #F3F4F6; color: var(--text-muted); font-size: 0.78rem; font-weight: 600; }
.flag-badge.on { background: rgba(34, 197, 94, 0.12); color: #15803D; }
.switch { position: relative; width: 42px; height: 24px; border: 1px solid #E5E7EB; border-radius: 999px; background: #E5E7EB; cursor: pointer; transition: var(--transition); }
.switch.on { background: var(--primary-color); border-color: var(--primary-color); }
.switch:disabled { opacity: 0.5; cursor: not-allowed; }
.switch-dot { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: var(--transition); }
.switch.on .switch-dot { left: 20px; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
.btn-page { min-height: 38px; padding: 0 16px; background: #fff; border: 1px solid #E5E7EB; border-radius: var(--radius); font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.btn-page:hover:not(:disabled) { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { color: var(--text-muted); font-size: 0.9rem; }
.inline-state { padding: 34px 18px; background: #FAFAFA; color: var(--text-muted); text-align: center; }
.inline-state p { margin: 0; }
.error-state { color: #B91C1C; }
.text-button { margin-top: 8px; border: 0; background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; transition: var(--transition); }
@media (max-width: 620px) {
  .section-heading { flex-direction: column; }
  .search-bar input { width: 100%; }
}
</style>
