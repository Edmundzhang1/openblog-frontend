<template>
  <div class="artists-page">
    <header class="page-header fade-in">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="artists-section">
      <div class="container">
        <div v-if="loading" class="inline-state">{{ content.loading }}</div>
        <div v-else-if="error" class="inline-state error-state">
          <p>{{ error }}</p>
          <button type="button" class="text-button" @click="loadArtists">{{ content.retry }}</button>
        </div>
        <template v-else>
          <div v-if="artists.length" class="artist-grid">
            <router-link
              v-for="artist in artists"
              :key="artist.uid"
              :to="`/artists/${artist.uid}`"
              class="artist-card"
            >
              <span class="artist-avatar" :style="avatarStyle(artist)">{{ artistInitial(artist) }}</span>
              <span class="artist-info">
                <strong>{{ artist.nickname }}</strong>
                <small>{{ artist.bio || content.artistFallbackBio }}</small>
                <span v-if="artist.tags?.length" class="tag-row">
                  <span v-for="tag in artist.tags" :key="tag">{{ tag }}</span>
                </span>
              </span>
              <span class="artist-meta">
                <span class="artist-price">{{ formatPriceRange(artist) }}</span>
                <span class="status" :class="artist.commission_open ? 'open' : 'closed'">
                  {{ artist.commission_open ? content.statusOpen : content.statusClosed }}
                </span>
              </span>
            </router-link>
          </div>
          <div v-else class="inline-state">{{ content.empty }}</div>

          <div v-if="totalPages > 1" class="pagination">
            <button type="button" :disabled="page <= 1" @click="goToPage(page - 1)">‹ {{ content.prev }}</button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button type="button" :disabled="page >= totalPages" @click="goToPage(page + 1)">{{ content.next }} ›</button>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS, getAssetUrl } from '../config/api'
import { apiRequest } from '../utils/eventBus'

const PAGE_SIZE = 12

const CONTENT = {
  zh: {
    title: '画师名录',
    subtitle: '平台认证画师，点击进入主页查看作品与公开排期',
    loading: '正在加载画师...',
    retry: '重新加载',
    loadFailed: '无法加载画师列表',
    empty: '暂无画师',
    artistFallbackBio: '已认证画师',
    statusOpen: '开放约稿',
    statusClosed: '暂停约稿',
    prev: '上一页',
    next: '下一页'
  },
  en: {
    title: 'Artists',
    subtitle: 'Verified artists — open a profile to see works and public availability',
    loading: 'Loading artists...',
    retry: 'Try again',
    loadFailed: 'Unable to load artists.',
    empty: 'No artists yet',
    artistFallbackBio: 'Verified artist',
    statusOpen: 'Open',
    statusClosed: 'Closed',
    prev: 'Prev',
    next: 'Next'
  }
}

export default {
  name: 'Artists',
  setup() {
    return { i18n: inject('i18n') }
  },
  data() {
    return {
      artists: [],
      total: 0,
      page: 1,
      loading: false,
      error: ''
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return CONTENT[this.locale]
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.total / PAGE_SIZE))
    }
  },
  mounted() {
    this.loadArtists()
  },
  methods: {
    async loadArtists() {
      this.loading = true
      this.error = ''
      try {
        const data = await apiRequest(`${API_ENDPOINTS.ARTISTS}?page=${this.page}&page_size=${PAGE_SIZE}`, {
          auth: false,
          showError: false
        })
        this.artists = Array.isArray(data?.items) ? data.items : []
        this.total = Number(data?.total || 0)
      } catch (err) {
        this.error = err.message || this.content.loadFailed
      } finally {
        this.loading = false
      }
    },
    goToPage(page) {
      if (page < 1 || page > this.totalPages || page === this.page) return
      this.page = page
      this.loadArtists()
    },
    avatarStyle(artist) {
      const url = getAssetUrl(artist.avatar_url)
      return url ? { backgroundImage: `url("${url.replace(/"/g, '%22')}")` } : {}
    },
    artistInitial(artist) {
      return String(artist.nickname || 'A').slice(0, 1).toUpperCase()
    },
    formatPriceRange(artist) {
      if (!artist.price_range_min && !artist.price_range_max) return this.locale === 'zh' ? '价格面议' : 'Ask for quote'
      const min = Math.round((artist.price_range_min || 0) / 100)
      const max = Math.round((artist.price_range_max || artist.price_range_min || 0) / 100)
      return `¥${min}-${max}`
    }
  }
}
</script>

<style scoped>
.artists-section {
  padding: 64px 0 96px;
}

.inline-state {
  padding: 28px;
  text-align: center;
  color: var(--text-light);
}

.error-state p {
  margin-bottom: 10px;
}

.text-button {
  border: 0;
  background: transparent;
  color: var(--primary-color);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}

.text-button:hover {
  color: var(--primary-dark);
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.artist-card {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 15px;
  align-items: center;
  padding: 20px;
  background: var(--white);
  border: 1px solid #E5E5E5;
  border-radius: var(--radius);
  text-decoration: none;
  transition: var(--transition);
}

.artist-card:hover {
  border-color: var(--primary-color);
}

.artist-avatar {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  background: #F0F0F0 center/cover no-repeat;
  color: var(--text-muted);
  font-size: 1.4rem;
  font-weight: 700;
  border-radius: 50%;
}

.artist-info {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.artist-info strong {
  color: var(--text-dark);
  font-size: 1.05rem;
}

.artist-info small {
  color: var(--text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-meta {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.artist-price {
  color: var(--text-dark);
  font-weight: 600;
  font-size: 0.9rem;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-row span {
  padding: 2px 7px;
  background: #F5F5F5;
  color: var(--text-light);
  font-size: 0.74rem;
  border-radius: 3px;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
}

.status.open {
  background: #EFF6FF;
  color: #1D4ED8;
}

.status.closed {
  background: #F5F5F5;
  color: var(--text-muted);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  margin-top: 40px;
  color: var(--text-light);
}

.pagination button {
  padding: 9px 18px;
  border: 1px solid #E5E5E5;
  background: var(--white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.pagination button:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: default;
}

@media (max-width: 760px) {
  .artist-grid {
    grid-template-columns: 1fr;
  }
}
</style>
