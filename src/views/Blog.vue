<template>
  <div class="blog">
    <header class="page-header fade-in">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="blog-section">
      <div class="container">
        <!-- 分类标签 -->
        <div class="blog-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            class="blog-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 文章列表 -->
        <div class="blog-grid">
          <article 
            v-for="post in filteredPosts" 
            :key="post.id"
            class="blog-card"
            @click="openPost(post)"
          >
            <div class="blog-image">
              <img :src="post.image" :alt="post.title">
              <span class="blog-category">{{ post.category }}</span>
            </div>
            <div class="blog-content">
              <h3>{{ post.title }}</h3>
              <p class="blog-excerpt">{{ post.excerpt }}</p>
              <div class="blog-meta">
                <span class="blog-date">
                  {{ content.publishedAt }} {{ formatDate(post.date) }}
                </span>
                <span class="read-more">{{ content.readMore }} →</span>
              </div>
            </div>
          </article>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <button class="btn btn-secondary" @click="loadMore" :disabled="loading">
            {{ loading ? content.loading : content.loadMore }}
          </button>
        </div>
      </div>
    </section>

    <!-- 文章详情弹窗 -->
    <div v-if="selectedPost" class="post-modal" @click.self="closePost">
      <div class="post-modal-content">
        <button class="close-btn" @click="closePost">×</button>
        <article class="post-detail">
          <div class="post-header">
            <span class="post-category">{{ selectedPost.category }}</span>
            <h2>{{ selectedPost.title }}</h2>
            <div class="post-meta">
              <span>{{ formatDate(selectedPost.date) }}</span>
              <span v-if="selectedPost.author">· {{ selectedPost.author }}</span>
            </div>
          </div>
          <div class="post-image" v-if="selectedPost.image">
            <img :src="selectedPost.image" :alt="selectedPost.title">
          </div>
          <div class="post-body" v-html="selectedPost.content"></div>
          
          <!-- 文章内联系入口 -->
          <div class="post-contact">
            <h4>{{ content.contactInArticle }}</h4>
            <div class="contact-actions">
              <router-link to="/commission" class="btn btn-primary">
                {{ content.commissionNow }}
              </router-link>
              <router-link to="/contact" class="btn btn-secondary">
                {{ content.contactUs }}
              </router-link>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { fetchPlatformPages } from '../utils/platformPages'

const BLOG_CONTENT = {
  zh: {
    title: '创作动态',
    subtitle: '了解最新创作和委托规则',
    publishedAt: '发布于',
    readMore: '阅读更多',
    contactInArticle: '文章联系入口',
    commissionNow: '立即约稿',
    contactUs: '联系我们',
    loadMore: '加载更多',
    loading: '加载中...',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'notice', label: '公告' },
      { key: 'works', label: '作品' },
      { key: 'rules', label: '规则' },
      { key: 'tutorial', label: '教程' }
    ],
    posts: [
      {
        id: 1,
        categoryKey: 'notice',
        category: '公告',
        title: '2026年春季委托开放通知',
        excerpt: '春季委托位已开放，本次开放10个委托位，包含头像、立绘、插图等多种类型...',
        content: '<p>亲爱的委托人们：</p><p>春季委托位现已开放，本次开放包含：</p><ul><li>头像 x 5 位</li><li>立绘 x 3 位</li><li>插图 x 2 位</li></ul><p>预计工期为接单后2-4周，具体根据复杂度而定。欢迎大家提交委托申请！</p>',
        image: 'https://via.placeholder.com/800x400/6b8e6b/ffffff?text=春季开放',
        date: '2026-03-01',
        author: 'FUREST工作室'
      },
      {
        id: 2,
        categoryKey: 'works',
        category: '作品',
        title: '新画风「赛博朋克」系列上线',
        excerpt: '全新赛博朋克风格正式上线，融合霓虹灯光与机械元素，打造独特的视觉体验...',
        content: '<p>经过一段时间的研发，全新的赛博朋克风格正式上线！</p><p>这个风格特点：</p><ul><li>霓虹灯光效果</li><li>机械元素点缀</li><li>高对比度配色</li></ul><p>欢迎喜欢这种风格的委托人们来尝试！</p>',
        image: 'https://via.placeholder.com/800x400/d4a574/ffffff?text=赛博朋克',
        date: '2026-02-28',
        author: '主画师'
      },
      {
        id: 3,
        categoryKey: 'rules',
        category: '规则',
        title: '委托流程与注意事项',
        excerpt: '详细说明从提交委托到交付成稿的完整流程，帮助新委托人快速了解合作方式...',
        content: '<h3>1. 提交委托</h3><p>在约稿页面填写详细信息，包括风格、描述、预算等。</p><h3>2. 等待确认</h3><p>画师会在24小时内查看委托并给出报价。</p><h3>3. 支付定金</h3><p>确认报价后支付定金（通常为50%），进入排期。</p><h3>4. 绘制过程</h3><p>画师开始绘制，期间可以通过站内消息沟通。</p><h3>5. 交付成稿</h3><p>完成绘制后交付成稿，支付尾款。</p>',
        image: 'https://via.placeholder.com/800x400/4a6b4a/ffffff?text=委托流程',
        date: '2026-02-20',
        author: 'FUREST工作室'
      },
      {
        id: 4,
        categoryKey: 'tutorial',
        category: '教程',
        title: '如何写好角色设定描述',
        excerpt: '一份好的设定描述可以帮助画师更好地理解你的需求，提高稿件满意度...',
        content: '<p>好的设定描述应该包含：</p><ul><li><strong>基础外貌</strong>：发型、发色、瞳色、身高体型</li><li><strong>服装细节</strong>：主要服饰、配饰、特殊标志</li><li><strong>性格特点</strong>：性格、常用表情、标志性动作</li><li><strong>参考图</strong>：如果有参考图一定要上传</li></ul><p>详细的描述可以减少修改次数，加快交付速度。</p>',
        image: 'https://via.placeholder.com/800x400/8b7355/ffffff?text=设定教程',
        date: '2026-02-15',
        author: '主画师'
      }
    ]
  },
  en: {
    title: 'Blog & Updates',
    subtitle: 'See the latest work announcements and commission guidelines',
    publishedAt: 'Published on',
    readMore: 'Read More',
    contactInArticle: 'Commission Contact',
    commissionNow: 'Start Commission',
    contactUs: 'Contact Us',
    loadMore: 'Load More',
    loading: 'Loading...',
    tabs: [
      { key: 'all', label: 'All' },
      { key: 'notice', label: 'Notice' },
      { key: 'works', label: 'Works' },
      { key: 'rules', label: 'Rules' },
      { key: 'tutorial', label: 'Tutorials' }
    ],
    posts: [
      {
        id: 1,
        categoryKey: 'notice',
        category: 'Notice',
        title: 'Spring 2026 Commission Slots Are Now Open',
        excerpt: 'Our spring commission window is now open with 10 slots covering avatars, character art, and full illustrations...',
        content: '<p>Dear clients,</p><p>Spring commissions are now open. This round includes:</p><ul><li>Avatar x 5</li><li>Character Illustration x 3</li><li>Illustration x 2</li></ul><p>The expected turnaround is 2-4 weeks after confirmation depending on complexity. You are welcome to submit your request now.</p>',
        image: 'https://via.placeholder.com/800x400/6b8e6b/ffffff?text=Spring+Open',
        date: '2026-03-01',
        author: 'FUREST Studio'
      },
      {
        id: 2,
        categoryKey: 'works',
        category: 'Works',
        title: 'New Cyberpunk Style Series Released',
        excerpt: 'Our new cyberpunk style is live, blending neon lighting with mechanical details for a distinctive visual mood...',
        content: '<p>After a dedicated development period, our new cyberpunk style is ready.</p><p>Key features include:</p><ul><li>Neon lighting effects</li><li>Mechanical accents</li><li>High-contrast color design</li></ul><p>If you enjoy this direction, feel free to try it in your next commission.</p>',
        image: 'https://via.placeholder.com/800x400/d4a574/ffffff?text=Cyberpunk',
        date: '2026-02-28',
        author: 'Lead Illustrator'
      },
      {
        id: 3,
        categoryKey: 'rules',
        category: 'Rules',
        title: 'Commission Workflow and Key Notes',
        excerpt: 'This guide explains the full process from request submission to final delivery so new clients can understand the collaboration flow quickly...',
        content: '<h3>1. Submit Your Request</h3><p>Fill out the commission page with style, description, budget, and references.</p><h3>2. Wait for Confirmation</h3><p>The artist will review your request within 24 hours and send a quote.</p><h3>3. Pay the Deposit</h3><p>After confirmation, pay the deposit, usually 50 percent, to enter the queue.</p><h3>4. Production Phase</h3><p>The artist starts drawing and you can communicate through the site message system.</p><h3>5. Final Delivery</h3><p>Once the artwork is complete, the final files are delivered after the remaining payment.</p>',
        image: 'https://via.placeholder.com/800x400/4a6b4a/ffffff?text=Workflow',
        date: '2026-02-20',
        author: 'FUREST Studio'
      },
      {
        id: 4,
        categoryKey: 'tutorial',
        category: 'Tutorial',
        title: 'How to Write a Better Character Description',
        excerpt: 'A clear design brief helps the artist understand your intent and improves the chance of a satisfying result...',
        content: '<p>A strong character brief should include:</p><ul><li><strong>Base appearance</strong>: hairstyle, hair color, eye color, height, and build</li><li><strong>Outfit details</strong>: core clothing pieces, accessories, and special marks</li><li><strong>Personality cues</strong>: temperament, signature expressions, and gestures</li><li><strong>Reference images</strong>: upload references whenever possible</li></ul><p>Detailed descriptions reduce revision rounds and help the project move faster.</p>',
        image: 'https://via.placeholder.com/800x400/8b7355/ffffff?text=Character+Brief',
        date: '2026-02-15',
        author: 'Lead Illustrator'
      }
    ]
  }
}

export default {
  name: 'Blog',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      activeTab: 'all',
      loading: false,
      hasMore: true,
      selectedPostId: null,
      // 平台配置的动态页内容（platform_pages.platform_blog，{ zh, en }），获取失败保持 null 使用内置内容
      platformBlog: null
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      const base = BLOG_CONTENT[this.locale]
      const override = this.platformBlog?.[this.locale]
      if (!override || !Array.isArray(override.tabs) || !Array.isArray(override.posts)) {
        return base
      }
      // 分类展示名由 tabs 派生，其余 UI 文案沿用内置内容
      const tabLabels = {}
      override.tabs.forEach(tab => { tabLabels[tab.key] = tab.label })
      return {
        ...base,
        tabs: override.tabs,
        posts: override.posts.map(post => ({ ...post, category: tabLabels[post.categoryKey] || post.category || '' }))
      }
    },
    tabs() {
      return this.content.tabs
    },
    posts() {
      return this.content.posts
    },
    filteredPosts() {
      if (this.activeTab === 'all') return this.posts
      return this.posts.filter(post => post.categoryKey === this.activeTab)
    },
    selectedPost() {
      return this.posts.find(post => post.id === this.selectedPostId) || null
    }
  },
  mounted() {
    // 拉取平台配置的页面内容，失败或缺省时静默回退到内置内容
    fetchPlatformPages().then(pages => {
      this.platformBlog = pages?.platform_blog || null
    })
  },
  methods: {
    parseDate(dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    },
    formatDate(date) {
      const parsed = this.parseDate(date)
      if (this.locale === 'zh') {
        return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(parsed)
    },
    openPost(post) {
      this.selectedPostId = post.id
      document.body.style.overflow = 'hidden'
    },
    closePost() {
      this.selectedPostId = null
      document.body.style.overflow = ''
    },
    loadMore() {
      this.loading = true
      setTimeout(() => {
        this.hasMore = false
        this.loading = false
      }, 1000)
    }
  }
}
</script>

<style scoped>
.blog-section {
  padding: 64px 0;
}

.blog-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.blog-tab {
  padding: 10px 24px;
  border: none;
  background: var(--secondary-color);
  color: var(--text-light);
  border-radius: var(--radius);
  cursor: pointer;
  transition: var(--transition);
  font-size: 1rem;
}

.blog-tab:hover,
.blog-tab.active {
  background: var(--primary-color);
  color: var(--white);
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
}

@media (max-width: 768px) {
  .blog-grid {
    grid-template-columns: 1fr;
  }
}

.blog-card {
  background: var(--white);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: var(--transition);
}

.blog-card:hover {
  box-shadow: var(--shadow-hover);
}

.blog-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.blog-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-category {
  position: absolute;
  top: 15px;
  left: 15px;
  background: var(--primary-color);
  color: var(--white);
  padding: 5px 15px;
  border-radius: var(--radius);
  font-size: 0.85rem;
}

.blog-content {
  padding: 25px;
}

.blog-content h3 {
  margin-bottom: 10px;
  color: var(--text-dark);
  font-size: 1.2rem;
}

.blog-excerpt {
  color: var(--text-light);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.blog-date {
  color: var(--text-muted);
}

.read-more {
  color: var(--primary-color);
  font-weight: 600;
}

.load-more {
  text-align: center;
  margin-top: 40px;
}

/* 文章详情弹窗 */
.post-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.post-modal-content {
  background: var(--white);
  border-radius: var(--radius);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-muted);
  z-index: 10;
}

.post-detail {
  padding: 40px;
}

.post-header {
  text-align: center;
  margin-bottom: 30px;
}

.post-category {
  display: inline-block;
  background: var(--primary-color);
  color: var(--white);
  padding: 5px 15px;
  border-radius: var(--radius);
  font-size: 0.85rem;
  margin-bottom: 15px;
}

.post-header h2 {
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.post-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.post-image {
  margin-bottom: 30px;
  border-radius: var(--radius);
  overflow: hidden;
}

.post-image img {
  width: 100%;
}

.post-body {
  line-height: 1.8;
  color: var(--text-dark);
}

.post-body h3 {
  margin: 25px 0 15px;
  color: var(--text-dark);
}

.post-body p {
  margin-bottom: 15px;
}

.post-body ul {
  margin-bottom: 15px;
  padding-left: 25px;
}

.post-body li {
  margin-bottom: 8px;
}

.post-contact {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.post-contact h4 {
  margin-bottom: 20px;
  color: var(--text-dark);
}

.contact-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@media (max-width: 768px) {
  .post-detail {
    padding: 20px;
  }
  
  .contact-actions {
    flex-direction: column;
  }
}
</style>
