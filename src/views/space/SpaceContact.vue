<template>
  <div class="contact-section">
    <div class="container">
      <!-- 标题区 -->
      <div class="contact-header fade-in">
        <h1>{{ isZh ? '联系方式' : 'Contact' }}</h1>
        <p class="subtitle">{{ isZh ? '通过以下平台找到我' : 'Find me on these platforms' }}</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="spinner">📞</div>
        <p>{{ isZh ? '加载中...' : 'Loading...' }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn btn-outline" @click="loadContact">{{ isZh ? '重试' : 'Retry' }}</button>
      </div>

      <!-- 联系方式卡片 -->
      <div v-if="contacts.length" class="contacts-grid">
        <a 
          v-for="contact in contacts" 
          :key="contact.key"
          :href="contact.url" 
          target="_blank"
          class="contact-card"
        >
          <div class="contact-icon">{{ contact.icon }}</div>
          <h3>{{ contact.name }}</h3>
          <p class="contact-desc">{{ contact.desc }}</p>
          <span class="contact-btn">{{ contact.btnText }}</span>
        </a>
      </div>

      <!-- FAQ -->
      <div v-if="faqs.length" class="faq-section">
        <h2>{{ isZh ? '常见问题' : 'FAQ' }}</h2>
        <div class="faq-list">
          <div v-for="(faq, index) in faqs" :key="index" class="faq-item">
            <h4>Q: {{ faq.q }}</h4>
            <p>A: {{ faq.a }}</p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && !contacts.length && !faqs.length" class="empty-state">
        <div class="empty-icon">📞</div>
        <p>{{ isZh ? '暂无联系方式' : 'No contact info yet' }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicContactAPI } from '@/api/artist.js'

export default {
  name: 'Contact',
  setup() {
    const route = useRoute()
    const i18n = inject('i18n')
    return { route, i18n }
  },
  data() {
    return {
      loading: false,
      error: null,
      contacts: [],
      faqs: []
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    isZh() {
      return this.locale === 'zh'
    }
  },
  async mounted() {
    await this.loadContact()
  },
  methods: {
    async loadContact() {
      const slug = this.route.params.slug
      if (!slug) {
        console.error('[Contact] 缺少 slug 参数')
        return
      }
      
      this.loading = true
      this.error = null
      
      try {
        const res = await getPublicContactAPI(slug)
        
        if (res.data) {
          this.contacts = this.buildContacts(res.data)
          this.faqs = res.data.faq || []
        }
      } catch (err) {
        console.error('[Contact] 加载联系方式失败:', err)
        this.error = err.message || (this.isZh ? '加载失败' : 'Loading failed')
      } finally {
        this.loading = false
      }
    },
    
    buildContacts(data) {
      const contacts = []
      const isZh = this.isZh
      
      if (data.qq) {
        contacts.push({
          key: 'qq',
          name: 'QQ',
          icon: '💬',
          desc: isZh ? '快速响应咨询' : 'Fast response',
          url: `https://wpa.qq.com/msgrd?v=3&uin=${data.qq}&site=qq&menu=yes`,
          btnText: isZh ? '添加QQ' : 'Add on QQ'
        })
      }
      
      if (data.wechat) {
        contacts.push({
          key: 'wechat',
          name: isZh ? '微信' : 'WeChat',
          icon: '💚',
          desc: isZh ? '扫码添加微信' : 'Scan to add',
          url: '#',
          btnText: data.wechat
        })
      }
      
      if (data.email) {
        contacts.push({
          key: 'email',
          name: 'Email',
          icon: '📧',
          desc: isZh ? '发送邮件咨询' : 'Send email',
          url: `mailto:${data.email}`,
          btnText: data.email
        })
      }
      
      // 处理社交平台数组
      const platformIcons = {
        bilibili: '📺',
        xiaohongshu: '📕',
        twitter: '𝕏',
        weibo: '📝',
        website: '🌐',
        custom: '🔗'
      }
      const platformNames = {
        bilibili: isZh ? 'Bilibili' : 'Bilibili',
        xiaohongshu: isZh ? '小红书' : 'Xiaohongshu',
        twitter: 'X (Twitter)',
        weibo: isZh ? '微博' : 'Weibo',
        website: isZh ? '个人网站' : 'Website',
        custom: isZh ? '其他' : 'Other'
      }
      
      if (data.socials && Array.isArray(data.socials)) {
        data.socials.forEach(social => {
          if (social.url) {
            contacts.push({
              key: social.name,
              name: platformNames[social.name] || social.name,
              icon: platformIcons[social.name] || '🔗',
              desc: isZh ? '访问主页' : 'Visit',
              url: social.url,
              btnText: isZh ? '访问' : 'Visit'
            })
          }
        })
      }
      
      return contacts
    }
  }
}
</script>

<style scoped>
.contact-section {
  padding: 60px 0;
  min-height: 100vh;
}

.contact-header {
  text-align: center;
  margin-bottom: 40px;
}

.contact-header h1 {
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

.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 60px;
}

.contact-card {
  background: var(--white);
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.contact-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.contact-card h3 {
  margin-bottom: 8px;
  font-size: 1.2rem;
}

.contact-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 16px;
  white-space: pre-line;
}

.contact-btn {
  display: inline-block;
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
  font-size: 0.9rem;
}

.faq-section {
  max-width: 800px;
  margin: 0 auto;
}

.faq-section h2 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-item {
  background: var(--white);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.faq-item h4 {
  margin-bottom: 12px;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.faq-item p {
  color: var(--text-dark);
  line-height: 1.6;
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
