<template>
  <div class="contact-page">
    <header class="page-header fade-in">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="contact-section fade-in">
      <div class="container">
        <div class="contact-grid">
          <div v-for="contact in contacts" :key="contact.key" :class="['contact-card', contact.key]">
            <div class="contact-icon">
              <FilePlus2 v-if="contact.key === 'commission'" :size="32" aria-hidden="true" />
              <MessageCircle v-else :size="32" aria-hidden="true" />
            </div>
            <h3>{{ contact.name }}</h3>
            <p>{{ contact.desc }}</p>
            <router-link :to="contact.route" class="btn btn-outline">{{ contact.btnText }}</router-link>
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
import { FilePlus2, MessageCircle } from '@lucide/vue'

const CONTACT_CONTENT = {
  zh: {
    title: '联系我们',
    subtitle: '从委托需求到订单沟通，都可以直接在站内完成',
    faqTitle: '常见问题',
    contacts: [
      {
        key: 'commission',
        name: '提交委托',
        desc: '填写创作需求、预算和期望时间\n创建可追踪的正式委托',
        route: '/commission',
        btnText: '发起委托'
      },
      {
        key: 'chat',
        name: '订单沟通',
        desc: '围绕已有委托发送消息和附件\n沟通记录与订单关联保存',
        route: '/chat',
        btnText: '进入沟通'
      }
    ],
    faqs: [
      {
        question: '委托需要提前多久预约？',
        answer: '交付时间由画师结合当前工作量和需求复杂度确认。提交委托时请填写期望时间，并以订单中的最终约定为准。'
      },
      {
        question: '可以修改多少次？',
        answer: '修改范围和次数以订单约定为准。建议在确认委托前写清要求，并在订单沟通中保留变更记录。'
      },
      {
        question: '支持哪些支付方式？',
        answer: '具体支付方式由委托双方确认。平台负责记录订单的报价、支付状态和交付进度，不会在未确认前代为承诺付款渠道。'
      },
      {
        question: '作品的版权归属？',
        answer: '版权和使用范围以委托双方的约定为准。涉及商业使用、转载或二次授权时，请在下单前明确写入需求。'
      }
    ]
  },
  en: {
    title: 'Contact',
    subtitle: 'Submit a request and keep order conversations together on the platform',
    faqTitle: 'FAQ',
    contacts: [
      {
        key: 'commission',
        name: 'Submit a Commission',
        desc: 'Describe your requirements, budget, and timeline\nCreate a request you can track',
        route: '/commission',
        btnText: 'Start Commission'
      },
      {
        key: 'chat',
        name: 'Order Conversation',
        desc: 'Send messages and attachments for an existing request\nKeep the discussion linked to the order',
        route: '/chat',
        btnText: 'Open Conversations'
      }
    ],
    faqs: [
      {
        question: 'How far in advance should I book a commission?',
        answer: 'The artist confirms delivery timing based on current workload and request complexity. Include your preferred date when submitting and rely on the final order agreement.'
      },
      {
        question: 'How many revisions are included?',
        answer: 'Revision scope and limits depend on the order agreement. Confirm them before work begins and keep later changes in the order conversation.'
      },
      {
        question: 'Which payment methods are supported?',
        answer: 'The artist and client confirm the payment method together. The platform records quotes, payment status, and delivery progress but does not promise a payment channel in advance.'
      },
      {
        question: 'Who owns the copyright?',
        answer: 'Copyright and usage rights follow the agreement between the artist and client. Declare commercial use, redistribution, or sublicensing before placing the order.'
      }
    ]
  }
}

export default {
  name: 'Contact',
  components: { FilePlus2, MessageCircle },
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
  padding: 64px 0;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px;
  max-width: 760px;
  margin: 0 auto;
}

.contact-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 48px 32px;
  text-align: center;
  box-shadow: var(--shadow);
  transition: var(--transition), box-shadow 0.3s ease;
}

.contact-card:hover {
  box-shadow: var(--shadow-hover);
}

.contact-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: var(--text-dark);
}

.contact-card h3 {
  margin-bottom: 10px;
  color: var(--text-dark);
}

.contact-card p {
  color: var(--text-light);
  margin-bottom: 24px;
  font-size: 0.9rem;
  white-space: pre-line;
}

/* FAQ */
.faq-section {
  max-width: 720px;
  margin: 80px auto 0;
}

.faq-section h3 {
  text-align: center;
  margin-bottom: 40px;
  color: var(--text-dark);
}

.faq-item {
  margin-bottom: 32px;
}

.faq-item:last-child {
  margin-bottom: 0;
}

.faq-item h4 {
  color: var(--text-dark);
  margin-bottom: 10px;
}

.faq-item p {
  color: var(--text-light);
  margin: 0;
}

@media (max-width: 768px) {
  .contact-section {
    padding: 32px 0;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }

  .faq-section {
    margin-top: 64px;
  }
}
</style>
