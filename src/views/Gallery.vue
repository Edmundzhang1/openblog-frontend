<template>
  <div class="gallery-page">
    <header class="page-header">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="gallery-section">
      <div class="container">
        <div class="gallery-filter">
          <button 
            v-for="filter in filters" 
            :key="filter.key"
            class="filter-btn"
            :class="{ active: activeFilter === filter.key }"
            @click="activeFilter = filter.key"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="gallery-grid">
          <div 
            v-for="item in filteredItems" 
            :key="item.id"
            class="gallery-item"
            @click="openLightbox(item.image)"
          >
            <img :src="item.image" :alt="item.title">
            <div class="gallery-item-info">
              <h4>{{ item.title }}</h4>
              <span class="tag">{{ getCategoryName(item.category) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { eventBus } from '../utils/eventBus'
import { inject } from 'vue'

const GALLERY_CONTENT = {
  zh: {
    title: '委托展示',
    subtitle: '浏览我们的作品案例，寻找您喜欢的风格',
    filters: [
      { key: 'all', label: '全部' },
      { key: 'avatar', label: '头像' },
      { key: 'character', label: '立绘' },
      { key: 'illustration', label: '插图' },
      { key: 'concept', label: '设定图' }
    ],
    categories: {
      avatar: '头像',
      character: '立绘',
      illustration: '插图',
      concept: '设定图'
    },
    items: [
      { id: 1, category: 'avatar', image: 'https://via.placeholder.com/400x400/6b8e6b/ffffff?text=%E5%A4%B4%E5%83%8F%E4%BD%9C%E5%93%811', title: 'Q版头像委托' },
      { id: 2, category: 'avatar', image: 'https://via.placeholder.com/400x400/7a9c6b/ffffff?text=%E5%A4%B4%E5%83%8F%E4%BD%9C%E5%93%812', title: '情侣头像' },
      { id: 3, category: 'avatar', image: 'https://via.placeholder.com/400x400/8aaa7c/ffffff?text=%E5%A4%B4%E5%83%8F%E4%BD%9C%E5%93%813', title: '写实风格头像' },
      { id: 4, category: 'character', image: 'https://via.placeholder.com/400x600/d4a574/ffffff?text=%E7%AB%8B%E7%BB%98%E4%BD%9C%E5%93%811', title: '游戏角色立绘' },
      { id: 5, category: 'character', image: 'https://via.placeholder.com/400x600/e4b584/ffffff?text=%E7%AB%8B%E7%BB%98%E4%BD%9C%E5%93%812', title: 'Vtuber立绘' },
      { id: 6, category: 'illustration', image: 'https://via.placeholder.com/500x350/4a6b4a/ffffff?text=%E6%8F%92%E5%9B%BE%E4%BD%9C%E5%93%811', title: '小说封面插图' },
      { id: 7, category: 'illustration', image: 'https://via.placeholder.com/500x350/5a7b5a/ffffff?text=%E6%8F%92%E5%9B%BE%E4%BD%9C%E5%93%812', title: '场景氛围图' },
      { id: 8, category: 'illustration', image: 'https://via.placeholder.com/500x350/6a8b6a/ffffff?text=%E6%8F%92%E5%9B%BE%E4%BD%9C%E5%93%813', title: '节日贺图' },
      { id: 9, category: 'concept', image: 'https://via.placeholder.com/400x400/8b7355/ffffff?text=%E8%AE%BE%E5%AE%9A%E5%9B%BE%E4%BD%9C%E5%93%811', title: '原创角色设定' },
      { id: 10, category: 'concept', image: 'https://via.placeholder.com/400x400/9b8365/ffffff?text=%E8%AE%BE%E5%AE%9A%E5%9B%BE%E4%BD%9C%E5%93%812', title: '服装设定' }
    ]
  },
  en: {
    title: 'Gallery',
    subtitle: 'Browse our commission samples and find the style you like',
    filters: [
      { key: 'all', label: 'All' },
      { key: 'avatar', label: 'Avatar' },
      { key: 'character', label: 'Character' },
      { key: 'illustration', label: 'Illustration' },
      { key: 'concept', label: 'Concept' }
    ],
    categories: {
      avatar: 'Avatar',
      character: 'Character',
      illustration: 'Illustration',
      concept: 'Concept'
    },
    items: [
      { id: 1, category: 'avatar', image: 'https://via.placeholder.com/400x400/6b8e6b/ffffff?text=Avatar+1', title: 'Chibi Avatar Commission' },
      { id: 2, category: 'avatar', image: 'https://via.placeholder.com/400x400/7a9c6b/ffffff?text=Avatar+2', title: 'Couple Avatar' },
      { id: 3, category: 'avatar', image: 'https://via.placeholder.com/400x400/8aaa7c/ffffff?text=Avatar+3', title: 'Realistic Portrait' },
      { id: 4, category: 'character', image: 'https://via.placeholder.com/400x600/d4a574/ffffff?text=Character+1', title: 'Game Character Illustration' },
      { id: 5, category: 'character', image: 'https://via.placeholder.com/400x600/e4b584/ffffff?text=Character+2', title: 'Vtuber Character Sheet' },
      { id: 6, category: 'illustration', image: 'https://via.placeholder.com/500x350/4a6b4a/ffffff?text=Illustration+1', title: 'Novel Cover Illustration' },
      { id: 7, category: 'illustration', image: 'https://via.placeholder.com/500x350/5a7b5a/ffffff?text=Illustration+2', title: 'Atmospheric Scene Art' },
      { id: 8, category: 'illustration', image: 'https://via.placeholder.com/500x350/6a8b6a/ffffff?text=Illustration+3', title: 'Holiday Illustration' },
      { id: 9, category: 'concept', image: 'https://via.placeholder.com/400x400/8b7355/ffffff?text=Concept+1', title: 'Original Character Design' },
      { id: 10, category: 'concept', image: 'https://via.placeholder.com/400x400/9b8365/ffffff?text=Concept+2', title: 'Costume Design Sheet' }
    ]
  }
}

export default {
  name: 'Gallery',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      activeFilter: 'all',
      apiItems: []
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return GALLERY_CONTENT[this.locale]
    },
    filters() {
      return this.content.filters
    },
    items() {
      if (this.apiItems.length > 0) {
        return this.apiItems.map((item) => ({
          id: item.id,
          category: item.category,
          image: item.image_url,
          title: this.locale === 'zh'
            ? (item.title_zh || item.title || item.name || '')
            : (item.title_en || item.title || item.name || '')
        }))
      }
      return this.content.items
    },
    filteredItems() {
      if (this.activeFilter === 'all') return this.items
      return this.items.filter(item => item.category === this.activeFilter)
    }
  },
  mounted() {
    this.loadGallery()
  },
  methods: {
    getCategoryName(category) {
      return this.content.categories[category] || category
    },
    openLightbox(src) {
      eventBus.emit('open-lightbox', src)
    },
    async loadGallery() {
      try {
        const res = await fetch('/api/gallery')
        if (res.ok) {
          const data = await res.json()
          if (data.items && data.items.length > 0) {
            this.apiItems = data.items
          }
        }
      } catch (e) {
        console.log('使用默认作品展示')
      }
    }
  }
}
</script>

<style scoped>
.gallery-section {
  padding: 60px 0;
}

.gallery-filter {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 25px;
  background: var(--white);
  border: 2px solid #ddd;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.filter-btn:hover,
.filter-btn.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.filter-btn.active {
  background: var(--primary-color);
  color: var(--white);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.gallery-item {
  background: var(--white);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: var(--transition);
  cursor: pointer;
}

.gallery-item:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.gallery-item img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  transition: var(--transition);
}

.gallery-item:hover img {
  transform: scale(1.05);
}

.gallery-item-info {
  padding: 20px;
}

.gallery-item-info h4 {
  margin-bottom: 8px;
  color: var(--text-dark);
}

.tag {
  display: inline-block;
  padding: 4px 12px;
  background: var(--bg-light);
  color: var(--primary-color);
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
