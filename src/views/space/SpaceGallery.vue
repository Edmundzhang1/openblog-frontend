<template>
  <div class="space-gallery">
    <div class="container">
      <!-- 标题区 -->
      <div class="gallery-header fade-in">
        <h1>{{ isZh ? '作品画廊' : 'Gallery' }}</h1>
        <p class="subtitle">{{ isZh ? '浏览画师的公开作品' : 'Browse the artist\'s public works' }}</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner">🎨</div>
        <p>{{ isZh ? '加载中...' : 'Loading...' }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn btn-outline" @click="loadWorks">{{ isZh ? '重试' : 'Retry' }}</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="works.length === 0" class="empty-state">
        <div class="empty-icon">🖼️</div>
        <p>{{ isZh ? '暂无公开作品' : 'No public works yet' }}</p>
      </div>

      <template v-else>
        <!-- 分类标签 -->
        <div class="style-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['style-tab', { active: activeCategory === tab.key }]"
            @click="activeCategory = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 作品网格 -->
        <div class="masonry-grid">
          <div
            v-for="work in filteredWorks"
            :key="work.id"
            class="masonry-item"
            @click="openLightbox(workImage(work))"
          >
            <img :src="workImage(work)" :alt="work.title" loading="lazy" @error="handleImageError">
            <div class="work-overlay">
              <span class="work-title">{{ work.title }}</span>
              <span class="work-category">{{ categoryLabel(work.category) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { eventBus } from '../../utils/eventBus'
import { getPublicWorksAPI } from '@/api/artist.js'
import { IMAGES } from '../../config/assets.js'

const CATEGORY_LABELS = {
  zh: { all: '全部', avatar: '头像', character: '立绘', illustration: '插图', concept: '设定图' },
  en: { all: 'All', avatar: 'Avatar', character: 'Character', illustration: 'Illustration', concept: 'Concept' }
}

const CATEGORY_ORDER = ['all', 'avatar', 'character', 'illustration', 'concept']

export default {
  name: 'SpaceGallery',
  setup() {
    const route = useRoute()
    const i18n = inject('i18n')
    return { route, i18n }
  },
  data() {
    return {
      loading: false,
      error: null,
      works: [],
      activeCategory: 'all'
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    isZh() {
      return this.locale === 'zh'
    },
    labels() {
      return CATEGORY_LABELS[this.locale] || CATEGORY_LABELS.zh
    },
    // 只展示作品中实际存在的分类
    tabs() {
      const present = new Set(this.works.map(work => work.category).filter(Boolean))
      return CATEGORY_ORDER
        .filter(key => key === 'all' || present.has(key))
        .map(key => ({ key, label: this.labels[key] || key }))
    },
    filteredWorks() {
      if (this.activeCategory === 'all') return this.works
      return this.works.filter(work => work.category === this.activeCategory)
    }
  },
  async mounted() {
    await this.loadWorks()
  },
  methods: {
    async loadWorks() {
      const slug = this.route.params.slug
      if (!slug) {
        console.error('[SpaceGallery] 缺少 slug 参数')
        return
      }

      this.loading = true
      this.error = null

      try {
        const res = await getPublicWorksAPI(slug)
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.list || [])
        this.works = list.map(work => ({
          id: work.id,
          title: work.title || '',
          image_url: work.image_url || work.image || '',
          category: work.category || 'all'
        }))
      } catch (err) {
        console.error('[SpaceGallery] 加载作品失败:', err)
        this.error = err.message || (this.isZh ? '加载失败' : 'Loading failed')
      } finally {
        this.loading = false
      }
    },
    categoryLabel(category) {
      return this.labels[category] || category || ''
    },
    workImage(work) {
      return work.image_url || IMAGES.imageLoadError
    },
    handleImageError(e) {
      e.target.src = IMAGES.imageLoadError
    },
    openLightbox(src) {
      if (src) eventBus.emit('open-lightbox', src)
    }
  }
}
</script>

<style scoped>
.space-gallery {
  padding: 60px 0 96px;
  min-height: 100vh;
  background: var(--white);
}

.gallery-header {
  text-align: center;
  margin-bottom: 48px;
}

.gallery-header h1 {
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

.style-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 40px;
}

.style-tab {
  padding: 8px 20px;
  border: 1px solid #E5E7EB;
  background: var(--white);
  color: var(--text-light);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.3s, border-color 0.3s, background 0.3s;
}

.style-tab:hover {
  color: var(--text-dark);
  border-color: var(--text-dark);
}

.style-tab.active {
  background: var(--text-dark);
  border-color: var(--text-dark);
  color: var(--white);
}

.masonry-grid {
  columns: 3;
  column-gap: 20px;
}

.masonry-item {
  position: relative;
  margin-bottom: 20px;
  break-inside: avoid;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: zoom-in;
  border: 1px solid #E5E7EB;
  transition: box-shadow 0.3s;
}

.masonry-item:hover {
  box-shadow: var(--shadow);
}

.masonry-item img {
  width: 100%;
  display: block;
  background: #F3F4F6;
}

.work-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px 16px 12px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  color: var(--white);
  opacity: 0;
  transition: opacity 0.3s;
}

.masonry-item:hover .work-overlay {
  opacity: 1;
}

.work-title {
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-category {
  flex-shrink: 0;
  font-size: 0.75rem;
  opacity: 0.85;
}

@media (max-width: 960px) {
  .masonry-grid {
    columns: 2;
  }
}

@media (max-width: 600px) {
  .masonry-grid {
    columns: 1;
  }
}
</style>
