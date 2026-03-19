<template>
  <div class="contact-page">
    <header class="page-header">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="contact-section">
      <div class="container">
        <div class="contact-grid">
          <div v-for="contact in contacts" :key="contact.key" :class="['contact-card', contact.key]">
            <div class="contact-icon">{{ contact.icon }}</div>
            <h3>{{ contact.name }}</h3>
            <p>{{ contact.desc }}</p>
            <a :href="contact.url" target="_blank" class="btn btn-outline">{{ contact.btnText }}</a>
          </div>
        </div>

        <!-- 常见问题 -->
        <div class="faq-section">
          <h3>{{ content.faqTitle }}</h3>
          <div class="faq-list">
            <div v-for="(faq, index) in faqs" :key="index" class="faq-item">
              <h4>Q: {{ faq.question }}</h4>
              <p>A: {{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { inject } from 'vue'

const CONTACT_CONTENT = {
  zh: {
    title: '联系我们',
    subtitle: '通过以下平台找到我们，随时欢迎咨询',
    faqTitle: '常见问题',
    contacts: [
      {
        key: 'qq',
        name: 'QQ',
        icon: '💬',
        desc: '工作日 9:00-21:00\n快速响应咨询',
        url: 'https://wpa.qq.com/msgrd?v=3&uin=123456789&site=qq&menu=yes',
        btnText: '添加QQ'
      },
      {
        key: 'xiaohongshu',
        name: '小红书',
        icon: '📕',
        desc: '查看最新作品\n关注创作日常',
        url: 'https://xiaohongshu.com',
        btnText: '关注小红书'
      },
      {
        key: 'x',
        name: 'X (Twitter)',
        icon: '𝕏',
        desc: '国际平台\n作品同步更新',
        url: 'https://x.com',
        btnText: '关注X'
      },
      {
        key: 'bilibili',
        name: 'Bilibili',
        icon: '📺',
        desc: '绘画过程视频\n直播预告通知',
        url: 'https://space.bilibili.com',
        btnText: '访问主页'
      }
    ],
    faqs: [
      {
        question: '委托需要提前多久预约？',
        answer: '建议提前1-2周预约，热门档期可能需要更长时间。可在排单日历查看当前排单情况。'
      },
      {
        question: '可以修改多少次？',
        answer: '草稿阶段可无限修改至满意，上色后小范围修改免费，大范围修改可能产生额外费用。'
      },
      {
        question: '支持哪些支付方式？',
        answer: '支持支付宝、微信支付、银行转账等多种支付方式。'
      },
      {
        question: '作品的版权归属？',
        answer: '个人使用委托版权归委托人所有；商业用途需提前说明并协商版权费用。'
      }
    ]
  },
  en: {
    title: 'Contact',
    subtitle: 'Find us on the platforms below and feel free to reach out anytime',
    faqTitle: 'FAQ',
    contacts: [
      {
        key: 'qq',
        name: 'QQ',
        icon: '💬',
        desc: 'Weekdays 9:00-21:00\nFast response for inquiries',
        url: 'https://wpa.qq.com/msgrd?v=3&uin=123456789&site=qq&menu=yes',
        btnText: 'Add on QQ'
      },
      {
        key: 'xiaohongshu',
        name: 'Xiaohongshu',
        icon: '📕',
        desc: 'See the latest artworks\nFollow our creative updates',
        url: 'https://xiaohongshu.com',
        btnText: 'Follow on Xiaohongshu'
      },
      {
        key: 'x',
        name: 'X (Twitter)',
        icon: '𝕏',
        desc: 'International platform\nWorks updated in sync',
        url: 'https://x.com',
        btnText: 'Follow on X'
      },
      {
        key: 'bilibili',
        name: 'Bilibili',
        icon: '📺',
        desc: 'Drawing process videos\nLivestream announcements',
        url: 'https://space.bilibili.com',
        btnText: 'Visit Channel'
      }
    ],
    faqs: [
      {
        question: 'How far in advance should I book a commission?',
        answer: 'Booking 1-2 weeks in advance is recommended. Popular slots may require even more lead time. You can check the current schedule in the calendar.'
      },
      {
        question: 'How many revisions are included?',
        answer: 'Draft revisions are flexible until the direction is confirmed. Minor revisions after coloring are free, while major revisions may incur additional fees.'
      },
      {
        question: 'Which payment methods are supported?',
        answer: 'We support Alipay, WeChat Pay, bank transfer, and other commonly used payment methods.'
      },
      {
        question: 'Who owns the copyright?',
        answer: 'For personal commissions, usage rights belong to the client. Commercial use must be declared in advance and may require separate copyright fees.'
      }
    ]
  }
}

export default {
  name: 'Contact',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      contacts: [],
      faqs: []
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return CONTACT_CONTENT[this.locale]
    }
  },
  mounted() {
    this.applyLocaleContent(this.locale)
    window.addEventListener('locale-changed', this.handleLocaleChange)
  },
  beforeUnmount() {
    window.removeEventListener('locale-changed', this.handleLocaleChange)
  },
  methods: {
    handleLocaleChange(event) {
      this.applyLocaleContent(event.detail)
    },
    applyLocaleContent(locale) {
      const content = CONTACT_CONTENT[locale]
      this.contacts = content.contacts
      this.faqs = content.faqs
    }
  }
}
</script>

<style scoped>
.contact-section {
  padding: 60px 0;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

.contact-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px 30px;
  text-align: center;
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.contact-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 2rem;
  color: white;
}

.contact-card.qq .contact-icon { background: #12b7f5; }
.contact-card.xiaohongshu .contact-icon { background: #fe2c55; }
.contact-card.x .contact-icon { background: #000; }
.contact-card.bilibili .contact-icon { background: #00a1d6; }

.contact-card h3 {
  margin-bottom: 10px;
  color: var(--text-dark);
}

.contact-card p {
  color: var(--text-light);
  margin-bottom: 20px;
  font-size: 0.9rem;
  white-space: pre-line;
}

/* FAQ */
.faq-section {
  max-width: 800px;
  margin: 60px auto 0;
}

.faq-section h3 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.faq-list {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.faq-item {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.faq-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.faq-item h4 {
  color: #6b8e6b;
  margin-bottom: 10px;
}

.faq-item p {
  color: #666;
  margin: 0;
}
</style>
