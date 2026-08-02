<template>
  <div class="about-page">
    <header class="page-header fade-in">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="about-section">
      <div class="container">
        <div class="about-container">
          <aside class="about-sidebar">
            <button 
              v-for="section in sections" 
              :key="section.key"
              class="about-sidebar-btn"
              :class="{ active: activeSection === section.key }"
              @click="activeSection = section.key"
            >
              {{ section.label }}
            </button>
          </aside>

          <div class="about-content">
            <!-- 平台能力 -->
            <div v-if="activeSection === 'history'" class="about-content-section">
              <h3>{{ content.historyTitle }}</h3>
              <div class="timeline">
                <div v-for="(item, index) in history" :key="index" class="timeline-item">
                  <div class="date">{{ item.date }}</div>
                  <p><strong>{{ item.title }}</strong></p>
                  <p>{{ item.desc }}</p>
                </div>
              </div>
            </div>

            <!-- 平台原则 -->
            <div v-if="activeSection === 'philosophy'" class="about-content-section">
              <h3>{{ content.philosophyTitle }}</h3>
              <div v-for="(item, index) in philosophy" :key="index" style="margin-bottom: 20px;">
                <p><strong>{{ item.title }}</strong></p>
                <p>{{ item.desc }}</p>
              </div>
            </div>

            <!-- 参与角色 -->
            <div v-if="activeSection === 'team'" class="about-content-section">
              <h3>{{ content.teamTitle }}</h3>
              <div class="team-grid">
                <div v-for="(member, index) in team" :key="index" class="team-card">
                  <div class="team-avatar">
                    <component :is="member.icon" :size="32" aria-hidden="true" />
                  </div>
                  <h4>{{ member.name }}</h4>
                  <p>{{ member.role }}</p>
                </div>
              </div>
            </div>

            <!-- 服务范围 -->
            <div v-if="activeSection === 'services'" class="about-content-section">
              <h3>{{ content.servicesTitle }}</h3>
              <div v-for="(service, index) in services" :key="index" style="margin-bottom: 15px;">
                <p class="service-title">
                  <component :is="service.icon" :size="18" aria-hidden="true" />
                  <strong>{{ service.title }}</strong>
                </p>
                <p>{{ service.desc }}</p>
              </div>
            </div>

            <!-- 委托流程 -->
            <div v-if="activeSection === 'process'" class="about-content-section">
              <h3>{{ content.processTitle }}</h3>
              <div class="timeline">
                <div v-for="(step, index) in process" :key="index" class="timeline-item">
                  <div class="date">{{ stepLabel(index) }}</div>
                  <p><strong>{{ step.title }}</strong></p>
                  <p>{{ step.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { inject } from 'vue'
import {
  Brush,
  CircleUserRound,
  FileImage,
  Images,
  Palette,
  ScanFace,
  ShieldCheck,
  Sparkles
} from '@lucide/vue'

const ABOUT_CONTENT = {
  zh: {
    title: '关于平台',
    subtitle: '了解平台提供的委托协作能力与使用原则',
    historyTitle: '平台能力',
    philosophyTitle: '平台原则',
    teamTitle: '参与角色',
    servicesTitle: '常见委托类别',
    processTitle: '委托流程',
    sections: [
      { key: 'history', label: '平台能力' },
      { key: 'philosophy', label: '平台原则' },
      { key: 'team', label: '参与角色' },
      { key: 'services', label: '委托类别' },
      { key: 'process', label: '委托流程' }
    ],
    history: [
      { date: '需求', title: '结构化提交', desc: '委托人可以填写作品类型、预算、需求描述和参考资料，减少关键信息遗漏。' },
      { date: '协作', title: '订单与站内沟通', desc: '双方围绕订单查看状态、报价和进度，并通过站内会话保留沟通记录。' },
      { date: '交付', title: '受控文件交付', desc: '平台支持草稿、带水印预览和原图交付，原图下载权限会结合订单参与者与付款状态校验。' },
      { date: '管理', title: '审核与站点配置', desc: '管理员可以处理画师申请、用户和订单，并维护站点的基础展示信息。' }
    ],
    philosophy: [
      { title: '信息清楚', desc: '需求、报价、付款方式和交付内容应在确认合作前说明，重要变更通过订单或站内消息留痕。' },
      { title: '边界明确', desc: '创作周期、修改范围、版权和商用权限由委托双方根据具体项目确认，平台不替双方作统一承诺。' },
      { title: '隐私优先', desc: '公开订单查询只展示脱敏后的状态信息，详细需求、付款数据和附件仅向订单参与者与管理员开放。' }
    ],
    team: [
      { icon: CircleUserRound, name: '委托人', role: '提交需求、确认报价、跟踪订单并验收交付内容' },
      { icon: Palette, name: '画师', role: '维护接稿信息、评估需求、更新进度并提交交付物' },
      { icon: ShieldCheck, name: '管理员', role: '处理审核、站点配置及必要的平台管理工作' }
    ],
    services: [
      { icon: ScanFace, title: '头像绘制', desc: '可提交头像或半身像需求，具体风格、尺寸和使用范围由画师确认。' },
      { icon: Brush, title: '角色立绘', desc: '可提交角色造型、服装和配饰要求，并附上已有设定与参考图。' },
      { icon: Images, title: '场景插图', desc: '可描述人物、背景、构图和氛围需求，复杂度与交付规格以报价为准。' },
      { icon: FileImage, title: '角色设定', desc: '可提交角色设定图或设计文档需求，所含视图和细节需在订单中约定。' },
      { icon: Sparkles, title: '其他定制', desc: '其他视觉创作需求也可提交，由画师根据能力、排期和项目范围决定是否承接。' }
    ],
    process: [
      { title: '提交申请', desc: '填写委托申请表，详细描述需求并上传参考资料。' },
      { title: '评估与报价', desc: '画师查看需求后决定是否承接，并沟通范围、报价、周期和修改约定。' },
      { title: '确认合作', desc: '委托人确认报价；付款模式、金额和节点以双方在订单中的约定为准。' },
      { title: '创作与反馈', desc: '画师更新订单进度并提交草稿，双方通过站内消息确认反馈和必要修改。' },
      { title: '终稿交付', desc: '画师提交终稿；平台可提供带水印预览，并按订单权限开放原图下载。' }
    ],
    stepLabel: (index) => `第${index + 1}步`
  },
  en: {
    title: 'About the Platform',
    subtitle: 'Learn about the platform capabilities and collaboration principles',
    historyTitle: 'Platform Capabilities',
    philosophyTitle: 'Platform Principles',
    teamTitle: 'Participant Roles',
    servicesTitle: 'Common Commission Types',
    processTitle: 'Commission Process',
    sections: [
      { key: 'history', label: 'Capabilities' },
      { key: 'philosophy', label: 'Principles' },
      { key: 'team', label: 'Roles' },
      { key: 'services', label: 'Commission Types' },
      { key: 'process', label: 'Process' }
    ],
    history: [
      { date: 'Brief', title: 'Structured Requests', desc: 'Clients can provide the commission type, budget, description, and references so important details are less likely to be missed.' },
      { date: 'Work', title: 'Orders and On-site Chat', desc: 'Both parties can review order status, quotes, and progress while keeping communication tied to the order.' },
      { date: 'Files', title: 'Controlled Delivery', desc: 'The platform supports drafts, watermarked previews, and original files. Original downloads are checked against participant and payment permissions.' },
      { date: 'Admin', title: 'Review and Site Settings', desc: 'Administrators can process artist applications, manage users and orders, and maintain basic site presentation settings.' }
    ],
    philosophy: [
      { title: 'Keep Information Clear', desc: 'The scope, quote, payment mode, and deliverables should be discussed before confirmation, with important changes recorded in the order or on-site chat.' },
      { title: 'Define Boundaries', desc: 'Schedule, revision scope, copyright, and commercial rights are agreed for each project. The platform does not promise a single policy on behalf of both parties.' },
      { title: 'Protect Privacy', desc: 'Public order lookup only returns redacted progress. Detailed briefs, payment data, and attachments are restricted to participants and administrators.' }
    ],
    team: [
      { icon: CircleUserRound, name: 'Client', role: 'Submits requirements, confirms quotes, tracks orders, and reviews deliverables' },
      { icon: Palette, name: 'Artist', role: 'Maintains commission details, evaluates requests, updates progress, and delivers files' },
      { icon: ShieldCheck, name: 'Administrator', role: 'Handles reviews, site settings, and necessary platform administration' }
    ],
    services: [
      { icon: ScanFace, title: 'Avatar Art', desc: 'Submit an avatar or portrait request. The artist confirms the style, dimensions, and usage rights.' },
      { icon: Brush, title: 'Character Illustration', desc: 'Describe the character, outfit, and accessories, and attach any existing design references.' },
      { icon: Images, title: 'Scene Illustration', desc: 'Describe subjects, background, composition, and mood. Scope and output specifications follow the quote.' },
      { icon: FileImage, title: 'Character Design', desc: 'Request a character sheet or design document, with views and included details agreed in the order.' },
      { icon: Sparkles, title: 'Custom Requests', desc: 'Other visual work may be submitted for an artist to assess against their skills, schedule, and project scope.' }
    ],
    process: [
      { title: 'Submit Request', desc: 'Fill out the commission form, describe your requirements, and upload references.' },
      { title: 'Review and Quote', desc: 'The artist decides whether to accept and discusses scope, quote, schedule, and revision terms.' },
      { title: 'Confirm the Order', desc: 'The client accepts the quote. Payment mode, amount, and milestones follow the agreement recorded for the order.' },
      { title: 'Create and Review', desc: 'The artist updates progress and may submit a draft. Both parties coordinate feedback through on-site chat.' },
      { title: 'Final Delivery', desc: 'The artist submits the final work. The platform can show a watermarked preview and grants original-file access according to order permissions.' }
    ],
    stepLabel: (index) => `Step ${index + 1}`
  }
}

export default {
  name: 'About',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      activeSection: 'history',
      sections: [],
      history: [],
      philosophy: [],
      team: [],
      services: [],
      process: []
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return ABOUT_CONTENT[this.locale]
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
      const content = ABOUT_CONTENT[locale]
      this.sections = content.sections
      this.history = content.history
      this.philosophy = content.philosophy
      this.team = content.team
      this.services = content.services
      this.process = content.process
    },
    stepLabel(index) {
      return ABOUT_CONTENT[this.locale].stepLabel(index)
    }
  }
}
</script>

<style scoped>
.about-section {
  padding: 64px 0;
}

.about-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 64px;
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .about-section {
    padding: 32px 0;
  }

  .about-container {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

.about-sidebar {
  height: fit-content;
}

.about-sidebar-btn {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 1rem;
  color: var(--text-light);
  cursor: pointer;
  border-radius: var(--radius);
  transition: var(--transition);
  margin-bottom: 4px;
}

.about-sidebar-btn:hover {
  background: #F5F5F5;
  color: var(--text-dark);
}

.about-sidebar-btn.active {
  background: #F5F5F5;
  color: var(--text-dark);
  font-weight: 600;
}

.about-content {
  min-height: 400px;
}

.about-content-section h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-dark);
}

.about-content-section p {
  margin-bottom: 15px;
  color: var(--text-light);
  line-height: 1.8;
}

.timeline-item {
  margin-bottom: 32px;
}

.timeline-item .date {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.team-card {
  text-align: center;
  padding: 24px 20px;
  background: #F5F5F5;
  border-radius: var(--radius);
}

.team-avatar {
  width: 72px;
  height: 72px;
  background: var(--white);
  border-radius: 50%;
  margin: 0 auto 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dark);
}

.service-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-title svg {
  flex: 0 0 auto;
  color: var(--text-dark);
}

.team-card h4 {
  margin-bottom: 5px;
}

.team-card p {
  color: var(--text-light);
  font-size: 0.9rem;
  margin: 0;
}
</style>
