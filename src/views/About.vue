<template>
  <div class="about-page">
    <header class="page-header">
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
            <!-- 工作室历史 -->
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

            <!-- 创作理念 -->
            <div v-if="activeSection === 'philosophy'" class="about-content-section">
              <h3>{{ content.philosophyTitle }}</h3>
              <div v-for="(item, index) in philosophy" :key="index" style="margin-bottom: 20px;">
                <p><strong>{{ item.title }}</strong></p>
                <p>{{ item.desc }}</p>
              </div>
            </div>

            <!-- 团队成员 -->
            <div v-if="activeSection === 'team'" class="about-content-section">
              <h3>{{ content.teamTitle }}</h3>
              <div class="team-grid">
                <div v-for="(member, index) in team" :key="index" class="team-card">
                  <div class="team-avatar">{{ member.icon }}</div>
                  <h4>{{ member.name }}</h4>
                  <p>{{ member.role }}</p>
                </div>
              </div>
            </div>

            <!-- 服务范围 -->
            <div v-if="activeSection === 'services'" class="about-content-section">
              <h3>{{ content.servicesTitle }}</h3>
              <div v-for="(service, index) in services" :key="index" style="margin-bottom: 15px;">
                <p><strong>{{ service.icon }} {{ service.title }}</strong></p>
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

const ABOUT_CONTENT = {
  zh: {
    title: '关于我们',
    subtitle: '了解FUREST工作室的故事与理念',
    historyTitle: '工作室历史',
    philosophyTitle: '创作理念',
    teamTitle: '团队成员',
    servicesTitle: '服务范围',
    processTitle: '委托流程',
    sections: [
      { key: 'history', label: '工作室历史' },
      { key: 'philosophy', label: '创作理念' },
      { key: 'team', label: '团队成员' },
      { key: 'services', label: '服务范围' },
      { key: 'process', label: '委托流程' }
    ],
    history: [
      { date: '2023年', title: '工作室成立', desc: 'FUREST工作室正式成立，由一群热爱绘画的创作者组建。初期主要承接个人头像和Q版插画委托。' },
      { date: '2024年', title: '业务扩展', desc: '业务范围扩展至立绘、插图、角色设计等领域。与多个独立游戏团队建立合作关系。' },
      { date: '2025年', title: '团队壮大', desc: '团队规模扩大至10人，涵盖原画、插画、UI设计等专业人才。作品在社交媒体上获得广泛关注。' },
      { date: '2026年', title: '品牌升级', desc: '推出全新品牌形象，建立专业约稿平台。致力于为更多创作者和客户提供优质的委托服务。' }
    ],
    philosophy: [
      { title: '用心创作，传递情感', desc: '我们相信每一幅作品都承载着创作者的心血和委托人的期待。在FUREST，我们不只是完成订单，更是用心理解每个角色的故事，用画笔传递情感。' },
      { title: '精益求精，追求卓越', desc: '从构图到配色，从线条到光影，我们追求每一个细节的完美。不断学习和探索新的技法，只为呈现最好的作品。' },
      { title: '真诚沟通，合作共赢', desc: '透明的沟通是合作的基础。我们重视每一位委托人的意见，通过充分的交流确保作品符合期待，实现创作者与委托人的共赢。' }
    ],
    team: [
      { icon: '🎨', name: '主创画师', role: '10年绘画经验，擅长日系风格' },
      { icon: '✏️', name: '角色设计师', role: '专注角色设定与立绘' },
      { icon: '🖼️', name: '场景插画师', role: '擅长氛围场景与背景绘制' },
      { icon: '💼', name: '项目管理', role: '负责排单与客户沟通' }
    ],
    services: [
      { icon: '🎭', title: '头像绘制', desc: 'Q版、写实、半写实等多种风格，适用于社交媒体头像、个人形象展示等。' },
      { icon: '👤', title: '角色立绘', desc: '完整的角色设计，包含精细的服装、配饰刻画，适用于游戏、Vtuber等。' },
      { icon: '🖼️', title: '场景插图', desc: '含背景的完整插画，氛围感强，适用于小说封面、游戏宣传、壁纸等。' },
      { icon: '📋', title: '角色设定', desc: '包含三视图、细节设定的完整角色设计文档，适用于原创IP开发。' },
      { icon: '🎨', title: '其他定制', desc: '欢迎提出特殊需求，我们将根据项目复杂度提供定制报价。' }
    ],
    process: [
      { title: '提交申请', desc: '填写委托申请表，详细描述需求并上传参考资料。' },
      { title: '确认沟通', desc: '我们会在24小时内回复，确认需求细节和报价。' },
      { title: '支付定金', desc: '确认委托后支付50%定金，进入排单队列。' },
      { title: '草稿确认', desc: '提供草图供确认，可修改至满意为止。' },
      { title: '成图交付', desc: '完成作品后提供带水印预览，支付尾款后交付原图。' }
    ],
    stepLabel: (index) => `第${index + 1}步`
  },
  en: {
    title: 'About',
    subtitle: 'Learn about the story and values behind FUREST Studio',
    historyTitle: 'Studio History',
    philosophyTitle: 'Creative Philosophy',
    teamTitle: 'Team',
    servicesTitle: 'Services',
    processTitle: 'Commission Process',
    sections: [
      { key: 'history', label: 'History' },
      { key: 'philosophy', label: 'Philosophy' },
      { key: 'team', label: 'Team' },
      { key: 'services', label: 'Services' },
      { key: 'process', label: 'Process' }
    ],
    history: [
      { date: '2023', title: 'Studio Founded', desc: 'FUREST Studio was founded by a group of artists passionate about illustration. In the early stage, the studio focused on personal avatars and chibi commission work.' },
      { date: '2024', title: 'Business Expansion', desc: 'The studio expanded into character art, illustration, and design work, and began collaborating with multiple indie game teams.' },
      { date: '2025', title: 'Team Growth', desc: 'The team grew to 10 members covering concept art, illustration, and UI design. The studio gained broad attention across social media.' },
      { date: '2026', title: 'Brand Upgrade', desc: 'FUREST launched a refreshed brand identity and built a dedicated commission platform to serve more creators and clients.' }
    ],
    philosophy: [
      { title: 'Create with Care, Convey Emotion', desc: 'We believe every artwork carries both the creator’s effort and the client’s expectations. At FUREST, we do more than fulfill orders. We understand each character’s story and express it through illustration.' },
      { title: 'Pursue Excellence in Every Detail', desc: 'From composition and color to linework and lighting, we aim for quality in every detail. We keep learning and refining our craft to deliver the strongest result possible.' },
      { title: 'Communicate Honestly, Collaborate Well', desc: 'Transparent communication is the foundation of good collaboration. We value every client’s input and rely on clear discussion to align expectations and outcomes.' }
    ],
    team: [
      { icon: '🎨', name: 'Lead Illustrator', role: '10 years of drawing experience with a strong anime style focus' },
      { icon: '✏️', name: 'Character Designer', role: 'Specialized in character concept work and full-body illustrations' },
      { icon: '🖼️', name: 'Scene Illustrator', role: 'Focused on atmospheric scenes and environment painting' },
      { icon: '💼', name: 'Project Manager', role: 'Handles scheduling and client communication' }
    ],
    services: [
      { icon: '🎭', title: 'Avatar Art', desc: 'Chibi, realistic, and semi-realistic styles for profile pictures and personal branding.' },
      { icon: '👤', title: 'Character Illustration', desc: 'Full character artwork with refined costume and accessory details for games, Vtubers, and more.' },
      { icon: '🖼️', title: 'Scene Illustration', desc: 'Full illustrations with background and atmosphere for covers, promotions, and wallpapers.' },
      { icon: '📋', title: 'Character Design', desc: 'Detailed character sheets with turnarounds and design notes for original IP development.' },
      { icon: '🎨', title: 'Custom Requests', desc: 'If you have a special request, we can provide a custom quote based on scope and complexity.' }
    ],
    process: [
      { title: 'Submit Request', desc: 'Fill out the commission form, describe your requirements, and upload references.' },
      { title: 'Confirm Details', desc: 'We will reply within 24 hours to confirm scope, details, and quotation.' },
      { title: 'Pay Deposit', desc: 'After confirmation, pay a 50% deposit to enter the queue.' },
      { title: 'Review Draft', desc: 'A draft will be provided for review and can be revised before rendering is finalized.' },
      { title: 'Final Delivery', desc: 'After completion, a watermarked preview is provided. The full-resolution file is delivered after final payment.' }
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
  padding: 60px 0;
}

.about-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 40px;
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .about-container {
    grid-template-columns: 1fr;
  }
}

.about-sidebar {
  background: var(--white);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  height: fit-content;
}

.about-sidebar-btn {
  display: block;
  width: 100%;
  padding: 15px 20px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition);
  margin-bottom: 5px;
}

.about-sidebar-btn:hover,
.about-sidebar-btn.active {
  background: var(--primary-color);
  color: var(--white);
}

.about-content {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px;
  box-shadow: var(--shadow);
  min-height: 400px;
}

.about-content-section h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--primary-color);
}

.about-content-section p {
  margin-bottom: 15px;
  color: var(--text-light);
  line-height: 1.8;
}

.timeline {
  position: relative;
  padding-left: 30px;
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
  margin-bottom: 30px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -34px;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary-color);
}

.timeline-item .date {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 5px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.team-card {
  text-align: center;
  padding: 20px;
  background: #faf8f5;
  border-radius: 12px;
}

.team-avatar {
  width: 80px;
  height: 80px;
  background: var(--primary-color);
  border-radius: 50%;
  margin: 0 auto 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
}

.team-card h4 {
  margin-bottom: 5px;
}

.team-card p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}
</style>
