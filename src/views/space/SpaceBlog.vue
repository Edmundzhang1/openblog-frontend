<template>
  <div class="space-blog">
    <div class="container">
      <!-- 标题区 -->
      <div class="blog-header fade-in">
        <h1>{{ isZh ? '创作动态' : 'Blog & Updates' }}</h1>
        <p class="subtitle">{{ isZh ? '了解画师的最新动态与公告' : 'Latest news and updates from the artist' }}</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner">📝</div>
        <p>{{ isZh ? '加载中...' : 'Loading...' }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn btn-outline" @click="loadMoments">{{ isZh ? '重试' : 'Retry' }}</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="moments.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <p>{{ isZh ? '暂无动态' : 'No posts yet' }}</p>
      </div>

      <template v-else>
        <!-- 分类标签 -->
        <div v-if="tabs.length > 2" class="blog-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['blog-tab', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 动态列表 -->
        <div class="blog-grid">
          <article
            v-for="moment in filteredMoments"
            :key="moment.id"
            class="blog-card"
            @click="openMoment(moment)"
          >
            <div v-if="moment.images?.length" class="blog-image">
              <img :src="moment.images[0]" :alt="moment.title" loading="lazy" @error="handleImageError">
            </div>
            <div class="blog-content">
              <div class="blog-meta-top">
                <span v-if="moment.category" class="blog-category">{{ moment.category }}</span>
                <span class="blog-date">{{ formatDate(moment.created_at) }}</span>
              </div>
              <h3>{{ moment.title || contentUntitled }}</h3>
              <p class="blog-excerpt">{{ moment.content }}</p>
              <span class="read-more">{{ isZh ? '阅读更多' : 'Read More' }} →</span>
            </div>
          </article>
        </div>
      </template>
    </div>

    <!-- 动态详情弹窗 -->
    <div v-if="selectedMoment" class="moment-modal" @click.self="closeMoment">
      <div class="moment-modal-content">
        <button class="close-btn" @click="closeMoment">×</button>
        <article class="moment-detail">
          <div class="moment-meta">
            <span v-if="selectedMoment.category" class="blog-category">{{ selectedMoment.category }}</span>
            <span class="blog-date">{{ formatDate(selectedMoment.created_at) }}</span>
          </div>
          <h2>{{ selectedMoment.title || contentUntitled }}</h2>
          <p class="moment-text">{{ selectedMoment.content }}</p>
          <div v-if="selectedMoment.images?.length" class="moment-images">
            <img
              v-for="(img, idx) in selectedMoment.images"
              :key="idx"
              :src="img"
              :alt="`${idx + 1}`"
              @error="handleImageError"
              @click="openLightbox(img)"
            >
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { eventBus } from '../../utils/eventBus'
import { getPublicMomentsAPI } from '@/api/artist.js'
import { IMAGES } from '../../config/assets.js'

export default {
  name: 'SpaceBlog',
  setup() {
    const route = useRoute()
    const i18n = inject('i18n')
    return { route, i18n }
  },
  data() {
    return {
      loading: false,
      error: null,
      moments: [],
      activeTab: 'all',
      selectedMoment: null
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    isZh() {
      return this.locale === 'zh'
    },
    contentUntitled() {
      return this.isZh ? '未命名动态' : 'Untitled'
    },
    tabs() {
      const categories = [...new Set(this.moments.map(m => m.category).filter(Boolean))]
      return [
        { key: 'all', label: this.isZh ? '全部' : 'All' },
        ...categories.map(cat => ({ key: cat, label: cat }))
      ]
    },
    filteredMoments() {
      if (this.activeTab === 'all') return this.moments
      return this.moments.filter(m => m.category === this.activeTab)
    }
  },
  async mounted() {
    await this.loadMoments()
  },
  methods: {
    async loadMoments() {
      const slug = this.route.params.slug
      if (!slug) {
        console.error('[SpaceBlog] 缺少 slug 参数')
        return
      }

      this.loading = true
      this.error = null

      try {
        const res = await getPublicMomentsAPI(slug)
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.list || [])
        this.moments = list
          .filter(m => !m.visibility || m.visibility === 'public')
          .map(m => ({
            id: m.id,
            title: m.title || '',
            content: m.content || '',
            images: Array.isArray(m.images) ? m.images : [],
            category: m.category || '',
            created_at: m.created_at || ''
          }))
      } catch (err) {
        console.error('[SpaceBlog] 加载动态失败:', err)
        this.error = err.message || (this.isZh ? '加载失败' : 'Loading failed')
      } finally {
        this.loading = false
      }
    },
    formatDate(value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
      return date.toLocaleDateString(this.isZh ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    handleImageError(e) {
      e.target.src = IMAGES.imageLoadError
    },
    openMoment(moment) {
      this.selectedMoment = moment
    },
    closeMoment() {
      this.selectedMoment = null
    },
    openLightbox(src) {
      if (src) eventBus.emit('open-lightbox', src)
    }
  }
}
</script>

<style scoped>
.space-blog {
  padding: 60px 0 96px;
  min-height: 100vh;
  background: var(--white);
}

.blog-header {
  text-align: center;
  margin-bottom: 48px;
}

.blog-header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-light);
}

.loading-state,
.error-state,
.empty-state {
  padding: 80px 0;
  text-align: center;
  color: var(--text-light);
}

.spinner,
.empty-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.error-state p {
  margin-bottom: 16px;
}

.blog-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 40px;
}

.blog-tab {
  padding: 8px 20px;
  border: 1px solid #E5E7EB;
  background: var(--white);
  color: var(--text-light);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.3s, border-color 0.3s, background 0.3s;
}

.blog-tab:hover {
  color: var(--text-dark);
  border-color: var(--text-dark);
}

.blog-tab.active {
  background: var(--text-dark);
  border-color: var(--text-dark);
  color: var(--white);
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.blog-card {
  background: var(--white);
  border: 1px solid #E5E7EB;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.blog-card:hover {
  box-shadow: var(--shadow);
}

.blog-image img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
  background: #F3F4F6;
}

.blog-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.blog-meta-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.blog-category {
  padding: 3px 10px;
  background: #EFF6FF;
  color: #1D4ED8;
  font-size: 0.75rem;
  border-radius: 4px;
}

.blog-date {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.blog-content h3 {
  font-size: 1.1rem;
  color: var(--text-dark);
}

.blog-excerpt {
  color: var(--text-light);
  font-size: 0.92rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.read-more {
  color: var(--text-dark);
  font-size: 0.88rem;
  font-weight: 600;
}

/* 详情弹窗 */
.moment-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  padding: 24px;
  z-index: 1000;
}

.moment-modal-content {
  position: relative;
  width: min(720px, 100%);
  max-height: 85vh;
  overflow-y: auto;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  border: 0;
  background: transparent;
  font-size: 1.6rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: var(--text-dark);
}

.moment-detail {
  padding: 48px 40px;
}

.moment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.moment-detail h2 {
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.moment-text {
  color: var(--text-light);
  line-height: 1.8;
  white-space: pre-wrap;
}

.moment-images {
  margin-top: 24px;
  display: grid;
  gap: 12px;
}

.moment-images img {
  width: 100%;
  border-radius: var(--radius);
  cursor: zoom-in;
  background: #F3F4F6;
}

@media (max-width: 600px) {
  .moment-detail {
    padding: 40px 24px;
  }
}
</style>
