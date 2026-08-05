<template>
  <div class="admin-pages">
    <div class="section-heading">
      <div>
        <span class="section-index">08</span>
        <h2>{{ copy.title }}</h2>
        <p>{{ copy.hint }}</p>
      </div>
    </div>

    <div v-if="loading" class="inline-state">{{ copy.loading }}</div>
    <div v-else-if="error" class="inline-state error-state">
      <p>{{ error }}</p>
      <button type="button" class="text-button" @click="load">{{ copy.retry }}</button>
    </div>

    <template v-else>
      <!-- 动态页（platform_blog） -->
      <section class="page-block">
        <header class="block-header">
          <div>
            <h3>{{ copy.blogTitle }}</h3>
            <p>{{ copy.blogHint }}</p>
          </div>
          <div class="locale-switch">
            <button
              v-for="option in localeOptions"
              :key="option.key"
              type="button"
              :class="['locale-button', { active: blogLocale === option.key }]"
              @click="switchBlogLocale(option.key)"
            >
              {{ option.label }}
            </button>
          </div>
        </header>

        <div class="tabs-editor">
          <h4>{{ copy.tabsLabel }}</h4>
          <div class="tab-label-row" v-for="tab in editableTabs" :key="tab.key">
            <span class="tab-key">{{ tab.key }}</span>
            <input v-model.trim="tab.label" type="text" maxlength="20">
          </div>
        </div>

        <div class="posts-editor">
          <div class="posts-header">
            <h4>{{ copy.postsLabel }}</h4>
            <button v-if="!postForm" type="button" class="btn-search add-post-button" @click="startAddPost">
              {{ copy.addPost }}
            </button>
          </div>

          <form v-if="postForm" class="post-form" @submit.prevent="savePost">
            <h4>{{ postForm.index === null ? copy.addPost : copy.editPost }}</h4>
            <div class="form-row">
              <div class="form-group">
                <label>{{ copy.fieldTitle }}</label>
                <input v-model.trim="postForm.data.title" type="text" maxlength="100" required>
              </div>
              <div class="form-group">
                <label>{{ copy.fieldCategory }}</label>
                <select v-model="postForm.data.categoryKey">
                  <option v-for="tab in editableTabs" :key="tab.key" :value="tab.key">{{ tab.label || tab.key }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>{{ copy.fieldDate }}</label>
                <input v-model="postForm.data.date" type="date" required>
              </div>
              <div class="form-group">
                <label>{{ copy.fieldAuthor }}</label>
                <input v-model.trim="postForm.data.author" type="text" maxlength="50">
              </div>
            </div>
            <div class="form-group">
              <label>{{ copy.fieldImage }}</label>
              <input v-model.trim="postForm.data.image" type="text" maxlength="500" placeholder="https://">
            </div>
            <div class="form-group">
              <label>{{ copy.fieldExcerpt }}</label>
              <textarea v-model.trim="postForm.data.excerpt" rows="2" maxlength="300"></textarea>
            </div>
            <div class="form-group">
              <label>{{ copy.fieldContent }}</label>
              <textarea v-model="postForm.data.content" rows="6"></textarea>
            </div>
            <p v-if="postFormError" class="form-error" role="alert">{{ postFormError }}</p>
            <div class="post-form-actions">
              <button type="button" class="btn-clear" @click="cancelPostForm">{{ copy.cancel }}</button>
              <button type="submit" class="btn-search">{{ copy.confirm }}</button>
            </div>
          </form>

          <div v-if="currentBlog.posts.length" class="post-list">
            <div v-for="(post, index) in currentBlog.posts" :key="post.id" class="post-item">
              <div class="post-item-info">
                <strong>{{ post.title }}</strong>
                <span>{{ tabLabel(post.categoryKey) }} · {{ post.date }}<template v-if="post.author"> · {{ post.author }}</template></span>
              </div>
              <div class="post-item-actions">
                <button type="button" class="text-button" @click="startEditPost(post, index)">{{ copy.edit }}</button>
                <button type="button" class="text-button danger" @click="deletePost(index)">{{ copy.delete }}</button>
              </div>
            </div>
          </div>
          <div v-else class="inline-state">{{ copy.emptyPosts }}</div>
        </div>

        <div class="block-actions">
          <button type="button" class="btn btn-primary compact-button" :disabled="savingBlog" @click="saveBlog">
            {{ savingBlog ? copy.saving : copy.saveSection }}
          </button>
        </div>
      </section>

      <!-- 关于页（platform_about） -->
      <section class="page-block">
        <header class="block-header">
          <div>
            <h3>{{ copy.aboutTitle }}</h3>
            <p>{{ copy.jsonHint }}</p>
          </div>
          <button type="button" class="btn-clear" @click="restoreDefault('about')">{{ copy.restoreDefault }}</button>
        </header>
        <textarea v-model="aboutText" class="json-editor" rows="16" spellcheck="false"></textarea>
        <p v-if="aboutError" class="form-error" role="alert">{{ aboutError }}</p>
        <div class="block-actions">
          <button type="button" class="btn btn-primary compact-button" :disabled="savingAbout" @click="saveJson('about')">
            {{ savingAbout ? copy.saving : copy.saveSection }}
          </button>
        </div>
      </section>

      <!-- 联系页（platform_contact） -->
      <section class="page-block">
        <header class="block-header">
          <div>
            <h3>{{ copy.contactTitle }}</h3>
            <p>{{ copy.jsonHint }}</p>
          </div>
          <button type="button" class="btn-clear" @click="restoreDefault('contact')">{{ copy.restoreDefault }}</button>
        </header>
        <textarea v-model="contactText" class="json-editor" rows="16" spellcheck="false"></textarea>
        <p v-if="contactError" class="form-error" role="alert">{{ contactError }}</p>
        <div class="block-actions">
          <button type="button" class="btn btn-primary compact-button" :disabled="savingContact" @click="saveJson('contact')">
            {{ savingContact ? copy.saving : copy.saveSection }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS } from '../../config/api'
import { apiRequest, showToast } from '../../utils/eventBus'

// 默认动态页内容（与 src/views/Blog.vue 的 BLOG_CONTENT 结构一致，category 展示名由 tabs 派生）
const DEFAULT_BLOG = {
  zh: {
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

// 默认关于页内容（与 src/views/About.vue 的 ABOUT_CONTENT 一致；icon 组件与 stepLabel 函数不可 JSON 化，
// 前台渲染时会按索引从内置默认内容回填图标，stepLabel 始终使用内置实现）
const DEFAULT_ABOUT = {
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
      { name: '委托人', role: '提交需求、确认报价、跟踪订单并验收交付内容' },
      { name: '画师', role: '维护接稿信息、评估需求、更新进度并提交交付物' },
      { name: '管理员', role: '处理审核、站点配置及必要的平台管理工作' }
    ],
    services: [
      { title: '头像绘制', desc: '可提交头像或半身像需求，具体风格、尺寸和使用范围由画师确认。' },
      { title: '角色立绘', desc: '可提交角色造型、服装和配饰要求，并附上已有设定与参考图。' },
      { title: '场景插图', desc: '可描述人物、背景、构图和氛围需求，复杂度与交付规格以报价为准。' },
      { title: '角色设定', desc: '可提交角色设定图或设计文档需求，所含视图和细节需在订单中约定。' },
      { title: '其他定制', desc: '其他视觉创作需求也可提交，由画师根据能力、排期和项目范围决定是否承接。' }
    ],
    process: [
      { title: '提交申请', desc: '填写委托申请表，详细描述需求并上传参考资料。' },
      { title: '评估与报价', desc: '画师查看需求后决定是否承接，并沟通范围、报价、周期和修改约定。' },
      { title: '确认合作', desc: '委托人确认报价；付款模式、金额和节点以双方在订单中的约定为准。' },
      { title: '创作与反馈', desc: '画师更新订单进度并提交草稿，双方通过站内消息确认反馈和必要修改。' },
      { title: '终稿交付', desc: '画师提交终稿；平台可提供带水印预览，并按订单权限开放原图下载。' }
    ]
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
      { name: 'Client', role: 'Submits requirements, confirms quotes, tracks orders, and reviews deliverables' },
      { name: 'Artist', role: 'Maintains commission details, evaluates requests, updates progress, and delivers files' },
      { name: 'Administrator', role: 'Handles reviews, site settings, and necessary platform administration' }
    ],
    services: [
      { title: 'Avatar Art', desc: 'Submit an avatar or portrait request. The artist confirms the style, dimensions, and usage rights.' },
      { title: 'Character Illustration', desc: 'Describe the character, outfit, and accessories, and attach any existing design references.' },
      { title: 'Scene Illustration', desc: 'Describe subjects, background, composition, and mood. Scope and output specifications follow the quote.' },
      { title: 'Character Design', desc: 'Request a character sheet or design document, with views and included details agreed in the order.' },
      { title: 'Custom Requests', desc: 'Other visual work may be submitted for an artist to assess against their skills, schedule, and project scope.' }
    ],
    process: [
      { title: 'Submit Request', desc: 'Fill out the commission form, describe your requirements, and upload references.' },
      { title: 'Review and Quote', desc: 'The artist decides whether to accept and discusses scope, quote, schedule, and revision terms.' },
      { title: 'Confirm the Order', desc: 'The client accepts the quote. Payment mode, amount, and milestones follow the agreement recorded for the order.' },
      { title: 'Create and Review', desc: 'The artist updates progress and may submit a draft. Both parties coordinate feedback through on-site chat.' },
      { title: 'Final Delivery', desc: 'The artist submits the final work. The platform can show a watermarked preview and grants original-file access according to order permissions.' }
    ]
  }
}

// 默认联系页内容（与 src/views/Contact.vue 的 CONTACT_CONTENT 一致）
const DEFAULT_CONTACT = {
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

const clone = (value) => JSON.parse(JSON.stringify(value))

const CONTENT = {
  zh: {
    title: '页面内容', hint: '编辑动态、关于、联系三个公开页面的展示内容',
    loading: '加载中...', retry: '重新加载',
    blogTitle: '动态页内容', blogHint: '编辑创作动态页的分类标签与文章，分语言维护',
    localeZh: '中文内容', localeEn: '英文内容',
    tabsLabel: '分类标签', postsLabel: '文章列表', addPost: '新增文章', editPost: '编辑文章', emptyPosts: '当前语言下还没有文章。',
    fieldTitle: '标题', fieldCategory: '分类', fieldDate: '日期', fieldAuthor: '作者', fieldImage: '封面图地址', fieldExcerpt: '摘要', fieldContent: '正文（支持 HTML）',
    confirm: '确定', cancel: '取消', edit: '编辑', delete: '删除', confirmDeletePost: '确定删除这篇文章吗？', titleRequired: '请填写文章标题',
    aboutTitle: '关于页内容', contactTitle: '联系页内容', jsonHint: 'JSON 格式，结构为 { zh: {...}, en: {...} }',
    invalidJson: 'JSON 格式错误：', restoreDefault: '恢复默认内容', confirmRestore: '确定用内置默认内容覆盖当前编辑内容吗？（尚未保存的修改会丢失）',
    saveSection: '保存该板块', saving: '保存中...', saved: '已保存'
  },
  en: {
    title: 'Pages', hint: 'Edit the public Blog, About and Contact page content',
    loading: 'Loading...', retry: 'Try again',
    blogTitle: 'Blog Page', blogHint: 'Edit category tabs and posts, maintained per language',
    localeZh: 'Chinese', localeEn: 'English',
    tabsLabel: 'Category Tabs', postsLabel: 'Posts', addPost: 'Add Post', editPost: 'Edit Post', emptyPosts: 'No posts in this language yet.',
    fieldTitle: 'Title', fieldCategory: 'Category', fieldDate: 'Date', fieldAuthor: 'Author', fieldImage: 'Cover image URL', fieldExcerpt: 'Excerpt', fieldContent: 'Content (HTML allowed)',
    confirm: 'Apply', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', confirmDeletePost: 'Delete this post?', titleRequired: 'Please enter a post title.',
    aboutTitle: 'About Page', contactTitle: 'Contact Page', jsonHint: 'JSON format with the shape { zh: {...}, en: {...} }',
    invalidJson: 'Invalid JSON: ', restoreDefault: 'Restore defaults', confirmRestore: 'Replace the current editor content with the built-in defaults? (Unsaved changes will be lost)',
    saveSection: 'Save Section', saving: 'Saving...', saved: 'Saved.'
  }
}

function emptyPost() {
  return { id: null, categoryKey: 'notice', title: '', excerpt: '', content: '', image: '', date: '', author: '' }
}

export default {
  name: 'AdminPages',
  setup() { return { i18n: inject('i18n') } },
  data() {
    return {
      loading: false, error: '', extraConfig: {},
      blogLocale: 'zh',
      blogData: { zh: clone(DEFAULT_BLOG.zh), en: clone(DEFAULT_BLOG.en) },
      postForm: null, postFormError: '', savingBlog: false,
      aboutText: '', aboutError: '', savingAbout: false,
      contactText: '', contactError: '', savingContact: false
    }
  },
  computed: {
    locale() { return this.i18n.getLocale() },
    copy() { return CONTENT[this.locale] },
    localeOptions() {
      return [
        { key: 'zh', label: this.copy.localeZh },
        { key: 'en', label: this.copy.localeEn }
      ]
    },
    currentBlog() { return this.blogData[this.blogLocale] },
    // 「全部」标签固定使用内置文案，只允许编辑 4 个分类标签
    editableTabs() {
      return (this.currentBlog.tabs || []).filter(tab => tab.key !== 'all')
    }
  },
  mounted() { this.load() },
  methods: {
    async load() {
      this.loading = true
      this.error = ''
      try {
        const data = await apiRequest(API_ENDPOINTS.ADMIN_SITE_CONFIG, { showError: false })
        const extra = (data && typeof data.extra_config === 'object' && data.extra_config) || {}
        this.extraConfig = extra
        for (const key of ['zh', 'en']) {
          const stored = extra.platform_blog?.[key]
          this.blogData[key] = {
            tabs: Array.isArray(stored?.tabs) && stored.tabs.length ? clone(stored.tabs) : clone(DEFAULT_BLOG[key].tabs),
            posts: Array.isArray(stored?.posts) ? clone(stored.posts) : clone(DEFAULT_BLOG[key].posts)
          }
        }
        this.aboutText = JSON.stringify(extra.platform_about || DEFAULT_ABOUT, null, 2)
        this.contactText = JSON.stringify(extra.platform_contact || DEFAULT_CONTACT, null, 2)
      } catch (error) { this.error = error.message } finally { this.loading = false }
    },
    // extra_config 为整对象写入：先重新 GET，合并本次的 key 后整体 PATCH
    async saveExtraKey(key, value) {
      const data = await apiRequest(API_ENDPOINTS.ADMIN_SITE_CONFIG, { showError: false })
      const extra = { ...((data && typeof data.extra_config === 'object' && data.extra_config) || {}) }
      extra[key] = value
      await apiRequest(API_ENDPOINTS.ADMIN_SITE_CONFIG, { method: 'PATCH', body: { extra_config: extra } })
      this.extraConfig = extra
      showToast(this.copy.saved, 'success')
    },
    switchBlogLocale(locale) {
      if (this.postForm) return
      this.blogLocale = locale
    },
    tabLabel(categoryKey) {
      const tab = (this.currentBlog.tabs || []).find(item => item.key === categoryKey)
      return tab?.label || categoryKey
    },
    startAddPost() {
      this.postFormError = ''
      this.postForm = { index: null, data: { ...emptyPost(), date: new Date().toISOString().slice(0, 10) } }
    },
    startEditPost(post, index) {
      this.postFormError = ''
      this.postForm = { index, data: { ...emptyPost(), ...clone(post) } }
    },
    cancelPostForm() {
      this.postForm = null
      this.postFormError = ''
    },
    savePost() {
      const form = this.postForm
      if (!form) return
      if (!form.data.title) {
        this.postFormError = this.copy.titleRequired
        return
      }
      const posts = this.currentBlog.posts
      if (form.index === null) {
        const maxId = posts.reduce((max, post) => Math.max(max, Number(post.id) || 0), 0)
        posts.unshift({ ...form.data, id: maxId + 1 })
      } else {
        posts.splice(form.index, 1, { ...form.data, id: posts[form.index]?.id ?? form.data.id })
      }
      this.cancelPostForm()
    },
    deletePost(index) {
      if (!window.confirm(this.copy.confirmDeletePost)) return
      this.currentBlog.posts.splice(index, 1)
    },
    async saveBlog() {
      this.savingBlog = true
      try {
        await this.saveExtraKey('platform_blog', clone(this.blogData))
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.savingBlog = false }
    },
    restoreDefault(which) {
      if (!window.confirm(this.copy.confirmRestore)) return
      if (which === 'about') {
        this.aboutText = JSON.stringify(DEFAULT_ABOUT, null, 2)
        this.aboutError = ''
      } else {
        this.contactText = JSON.stringify(DEFAULT_CONTACT, null, 2)
        this.contactError = ''
      }
    },
    async saveJson(which) {
      const isAbout = which === 'about'
      const raw = isAbout ? this.aboutText : this.contactText
      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch (error) {
        if (isAbout) this.aboutError = this.copy.invalidJson + error.message
        else this.contactError = this.copy.invalidJson + error.message
        return
      }
      if (isAbout) {
        this.aboutError = ''
        this.savingAbout = true
      } else {
        this.contactError = ''
        this.savingContact = true
      }
      try {
        await this.saveExtraKey(isAbout ? 'platform_about' : 'platform_contact', parsed)
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally {
        if (isAbout) this.savingAbout = false
        else this.savingContact = false
      }
    }
  }
}
</script>

<style scoped>
.section-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.section-index { display: block; margin-bottom: 6px; color: var(--text-muted); font: 800 0.72rem/1 monospace; }
.section-heading h2 { margin: 0; font-size: 1.25rem; }
.section-heading p { margin: 5px 0 0; color: var(--text-muted); }
.page-block { padding: 28px 0; border-top: 1px solid #E5E7EB; }
.page-block:first-of-type { border-top: 0; padding-top: 0; }
.block-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 18px; }
.block-header h3 { margin: 0; font-size: 1.05rem; }
.block-header p { margin: 5px 0 0; color: var(--text-muted); font-size: 0.85rem; }
.locale-switch { display: flex; gap: 4px; }
.locale-button { min-height: 34px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: var(--radius); background: #fff; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: var(--transition); }
.locale-button.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
.tabs-editor, .posts-editor { margin-bottom: 20px; }
.tabs-editor h4, .posts-editor h4, .post-form h4 { margin: 0 0 12px; font-size: 0.9rem; }
.tab-label-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.tab-key { width: 80px; color: var(--text-muted); font: 0.8rem monospace; }
.tab-label-row input { flex: 1; max-width: 260px; height: 38px; padding: 0 12px; border: 1px solid #E5E7EB; border-radius: var(--radius); font: inherit; }
.tab-label-row input:focus { outline: none; border-color: var(--primary-color); }
.posts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.posts-header h4 { margin: 0; }
.add-post-button { min-height: 36px; }
.post-form { margin-bottom: 20px; padding: 18px; background: #FAFAFA; border: 1px solid #E5E7EB; border-radius: var(--radius); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 0.82rem; font-weight: 600; color: var(--text-dark); }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 9px 12px; border: 1px solid #E5E7EB; border-radius: var(--radius); font: inherit; background: #fff; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary-color); }
.form-group textarea { resize: vertical; }
.post-form-actions { display: flex; justify-content: flex-end; gap: 10px; }
.post-list { display: grid; gap: 8px; }
.post-item { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 14px; border: 1px solid #E5E7EB; border-radius: var(--radius); }
.post-item-info { min-width: 0; }
.post-item-info strong { display: block; font-size: 0.9rem; overflow-wrap: anywhere; }
.post-item-info span { color: var(--text-muted); font-size: 0.78rem; }
.post-item-actions { display: flex; gap: 12px; flex-shrink: 0; }
.text-button { border: 0; background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; transition: var(--transition); }
.text-button.danger { color: #B91C1C; }
.json-editor { width: 100%; padding: 14px; border: 1px solid #E5E7EB; border-radius: var(--radius); font: 0.82rem/1.6 monospace; resize: vertical; background: #FAFAFA; }
.json-editor:focus { outline: none; border-color: var(--primary-color); }
.block-actions { display: flex; justify-content: flex-end; margin-top: 14px; }
.compact-button { min-height: 42px; padding: 0 18px; border-radius: var(--radius); font-size: 0.9rem; }
.btn-search, .btn-clear { min-height: 40px; padding: 0 16px; border: 0; border-radius: var(--radius); font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.btn-search { background: var(--primary-color); color: #fff; }
.btn-clear { background: #F3F4F6; color: var(--text-light); }
.form-error { margin: 12px 0 0; padding: 11px 13px; background: #FEF2F2; color: #B91C1C; border-left: 3px solid #EF4444; overflow-wrap: anywhere; }
.inline-state { padding: 34px 18px; background: #FAFAFA; color: var(--text-muted); text-align: center; }
.inline-state p { margin: 0; }
.error-state { color: #B91C1C; }
@media (max-width: 620px) {
  .block-header, .section-heading { flex-direction: column; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
