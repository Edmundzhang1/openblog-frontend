<template>
  <div class="about-section">
    <div class="container">
      <!-- 标题区 -->
      <div class="about-header fade-in">
        <h1>{{ isZh ? '关于' : 'About' }}</h1>
        <p class="subtitle">{{ artistData?.bio || (isZh ? '了解画师的故事与理念' : 'Learn about the artist') }}</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner">📝</div>
        <p>{{ isZh ? '加载中...' : 'Loading...' }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn btn-outline" @click="loadArtistData">{{ isZh ? '重试' : 'Retry' }}</button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="isEmpty" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>{{ isZh ? '暂无内容' : 'No content yet' }}</p>
      </div>

      <!-- 内容区 -->
      <div v-else class="about-layout">
        <!-- 左侧导航 -->
        <aside class="about-nav">
          <button 
            v-for="section in sections" 
            :key="section.id"
            :class="['nav-btn', { active: activeSection === section.id }]"
            @click="activeSection = section.id"
          >
            {{ section.title }}
          </button>
        </aside>

        <!-- 右侧内容 -->
        <div class="about-content">
          <div 
            v-for="section in sections" 
            :key="section.id"
            v-show="activeSection === section.id && section.items?.length"
            class="about-content-section"
          >
            <h2>{{ section.title }}</h2>
            
            <!-- 时间线样式（历史类） -->
            <div v-if="hasDateField(section)" class="timeline">
              <div v-for="(item, index) in section.items" :key="index" class="timeline-item">
                <div class="date">{{ item.date }}</div>
                <p><strong>{{ item.title }}</strong></p>
                <p>{{ item.desc }}</p>
              </div>
            </div>
            
            <!-- 卡片网格样式（团队类） -->
            <div v-else-if="hasIconAndName(section)" class="team-grid">
              <div v-for="(item, index) in section.items" :key="index" class="team-card">
                <div class="team-avatar">{{ item.icon }}</div>
                <h4>{{ item.name }}</h4>
                <p>{{ item.role }}</p>
                <p v-if="item.desc" class="team-desc">{{ item.desc }}</p>
              </div>
            </div>
            
            <!-- 普通列表样式 -->
            <div v-else class="item-list">
              <div v-for="(item, index) in section.items" :key="index" class="item-card">
                <div v-if="item.icon" class="item-icon">{{ item.icon }}</div>
                <div class="item-content">
                  <p><strong>{{ item.title }}</strong></p>
                  <p>{{ item.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicAboutAPI } from '@/api/artist.js'

export default {
  name: 'About',
  setup() {
    const route = useRoute()
    const i18n = inject('i18n')
    return { route, i18n }
  },
  data() {
    return {
      loading: false,
      error: null,
      activeSection: '',
      artistData: null,
      sections: []
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    isZh() {
      return this.locale === 'zh'
    },
    isEmpty() {
      return !this.loading && this.sections.length === 0
    }
  },
  watch: {
    sections(newSections) {
      if (newSections.length > 0 && !newSections.find(s => s.id === this.activeSection)) {
        this.activeSection = newSections[0].id
      }
    }
  },
  async mounted() {
    await this.loadArtistData()
  },
  methods: {
    async loadArtistData() {
      const slug = this.route.params.slug
      if (!slug) {
        console.error('[About] 缺少 slug 参数')
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const res = await getPublicAboutAPI(slug)
        
        if (res.data?.sections) {
          // 过滤掉没有内容的板块
          this.sections = res.data.sections.filter(s => s.items && s.items.length > 0)
          if (this.sections.length > 0) {
            this.activeSection = this.sections[0].id
          }
        }
      } catch (err) {
        console.error('[About] 加载关于页面失败:', err)
        this.error = err.message || (this.isZh ? '加载失败' : 'Loading failed')
      } finally {
        this.loading = false
      }
    },
    
    // 判断是否有日期字段（时间线样式）
    hasDateField(section) {
      return section.items?.some(item => item.date)
    },
    
    // 判断是否有图标和名称（卡片样式）
    hasIconAndName(section) {
      return section.items?.some(item => item.icon && item.name)
    }
  }
}
</script>

<style scoped>
.about-section {
  padding: 60px 0;
  min-height: 100vh;
}

.about-header {
  text-align: center;
  margin-bottom: 40px;
}

.about-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: var(--text-dark);
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
}

.spinner {
  font-size: 48px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.about-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 40px;
}

@media (max-width: 768px) {
  .about-layout {
    grid-template-columns: 1fr;
  }
  
  .about-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.about-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-btn {
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
  color: var(--text-muted);
  transition: all 0.3s;
}

.nav-btn:hover {
  background: var(--bg-light);
  color: var(--text-dark);
}

.nav-btn.active {
  background: var(--primary-color);
  color: white;
}

.about-content {
  background: var(--white);
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.about-content-section h2 {
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--bg-light);
}

.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--primary-color);
}

.timeline-item {
  position: relative;
  padding-bottom: 30px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -28px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary-color);
}

.timeline-item .date {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.timeline-item p {
  margin-bottom: 8px;
  line-height: 1.6;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.item-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: var(--bg-light);
  border-radius: 12px;
}

.item-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.item-content p {
  margin-bottom: 8px;
  line-height: 1.6;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 24px;
}

.team-card {
  text-align: center;
  padding: 24px;
  background: var(--bg-light);
  border-radius: 12px;
}

.team-avatar {
  font-size: 48px;
  margin-bottom: 12px;
}

.team-card h4 {
  margin-bottom: 4px;
  font-size: 1rem;
}

.team-card p {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.team-desc {
  margin-top: 8px;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}
</style>
