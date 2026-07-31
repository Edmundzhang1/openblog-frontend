<template>
  <div class="gallery-page">
    <header class="page-header fade-in">
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
      { id: 1, category: 'avatar', image: '/images/art-avatar.jpg', title: 'Q版头像委托' },
      { id: 2, category: 'avatar', image: '/images/art-portrait.jpg', title: '情侣头像' },
      { id: 3, category: 'avatar', image: '/images/art-avatar-alt.jpg', title: '写实风格头像' },
      { id: 4, category: 'character', image: '/images/art-character.jpg', title: '游戏角色立绘' },
      { id: 5, category: 'character', image: '/images/art-character-alt.jpg', title: 'Vtuber立绘' },
      { id: 6, category: 'illustration', image: '/images/blog-workflow.jpg', title: '小说封面插图' },
      { id: 7, category: 'illustration', image: '/images/art-scene.jpg', title: '场景氛围图' },
      { id: 8, category: 'illustration', image: '/images/hero-2.jpg', title: '节日贺图' },
      { id: 9, category: 'concept', image: '/images/art-concept.jpg', title: '原创角色设定' },
      { id: 10, category: 'concept', image: '/images/art-concept-alt.jpg', title: '服装设定' }
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
      { id: 1, category: 'avatar', image: '/images/art-avatar.jpg', title: 'Chibi Avatar Commission' },
      { id: 2, category: 'avatar', image: '/images/art-portrait.jpg', title: 'Couple Avatar' },
      { id: 3, category: 'avatar', image: '/images/art-avatar-alt.jpg', title: 'Realistic Portrait' },
      { id: 4, category: 'character', image: '/images/art-character.jpg', title: 'Game Character Illustration' },
      { id: 5, category: 'character', image: '/images/art-character-alt.jpg', title: 'Vtuber Character Sheet' },
      { id: 6, category: 'illustration', image: '/images/blog-workflow.jpg', title: 'Novel Cover Illustration' },
      { id: 7, category: 'illustration', image: '/images/art-scene.jpg', title: 'Atmospheric Scene Art' },
      { id: 8, category: 'illustration', image: '/images/hero-2.jpg', title: 'Holiday Illustration' },
      { id: 9, category: 'concept', image: '/images/art-concept.jpg', title: 'Original Character Design' },
      { id: 10, category: 'concept', image: '/images/art-concept-alt.jpg', title: 'Costume Design Sheet' }
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
      activeFilter: 'all'
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
      return this.content.items
    },
    filteredItems() {
      if (this.activeFilter === 'all') return this.items
      return this.items.filter(item => item.category === this.activeFilter)
    }
  },
  methods: {
    getCategoryName(category) {
      return this.content.categories[category] || category
    },
    openLightbox(src) {
      eventBus.emit('open-lightbox', src)
    }
  }
}
</script>

<style scoped>
.gallery-section {
  padding: 64px 0;
}

.gallery-filter {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 48px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-light);
  transition: var(--transition);
}

.filter-btn:hover {
  color: var(--primary-color);
}

.filter-btn.active {
  color: var(--text-dark);
  font-weight: 600;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 40px 32px;
}

.gallery-item {
  background: var(--white);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: var(--transition), box-shadow 0.3s ease;
  cursor: pointer;
}

.gallery-item:hover {
  box-shadow: var(--shadow-hover);
}

.gallery-item img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.gallery-item-info {
  padding: 20px;
}

.gallery-item-info h4 {
  margin-bottom: 8px;
  color: var(--text-dark);
}

.tag {
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .gallery-section {
    padding: 32px 0;
  }

  .gallery-filter {
    gap: 20px;
    margin-bottom: 32px;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
