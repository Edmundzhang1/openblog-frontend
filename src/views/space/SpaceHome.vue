<template>
  <div class="home">
    <!-- 按 sectionOrder 编排的主页模块 -->
    <template v-for="sectionKey in orderedHomeSections" :key="sectionKey">
    <!-- 轮播图 -->
    <section v-if="sectionKey === 'hero' && isModuleVisible('hero')" class="hero-section fade-in">
      <div class="container">
        <div class="carousel-container" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
          <div class="carousel" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
            <div v-for="(slide, index) in slides" :key="index" class="carousel-slide">
              <img :src="slide.image" :alt="slide.title" @error="handleImageError">
              <div class="carousel-overlay">
                <h2>{{ slide.title }}</h2>
                <p>{{ slide.desc }}</p>
                <div class="carousel-actions">
                  <router-link v-if="isModuleVisible('commission')" :to="`/@${currentSlug}/commission`" class="btn btn-primary">{{ content.ctaCommission }}</router-link>
                  <router-link :to="`/@${currentSlug}/gallery`" class="btn btn-secondary">{{ content.ctaGallery }}</router-link>
                </div>
              </div>
            </div>
          </div>
          <button class="carousel-btn prev" @click="prevSlide">‹</button>
          <button class="carousel-btn next" @click="nextSlide">›</button>
          <div class="carousel-dots">
            <span 
              v-for="(_, index) in slides" 
              :key="index"
              class="carousel-dot"
              :class="{ active: currentSlide === index }"
              @click="goToSlide(index)"
            ></span>
          </div>
        </div>
      </div>
    </section>

    <!-- 排单与日历 -->
    <!-- 空间主本人可见约稿日历（client/artist 都有，仅自己查看）；排单日历仅画师空间对外展示 -->
    <section v-if="sectionKey === 'calendar' && (isModuleVisible('calendar') || isModuleVisible('commission')) && (isSpaceOwner || isArtistSpace)" class="schedule-section">
      <div class="container">
        <!-- 画师本人：约稿日历/排单日历切换，一次只看一个 -->
        <div v-if="isArtistOwner" class="calendar-mode-toggle">
          <button :class="{ active: calendarMode === 'orders' }" @click="calendarMode = 'orders'">约稿日历</button>
          <button :class="{ active: calendarMode === 'schedule' }" @click="calendarMode = 'schedule'">排单日历</button>
        </div>
        <OrderCalendar v-if="isSpaceOwner && calendarMode === 'orders'" />
        <template v-if="!isSpaceOwner || calendarMode === 'schedule'">
        <div class="section-title">
          <h2>{{ content.scheduleTitle }}</h2>
          <p>{{ content.scheduleDesc }}</p>
        </div>
        <div class="schedule-container" :class="{ 'schedule-single': !isModuleVisible('calendar') || !isModuleVisible('commission') }">
          <!-- 日历 -->
          <div v-if="isModuleVisible('calendar')" class="calendar">
            <div class="calendar-header">
              <h3>{{ calendarTitle }}</h3>
              <div class="calendar-nav">
                <button @click="changeMonth(-1)">‹</button>
                <button @click="changeMonth(1)">›</button>
              </div>
            </div>
            <div class="calendar-grid">
              <div class="calendar-weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
              <div 
                v-for="(day, index) in calendarDays" 
                :key="index"
                class="calendar-day"
                :class="[
                  day.isOtherMonth ? 'other-month' : '',
                  day.isToday ? 'today' : '',
                  day.statusClass,
                  day.hasNote ? 'has-note' : '',
                  day.isAvailableDate ? 'available-date' : '',
                  day.isAvailableDateFull ? 'available-date-full' : ''
                ]"
                @click="!day.isOtherMonth && openTodoModal(day.dateStr)"
              >
                <span class="day-number">
                  <span v-if="day.hasNote" class="note-star">*</span>
                  {{ day.day }}
                </span>
                <!-- 🔥 可预约日期标记 -->
                <span v-if="day.isAvailableDate" class="available-marker">可</span>
                <span v-else-if="day.isAvailableDateFull" class="available-marker is-full">满</span>
                <div class="day-dots" v-if="day.dots.length > 0">
                  <span 
                    v-for="(dot, idx) in day.dots.slice(0, 5)" 
                    :key="idx" 
                    class="day-dot" 
                    :style="{ background: dot.color }"
                  ></span>
                </div>
                <span v-if="day.workload > 0" class="day-workload">{{ day.workload.toFixed(1) }}天</span>
              </div>
            </div>
          </div>
          
          <!-- 排单卡片 -->
          <div v-if="isModuleVisible('commission')" class="schedule-cards-container">
            <div class="schedule-card-wrapper">
              <transition name="card-fade" mode="out-in">
                <!-- 卡片1：当前排单情况 -->
                <div v-if="currentCard === 0" key="card1" class="schedule-card">
                  <div class="schedule-card-header">
                    <span>{{ cards.currentLabel }}</span>
                    <span class="status open">{{ cardConfig.queueStatus }}</span>
                  </div>
                  <h4>{{ currentScheduleTitle }}</h4>
                  <p>{{ cardConfig.queueDesc }}</p>
                  <div class="date-range">📅 {{ currentScheduleRange }}</div>
                </div>
                
                <!-- 卡片2：当月单主信息 -->
                <div v-else-if="currentCard === 1" key="card2" class="schedule-card">
                  <div class="schedule-card-header">
                    <span>{{ cards.clientsLabel }}</span>
                    <span class="status busy">{{ cards.clientsStatus }}</span>
                  </div>
                  <h4>{{ monthlyClientsTitle }}</h4>
                  <div v-if="monthlyClients.length > 0" class="clients-list">
                    <div v-for="(client, idx) in monthlyClients" :key="idx" class="client-item">
                      <span class="client-num">{{ idx + 1 }}</span>
                      <span class="client-name">{{ client.name }}</span>
                      <span class="client-style">{{ client.style }}</span>
                    </div>
                  </div>
                  <p v-else class="empty-text">{{ cards.clientsEmpty }}</p>
                  <div class="date-range">👥 {{ monthlyClientsTotal }}</div>
                </div>
                
                <!-- 卡片3：可预约日期 -->
                <div v-else key="card3" class="schedule-card">
                  <div class="schedule-card-header">
                    <span>{{ cards.availableLabel }}</span>
                    <span :class="['status', availableDates.length > 0 ? 'open' : 'closed']">
                      {{ cardConfig.bookingStatus }}
                    </span>
                  </div>
                  <h4>{{ availableDatesTitle }}</h4>
                  <p>{{ availableDatesDesc }}</p>
                  <div v-if="availableDates.length > 0" class="dates-list">
                    <div class="dates-tags">
                      <span v-for="date in availableDates.slice(0, 8)" :key="date" class="date-tag">
                        {{ date }}
                      </span>
                      <span v-if="availableDates.length > 8" class="date-tag more">+{{ availableDates.length - 8 }}</span>
                    </div>
                  </div>
                  <div class="date-range">📅 {{ availableDatesTotal }}</div>
                </div>
              </transition>
            </div>
            
            <div class="schedule-card-nav">
              <button @click="prevCard" :disabled="currentCard === 0">‹</button>
              <button @click="nextCard" :disabled="currentCard === 2">›</button>
            </div>
            <div class="schedule-dots">
              <span 
                v-for="index in 3" 
                :key="index"
                class="schedule-dot"
                :class="{ active: currentCard === index - 1 }"
                @click="goToCard(index - 1)"
              ></span>
            </div>
          </div>
        </div>
        </template>
      </div>
    </section>

    <!-- 画风展示 -->
    <section v-if="sectionKey === 'gallery' && isModuleVisible('gallery')" class="gallery-section">
      <div class="container">
        <div class="section-title">
          <h2>{{ content.galleryTitle }}</h2>
          <p>{{ content.galleryDesc }}</p>
        </div>
        <!-- 置顶作品 -->
        <div v-if="pinnedWork" class="pinned-work-card" @click="openLightbox(pinnedWork.image)">
          <span class="pinned-badge">{{ content.pinnedBadge }}</span>
          <img :src="pinnedWork.image" :alt="pinnedWork.title" @error="handleImageError">
          <div class="pinned-work-info">
            <h4>{{ pinnedWork.title }}</h4>
            <p>{{ pinnedWork.desc }}</p>
          </div>
        </div>
        <div class="style-tabs">
          <button
            v-for="tab in styleTabs"
            :key="tab.key"
            class="style-tab"
            :class="{ active: activeStyle === tab.key }"
            @click="activeStyle = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="masonry-grid" v-if="filteredGallery.length > 0">
          <div
            v-for="item in filteredGallery"
            :key="item.id"
            class="masonry-item"
            @click="openLightbox(item.image)"
          >
            <img :src="item.image" :alt="item.title">
            <div class="masonry-item-overlay">
              <h4>{{ item.title }}</h4>
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </div>
        <p v-else class="gallery-empty">{{ content.galleryEmpty }}</p>
      </div>
    </section>

    <!-- 动态 -->
    <section v-if="sectionKey === 'moments' && isModuleVisible('moments')" class="moments-section">
      <div class="container">
        <div class="section-title">
          <h2>{{ content.momentsTitle }}</h2>
          <p>{{ content.momentsDesc }}</p>
        </div>
        <div class="home-moments-list">
          <div v-if="pinnedMoment" class="home-moment-card is-pinned">
            <span class="pinned-badge">{{ content.pinnedBadge }}</span>
            <h4 v-if="pinnedMoment.title">{{ pinnedMoment.title }}</h4>
            <p>{{ pinnedMoment.content }}</p>
            <div v-if="pinnedMoment.images && pinnedMoment.images.length" class="home-moment-images">
              <img v-for="(img, idx) in pinnedMoment.images.slice(0, 3)" :key="idx" :src="img" @error="handleImageError">
            </div>
          </div>
          <div v-for="moment in recentMoments" :key="moment.id" class="home-moment-card">
            <h4 v-if="moment.title">{{ moment.title }}</h4>
            <p>{{ moment.content }}</p>
          </div>
          <p v-if="!pinnedMoment && recentMoments.length === 0" class="home-moments-empty">{{ content.momentsEmpty }}</p>
        </div>
      </div>
    </section>

    <!-- 自定义板块 -->
    <template v-if="sectionKey === 'custom'">
      <section v-for="cs in enabledCustomSections" :key="cs.id" class="custom-section-block">
        <div class="container">
          <div class="custom-section-card">
            <h2 v-if="cs.title" class="custom-section-title">{{ cs.title }}</h2>
            <div class="custom-section-content" v-html="sanitizeHTML(cs.content)"></div>
          </div>
        </div>
      </section>
    </template>
    </template>

    <!-- 排单详情弹窗（只读） -->
    <div class="todo-modal commission-modal" :class="{ active: showTodoModal }" @click.self="closeTodoModal">
      <div class="todo-modal-content">
        <div class="todo-modal-header">
          <h3>{{ todoModalTitle }}</h3>
          <button class="close-btn" @click="closeTodoModal">×</button>
        </div>
        <!-- 每日备注显示 -->
        <div v-if="hasDailyNote(selectedDate)" class="daily-note-display">
          <div class="daily-note-label">📝 画师留言</div>
          <div class="daily-note-content">{{ getDailyNote(selectedDate) }}</div>
        </div>
        
        <div class="commission-detail-list">
          <div v-if="getSelectedDateCommissions().length === 0 && !hasDailyNote(selectedDate)" class="empty-commissions">
            <div class="empty-icon">📅</div>
            <p>当日暂无排单和备注</p>
          </div>
          <div 
            v-for="commission in getSelectedDateCommissions()" 
            :key="commission.id"
            class="commission-detail-item"
          >
            <div class="commission-detail-header">
              <span 
                class="commission-tag" 
                :style="{ 
                  background: (getStyle(commission.styleId)?.color || '#ccc') + '20', 
                  color: getStyle(commission.styleId)?.color || '#666'
                }"
              >
                <span 
                  class="style-dot" 
                  :style="{ background: getStyle(commission.styleId)?.color || '#ccc' }"
                ></span>
                {{ getStyle(commission.styleId)?.name || '未知画风' }}
              </span>
              <span :class="['status-badge', commission.status]">
                {{ commission.status === 'completed' ? '已完成' : '进行中' }}
              </span>
            </div>
            <div class="commission-client">👤 {{ commission.clientName }}</div>
            <div class="commission-meta">
              <span>📦 {{ commission.quantity }}单</span>
              <span>⏱️ {{ (getStyle(commission.styleId)?.days || 0) * commission.quantity }}天</span>
            </div>
            <div v-if="commission.note" class="commission-note">📝 {{ commission.note }}</div>
          </div>
        </div>
        <!-- 仅空间主本人可见排期编辑入口，游客/访客只能查看 -->
        <div v-if="isSpaceOwner" class="modal-footer-hint">
          <router-link to="/todo" class="btn btn-primary btn-full">去排期管理编辑</router-link>
        </div>
      </div>
    </div>

    <!-- 快速导航（about/contact/commission 入口显隐由 modules 配置控制） -->
    <section v-if="quickNavs.length > 0" class="quick-nav-section">
      <div class="container">
        <div class="section-title">
          <h2>{{ content.quickNavTitle }}</h2>
          <p>{{ content.quickNavDesc }}</p>
        </div>
        <div class="quick-nav-grid">
          <router-link v-for="nav in quickNavs" :key="nav.path" :to="nav.path" class="quick-nav-card">
            <div class="quick-nav-icon">{{ nav.icon }}</div>
            <h3>{{ nav.title }}</h3>
            <p>{{ nav.desc }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <transition name="preview-home-dock">
      <div v-if="showPreviewExit" class="preview-home-dock">
        <div class="preview-home-panel">
          <span class="preview-home-label">预览模式</span>
          <button class="btn btn-primary preview-home-btn" @click="exitPreviewFromHome">
            退出预览
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { inject, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Calendar } from '../../utils/calendar'
import { eventBus, showToast } from '../../utils/eventBus'
import { getPersonalization, applyTheme, applyBackground, exitPreviewMode, isPreviewModeActive, sanitizeHTML, sanitizeCSS } from '../../utils/personalization.js'
import { getPublicSchedulesAPI } from '@/api/calendar.js'
import { getPublicArtStylesAPI, getPublicWorkloadAPI, getPublicMonthNotesAPI } from '@/api/todo.js'
import { getPublicWorksAPI, getPublicMomentsAPI } from '@/api/artist.js'
import { getPublicAvailableDatesAPI, getMyAvailableDatesAPI } from '@/api/availableDate.js'
import { HOME_IMAGES, IMAGES } from '../../config/assets.js'
import OrderCalendar from '../../components/OrderCalendar.vue'

const HOME_CONTENT = {
  zh: {
    ctaCommission: '委托申请',
    ctaGallery: '更多例图',
    scheduleTitle: '稿件排单日历',
    scheduleDesc: '点击查看日期添加待办事项，完成后可标记为已完成',
    todoTitle: '待办事项',
    todoPlaceholder: '添加新待办...',
    addTodo: '添加',
    galleryTitle: '画风展示',
    galleryDesc: '点击标签查看不同风格的示例作品',
    galleryEmpty: '暂无作品',
    momentsTitle: '最新动态',
    momentsDesc: '画师的近况与公告',
    momentsEmpty: '暂无动态',
    pinnedBadge: '📌 置顶',
    quickNavTitle: '快速导航',
    quickNavDesc: '了解更多关于我们的信息',
    imageFallbackText: '图片加载失败',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    cards: {
      currentLabel: '当前排单',
      currentStatus: '可接稿',
      currentTitle: '排单情况',
      currentSummaryPrefix: '目前还有',
      currentSummarySuffix: '个委托位空缺，预计完成时间7-10天/张。欢迎预约！',
      clientsLabel: '当月单主',
      clientsStatus: '进行中',
      clientsTitle: '委托客户',
      clientsEmpty: '本月暂无进行中的委托',
      clientsTotal: '共 {count} 位单主',
      availableLabel: '预约日期',
      availableStatus: '可预约',
      fullStatus: '已满',
      availableTitle: '可预约日期',
      availableEmpty: '目前日期已全部被申请，可预约下月档期',
      availableTotal: '剩余 {count} 个可预约日期'
    },
    styleNames: {
      avatar: '头像',
      character: '立绘',
      illustration: '插图',
      concept: '设定图'
    },
    slides: [
      {
        image: HOME_IMAGES.showcases.zh[0],
        title: '专业插画约稿服务',
        desc: '为您的创意提供完美的视觉呈现'
      },
      {
        image: HOME_IMAGES.showcases.zh[1],
        title: '多样化画风选择',
        desc: '头像、立绘、插图、设定图，满足您的各种需求'
      },
      {
        image: HOME_IMAGES.showcases.zh[2],
        title: '高效沟通，品质保证',
        desc: '透明的排单系统，实时追踪稿件进度'
      }
    ],
    styleTabs: [
      { key: 'all', label: '全部' },
      { key: 'avatar', label: '头像' },
      { key: 'character', label: '立绘' },
      { key: 'illustration', label: '插图' },
      { key: 'concept', label: '设定图' }
    ],
    galleryItems: HOME_IMAGES.artworks.zh,
    quickNavs: [
      { path: '/about', icon: '🏢', title: '关于我们', desc: '了解工作室的历史、理念和团队成员' },
      { path: '/contact', icon: '📧', title: '联系我们', desc: '通过QQ、小红书、X、Bilibili找到我们' },
      { path: '/commission', icon: '🎨', title: '委托指南', desc: '了解约稿流程、价格和注意事项' }
    ]
  },
  en: {
    ctaCommission: 'Start Commission',
    ctaGallery: 'More Samples',
    scheduleTitle: 'Commission Schedule Calendar',
    scheduleDesc: 'Click a date to add todos and mark them complete when finished',
    todoTitle: 'Todos',
    todoPlaceholder: 'Add a new todo...',
    addTodo: 'Add',
    galleryTitle: 'Style Gallery',
    galleryDesc: 'Switch tabs to browse sample works in different styles',
    galleryEmpty: 'No works yet',
    momentsTitle: 'Latest Moments',
    momentsDesc: 'Updates and announcements from the artist',
    momentsEmpty: 'No moments yet',
    pinnedBadge: '📌 Pinned',
    quickNavTitle: 'Quick Links',
    quickNavDesc: 'Learn more about the studio and commission process',
    imageFallbackText: 'Image Load Failed',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    cards: {
      currentLabel: 'Current Queue',
      currentStatus: 'Open',
      currentTitle: 'Queue Overview',
      currentSummaryPrefix: 'There are still ',
      currentSummarySuffix: ' commission slots available. Estimated turnaround is 7-10 days per piece.',
      clientsLabel: 'This Month\'s Clients',
      clientsStatus: 'In Progress',
      clientsTitle: 'Active Clients',
      clientsEmpty: 'No active commissions this month.',
      clientsTotal: '{count} active clients',
      availableLabel: 'Bookable Dates',
      availableStatus: 'Available',
      fullStatus: 'Full',
      availableTitle: 'Available Dates',
      availableEmpty: 'All current dates are booked. Please reserve next month\'s slots.',
      availableTotal: '{count} dates still available'
    },
    styleNames: {
      avatar: 'Avatar',
      character: 'Character',
      illustration: 'Illustration',
      concept: 'Concept'
    },
    slides: [
      {
        image: HOME_IMAGES.showcases.en[0],
        title: 'Professional Illustration Commissions',
        desc: 'Bring your ideas to life with polished visual storytelling'
      },
      {
        image: HOME_IMAGES.showcases.en[1],
        title: 'Flexible Style Options',
        desc: 'Avatars, character art, illustrations, and concept sheets for different needs'
      },
      {
        image: HOME_IMAGES.showcases.en[2],
        title: 'Clear Communication, Reliable Quality',
        desc: 'A transparent schedule system helps you follow commission progress in real time'
      }
    ],
    styleTabs: [
      { key: 'all', label: 'All' },
      { key: 'avatar', label: 'Avatar' },
      { key: 'character', label: 'Character' },
      { key: 'illustration', label: 'Illustration' },
      { key: 'concept', label: 'Concept' }
    ],
    galleryItems: HOME_IMAGES.artworks.en,
    quickNavs: [
      { path: '/about', icon: '🏢', title: 'About Us', desc: 'Learn about the studio history, values, and team' },
      { path: '/contact', icon: '📧', title: 'Contact', desc: 'Reach us through QQ, Xiaohongshu, X, and Bilibili' },
      { path: '/commission', icon: '🎨', title: 'Commission Guide', desc: 'Review the workflow, pricing, and commission notes' }
    ]
  }
}

export default {
  name: 'Home',
  components: { OrderCalendar },
  setup() {
    const i18n = inject('i18n')
    const artistInfo = inject('artistInfo', ref(null))
    const isSpaceOwner = inject('isSpaceOwner', ref(false))
    const personalization = ref(getPersonalization())
    const previewMode = ref(isPreviewModeActive())
    
    // 监听个性化配置变化
    const handlePersonalizationChange = (e) => {
      personalization.value = e.detail
      applyTheme(e.detail.theme, e.detail.site)
      applyBackground(e.detail.background)
    }

    const handlePreviewModeChange = (e) => {
      previewMode.value = Boolean(e.detail?.active)
    }

    // ========== 自定义 CSS（仅作用于本主页） ==========
    const CUSTOM_STYLE_SELECTOR = 'style[data-space-custom]'

    const removeCustomCSS = () => {
      if (typeof document === 'undefined') return
      const tag = document.head.querySelector(CUSTOM_STYLE_SELECTOR)
      if (tag) tag.remove()
    }

    const applyCustomCSS = (css) => {
      if (typeof document === 'undefined') return
      const clean = sanitizeCSS(css || '')
      if (!clean) {
        removeCustomCSS()
        return
      }
      let tag = document.head.querySelector(CUSTOM_STYLE_SELECTOR)
      if (!tag) {
        tag = document.createElement('style')
        tag.setAttribute('data-space-custom', '')
        document.head.appendChild(tag)
      }
      tag.textContent = clean
    }

    watch(
      () => personalization.value && personalization.value.customCSS,
      (css) => applyCustomCSS(css)
    )

    onMounted(() => {
      window.addEventListener('personalization-changed', handlePersonalizationChange)
      window.addEventListener('personalization-preview-changed', handlePreviewModeChange)
      applyCustomCSS(personalization.value && personalization.value.customCSS)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('personalization-changed', handlePersonalizationChange)
      window.removeEventListener('personalization-preview-changed', handlePreviewModeChange)
      removeCustomCSS()
      // 查看态的清除已上移到空间壳 Space.vue（覆盖所有空间子页面）
    })

    return { i18n, artistInfo, isSpaceOwner, personalization, previewMode, sanitizeHTML }
  },
  data() {
    return {
      currentSlide: 0,
      // 日历模式：orders=约稿日历（默认，仅自己可见）/ schedule=排单日历（画师可切换）
      calendarMode: 'orders',
      autoplayTimer: null,
      calendar: new Calendar(),
      calendarData: { year: 2026, month: 3, days: [] },
      showTodoModal: false,
      selectedDate: null,
      newTodo: '',
      currentTodos: [],
      currentCard: 0,
      availableSlots: 3,
      commissions: [],
      maxSlots: 8,
      activeStyle: 'all',
      // 从 TodoList 同步的数据
      todoStyles: [],
      todoCommissions: [],
      todoMaxWorkload: 3,
      todoDailyNotes: {},
      
      // 🔥 新增：从后端 API 获取的数据
      apiWorks: [],

      // 空间公开动态（用于动态区与置顶动态）
      spaceMoments: [],
      
      // 🔥 新增：卡片公告配置（从后端读取）
      cardConfig: {
        queueStatus: '可接稿',
        queueDesc: '目前还有委托位空缺，欢迎预约！',
        bookingStatus: '可预约',
        bookingDesc: '剩余可预约日期，点击日历查看详情'
      },
      
      // 🔥 新增：用户自定义的下次可预约日期（已废弃，改为使用 availableDatesList）
      nextAvailableDate: null,
      
      // 🔥 新增：用户指定的可预约日期列表（从后端 API 获取）
      availableDatesList: [], // 格式: [{date: '2025-04-01', is_full: false, note: ''}, ...]
      
      // 🔥 任务二：真实的可预约日期数据（从后端 API 获取）
      realAvailableDates: [], // 格式: [{date: '2025-04-01', is_full: false}, ...]
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    // 空间主是否为画师（排单日历只对画师空间展示，其他人可见）
    isArtistSpace() {
      return String(this.artistInfo?.role || '').toUpperCase() === 'ARTIST'
    },
    // 当前登录用户本人是画师且在查看自己的空间：可切换约稿/排单日历
    isArtistOwner() {
      return this.isSpaceOwner && this.isArtistSpace
    },
    content() {
      return HOME_CONTENT[this.locale]
    },
    cards() {
      return this.content.cards
    },
    slides() {
      // 🔥 优先使用 API 获取的作品作为轮播图（取前3张）
      if (this.apiWorks.length > 0) {
        return this.apiWorks.slice(0, 3).map((work, index) => ({
          image: work.image_url,
          title: work.title,
          desc: this.content.galleryDesc
        }))
      }
      // 兜底：使用个性化配置中的轮播图
      if (this.personalization.hero && Array.isArray(this.personalization.hero.slides) && this.personalization.hero.slides.length > 0) {
        return this.personalization.hero.slides
      }
      // 最后兜底：使用默认文案，不显示图片
      return []
    },
    weekdays() {
      return this.content.weekdays
    },
    styleTabs() {
      return this.content.styleTabs
    },
    galleryItems() {
      // 🔥 优先使用 API 获取的真实作品数据
      if (this.apiWorks.length > 0) {
        return this.apiWorks.map(work => ({
          id: work.id,
          image: work.image_url,
          title: work.title,
          category: work.category || 'all',
          desc: this.content.styleNames[work.category] || work.category
        }))
      }
      // 其次：使用当前空间配置中的作品（来自后端 page_config）
      const spaceWorks = this.artistInfo?.value?.page_config?.gallery?.works
      if (spaceWorks && spaceWorks.length > 0) {
        return spaceWorks.map(work => ({
          id: work.id || Math.random().toString(36),
          image: work.image,
          title: work.title,
          category: work.category || 'all',
          desc: work.category
        }))
      }
      // 最后兜底：返回空数组，让组件显示空状态
      return []
    },
    quickNavs() {
      // 🔥 为导航链接添加当前 slug，并按模块显隐配置过滤入口
      const navs = this.content.quickNavs
        .filter(nav => {
          if (nav.path === '/about') return this.isModuleVisible('about')
          if (nav.path === '/contact') return this.isModuleVisible('contact')
          if (nav.path === '/commission') return this.isModuleVisible('commission')
          return true
        })
      // about/contact/commission 在 sectionOrder 中没有独立区块，仅作为 quick-nav 卡片存在；
      // 这里按它们在 sectionOrder 中的相对顺序排列卡片，让排序设置产生视觉效果（未配置的键保持原相对顺序）
      const order = (this.personalization && Array.isArray(this.personalization.sectionOrder))
        ? this.personalization.sectionOrder
        : []
      const rank = (path) => {
        const idx = order.indexOf(path.replace(/^\//, ''))
        return idx === -1 ? order.length : idx
      }
      return navs
        .map((nav, index) => ({ nav, index }))
        .sort((a, b) => (rank(a.nav.path) - rank(b.nav.path)) || (a.index - b.index))
        .map(({ nav }) => ({
          ...nav,
          path: `/@${this.currentSlug}${nav.path}`
        }))
    },
    // ========== 主页 DIY：模块显隐 / 排序 / 置顶 / 自定义板块 ==========
    modulesConfig() {
      return (this.personalization && this.personalization.modules) || {}
    },
    orderedHomeSections() {
      const KNOWN = ['hero', 'gallery', 'calendar', 'moments', 'about', 'contact', 'custom']
      const order = (this.personalization && Array.isArray(this.personalization.sectionOrder))
        ? this.personalization.sectionOrder
        : []
      const result = []
      order.forEach(key => {
        if (KNOWN.includes(key) && !result.includes(key)) result.push(key)
      })
      // 补齐配置中缺失的模块，保证新模块默认可见
      KNOWN.forEach(key => {
        if (!result.includes(key)) result.push(key)
      })
      return result
    },
    enabledCustomSections() {
      const sections = (this.personalization && this.personalization.customSections) || []
      return sections.filter(section => section && section.enabled !== false)
    },
    pinnedWork() {
      const workId = this.personalization && this.personalization.pinned && this.personalization.pinned.workId
      if (workId === null || workId === undefined || workId === '') return null
      const match = item => String(item.id) === String(workId)
      const fromGallery = this.galleryItems.find(match)
      if (fromGallery) return fromGallery
      // 兜底：从空间配置的作品列表中查找
      const configWorks = (this.personalization && this.personalization.gallery && this.personalization.gallery.works) || []
      const found = configWorks.find(match)
      return found || null
    },
    pinnedMoment() {
      const momentId = this.personalization && this.personalization.pinned && this.personalization.pinned.momentId
      if (momentId === null || momentId === undefined || momentId === '') return null
      return this.spaceMoments.find(moment => String(moment.id) === String(momentId)) || null
    },
    recentMoments() {
      // 置顶动态单独展示，列表中去重，最多显示 3 条
      const pinned = this.pinnedMoment
      return this.spaceMoments
        .filter(moment => !pinned || String(moment.id) !== String(pinned.id))
        .slice(0, 3)
    },
    filteredGallery() {
      if (this.activeStyle === 'all') return this.galleryItems
      return this.galleryItems.filter(item => item.category === this.activeStyle)
    },
    // 从 TodoList 同步的日历数据（只读）
    calendarDays() {
      const year = this.currentYear
      const month = this.currentMonth
      
      const firstDay = new Date(year, month - 1, 1)
      const lastDay = new Date(year, month, 0)
      const startPadding = firstDay.getDay()
      const daysInMonth = lastDay.getDate()
      const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
      
      const today = new Date()
      const days = []
      
      // 上月填充
      for (let i = startPadding - 1; i >= 0; i--) {
        days.push({
          day: prevMonthLastDay - i,
          isOtherMonth: true,
          isToday: false,
          statusClass: '',
          workload: 0,
          dots: [],
          hasNote: false,
          dateStr: ''
        })
      }
      
      // 当月日期
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day
        
        // 获取当日排单
        const dayCommissions = this.todoCommissions.filter(c => c.date === dateStr)
        const workload = this.calculateDayWorkload(dayCommissions)
        const statusClass = this.getWorkloadStatusClass(workload)
        
        // 获取画风颜色点
        const dots = dayCommissions.slice(0, 5).map(c => {
          const style = this.todoStyles.find(s => s.id === c.styleId)
          return { color: style ? style.color : '#ccc' }
        })
        
        // 检查是否有每日备注
        const note = this.todoDailyNotes[dateStr]
        const hasNote = note && note.trim && note.trim().length > 0
        
        // 🔥 检查是否是可预约日期
        const availableDateInfo = this.realAvailableDates.find(d => d.date === dateStr)
        const isAvailableDate = !!availableDateInfo && !availableDateInfo.is_full  // 仅未满的才标为"可预约"
        const isAvailableDateFull = !!availableDateInfo && availableDateInfo.is_full
        
        days.push({
          day,
          isOtherMonth: false,
          isToday,
          statusClass,
          workload,
          dots,
          hasNote,
          dateStr,
          isAvailableDate,
          isAvailableDateFull
        })
      }
      
      // 下月填充
      const totalCells = startPadding + daysInMonth
      const remainingCells = (7 - (totalCells % 7)) % 7
      for (let i = 1; i <= remainingCells; i++) {
        days.push({
          day: i,
          isOtherMonth: true,
          isToday: false,
          statusClass: '',
          workload: 0,
          dots: []
        })
      }
      
      return days
    },
    calendarTitle() {
      return this.formatMonthTitle(this.calendarData.year, this.calendarData.month)
    },
    currentYear() {
      return this.calendarData.year
    },
    currentMonth() {
      return this.calendarData.month
    },
    lastDayOfMonth() {
      return new Date(this.currentYear, this.currentMonth, 0).getDate()
    },
    currentScheduleTitle() {
      if (this.locale === 'zh') {
        return `${this.currentMonth}月${this.cards.currentTitle}`
      }
      return `${this.formatMonthLabel(this.currentYear, this.currentMonth)} ${this.cards.currentTitle}`
    },
    currentScheduleSummaryPrefix() {
      return this.cards.currentSummaryPrefix
    },
    currentScheduleSummarySuffix() {
      return this.cards.currentSummarySuffix
    },
    currentScheduleRange() {
      return this.formatMonthRange(this.currentYear, this.currentMonth, this.lastDayOfMonth)
    },
    monthlyClientsTitle() {
      if (this.locale === 'zh') {
        return `${this.currentMonth}月${this.cards.clientsTitle}`
      }
      return `${this.formatMonthLabel(this.currentYear, this.currentMonth)} ${this.cards.clientsTitle}`
    },
    monthlyClientsTotal() {
      return this.replaceCount(this.cards.clientsTotal, this.monthlyClients.length)
    },
    availableStatus() {
      return this.availableDates.length > 0 ? this.cards.availableStatus : this.cards.fullStatus
    },
    availableDatesTitle() {
      // 🔥 如果用户指定了可预约日期，显示自定义提示
      if (this.availableDatesList.length > 0) {
        if (this.locale === 'zh') {
          return `${this.currentMonth}月指定可预约日期`
        }
        return `Available Dates for ${this.formatMonthLabel(this.currentYear, this.currentMonth)}`
      }
      
      if (this.locale === 'zh') {
        return `${this.currentMonth}月${this.cards.availableTitle}`
      }
      return `${this.formatMonthLabel(this.currentYear, this.currentMonth)} ${this.cards.availableTitle}`
    },
    availableDatesDesc() {
      // 🔥 根据是否有用户指定日期显示不同描述
      if (this.availableDatesList.length > 0) {
        if (this.locale === 'zh') {
          return `画师已指定 ${this.availableDatesList.length} 个可预约日期，点击日历查看详情`
        }
        return `${this.availableDatesList.length} available dates specified by artist`
      }
      return this.cardConfig.bookingDesc
    },
    availableDatesTotal() {
      return this.replaceCount(this.cards.availableTotal, this.availableDates.length)
    },
    todoModalTitle() {
      if (!this.selectedDate) {
        return '排单详情'
      }
      if (this.locale === 'zh') {
        return `${this.formatDateForTodo(this.selectedDate)} 排单详情`
      }
      return `Commissions for ${this.formatDateForTodo(this.selectedDate)}`
    },
    monthlyClients() {
      // 🔥 从 todoCommissions 自动生成当月单主列表
      const currentMonthStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}`
      
      return this.todoCommissions
        .filter(c => c.date && c.date.startsWith(currentMonthStr))
        .map(c => {
          // 通过 styleId 查找画风名称
          const style = this.todoStyles.find(s => s.id === c.styleId)
          return {
            name: c.clientName,
            style: style ? style.name : '未知画风'
          }
        })
    },
    // 🔥 任务二：使用真实的可预约日期数据
    availableDates() {
      // 从 realAvailableDates 中过滤出未标记为已满的日期
      // 并格式化为 "M月D日" 的显示格式
      return this.realAvailableDates
        .filter(d => !d.is_full)
        .map(d => {
          const [y, m, day] = d.date.split('-').map(Number)
          return this.formatMonthDay(m, day)
        })
    },
    showPreviewExit() {
      return this.previewMode || this.$route.query.preview === '1'
    },
    // 🔥 获取当前 slug（用于生成正确的导航链接）
    currentSlug() {
      return this.$route.params.slug || this.$route.path.split('/')[1]?.replace('@', '') || ''
    }
  },
  async mounted() {
    this.updateCalendar()
    this.startAutoplay()
    this.loadCommissions()
    this.loadSpaceMoments() // 加载空间公开动态（动态区 + 置顶）
    await this.loadTodoData() // 🔥 加载 TodoList 数据
  },
  beforeUnmount() {
    this.stopAutoplay()
  },
  methods: {
    // 模块显隐：未配置时默认显示
    isModuleVisible(key) {
      return this.modulesConfig[key] !== false
    },
    // 加载空间公开动态
    async loadSpaceMoments() {
      try {
        const slug = this.currentSlug
        if (!slug) return
        const res = await getPublicMomentsAPI(slug)
        const list = res.data && (res.data.list || res.data)
        this.spaceMoments = Array.isArray(list) ? list : []
      } catch (err) {
        console.warn('[Home] 加载动态失败:', err)
        this.spaceMoments = []
      }
    },
    startAutoplay() {
      this.stopAutoplay()
      this.autoplayTimer = setInterval(() => this.nextSlide(), 5000)
    },
    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer)
        this.autoplayTimer = null
      }
    },
    nextSlide() {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length
    },
    prevSlide() {
      this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length
    },
    goToSlide(index) {
      this.currentSlide = index
    },
    handleImageError(e) {
      e.target.src = IMAGES.imageLoadErrorLarge
    },
    updateCalendar() {
      this.calendarData = this.calendar.getMonthData()
    },
    async changeMonth(delta) {
      this.calendar.changeMonth(delta)
      this.updateCalendar()
      this.updateAvailableSlots()
      await this.loadTodoData() // 🔥 切换月份后重新加载排单数据
    },
    // 🔥 从后端 API 加载排期数据（只读）- 完整版
    async loadTodoData() {
      try {
        const year = this.currentYear
        const month = this.currentMonth
        
        console.log(`[Home] 开始加载 ${year}-${month} 的Todo数据...`)
        
        // ===== 步骤 1: 获取工作量上限 + 卡片公告配置 =====
        try {
          const workloadRes = await getPublicWorkloadAPI(this.currentSlug)
          if (workloadRes.data) {
            this.todoMaxWorkload = workloadRes.data.max_workload || 3
            
            // 🔥 加载卡片公告配置
            this.cardConfig = {
              queueStatus: workloadRes.data.queue_status || '可接稿',
              queueDesc: workloadRes.data.queue_desc || '目前还有委托位空缺，欢迎预约！',
              bookingStatus: workloadRes.data.booking_status || '可预约',
              bookingDesc: workloadRes.data.booking_desc || '剩余可预约日期，点击日历查看详情'
            }
            
            // 🔥 加载用户自定义的下次可预约日期
            this.nextAvailableDate = workloadRes.data.next_available_date || null
            
            console.log('[Home] 工作量上限:', this.todoMaxWorkload)
            console.log('[Home] 卡片配置:', this.cardConfig)
          }
        } catch (e) {
          console.warn('[Home] 获取工作量配置失败，使用默认值:', e)
          this.todoMaxWorkload = 3
        }
        
        // ===== 步骤 2: 获取画风列表（关键！用于计算天数） =====
        try {
          const stylesRes = await getPublicArtStylesAPI(this.currentSlug)
          if (stylesRes.data) {
            this.todoStyles = stylesRes.data || []
            console.log('[Home] 画风列表:', this.todoStyles.length, '个')
          }
        } catch (e) {
          console.warn('[Home] 获取画风列表失败:', e)
          this.todoStyles = []
        }
        
        // ===== 步骤 3: 获取当月排单，通过 color 匹配画风计算天数 =====
        try {
          const res = await getPublicSchedulesAPI(this.currentSlug, year, month)
          
          if (res.data?.list) {
            // 将后端数据映射到前端格式，通过 color 匹配 styleId
            this.todoCommissions = res.data.list.map(event => {
              // 🔥 关键：通过排单的 color 匹配 todoStyles 里的画风
              const matchedStyle = this.todoStyles.find(s => s.color === event.color)

              // 🔥 修复：提取日期部分（YYYY-MM-DD）用于匹配
              const dateOnly = event.start_time ? event.start_time.split('T')[0] : ''

              // 🔥 TodoList 写入的排单事件：content 为 '@c:' + JSON（style_id/quantity/note/status）
              let extra = null
              if (typeof event.content === 'string' && event.content.startsWith('@c:')) {
                try {
                  extra = JSON.parse(event.content.slice(3)) || {}
                } catch {
                  extra = {}
                }
              }

              return {
                id: event.id,
                date: dateOnly,
                clientName: event.title.split(' - ')[0] || '',
                styleId: matchedStyle ? matchedStyle.id : null,
                // 工作量 = 画风天数 × 数量，数量从 content JSON 解析（默认 1）
                quantity: extra ? (Number(extra.quantity) || 1) : 1,
                note: extra ? (extra.note || '') : event.content,
                status: extra ? (extra.status || 'pending') : 'pending',
                color: event.color
              }
            })
            
            console.log('[Home] 排单数据:', this.todoCommissions.length, '条')
          }
        } catch (e) {
          console.error('[Home] 获取排单失败:', e)
          this.todoCommissions = []
        }
        
        // ===== 步骤 4: 获取用户指定的可预约日期 =====
        await this.loadAvailableDates()
        
        // ===== 步骤 5: 获取当月留言 =====
        await this.loadMonthDailyNotes(year, month)
        
        // ===== 步骤 6: 获取作品数据（用于轮播图和画廊展示） =====
        await this.loadWorksData()
        
        console.log('✅ Home.vue Todo数据加载完成')
      } catch (err) {
        console.error('❌ Home.vue loadTodoData 失败:', err)
      }
    },
    
    // 🔥 任务二：加载可预约日期
    async loadAvailableDates() {
      try {
        const year = this.currentYear
        const month = this.currentMonth
        // 使用计算属性获取 slug，确保在各种路径下都能正确获取
        const slug = this.currentSlug
        
        console.log('[Home] 加载可预约日期:', { slug, year, month })
        
        // 🔥 如果是访客访问画师空间，使用公开接口
        if (slug) {
          const res = await getPublicAvailableDatesAPI(slug, year, month)
          console.log('[Home] 公开可预约日期响应:', res)
          if (res.data) {
            this.realAvailableDates = res.data || []
            console.log('[Home] 公开可预约日期加载成功:', this.realAvailableDates.length, '个', this.realAvailableDates)
          }
        } else {
          // 画师自己访问，使用管理接口
          const res = await getMyAvailableDatesAPI(year, month)
          console.log('[Home] 我的可预约日期响应:', res)
          if (res.data) {
            this.realAvailableDates = res.data || []
            console.log('[Home] 我的可预约日期加载成功:', this.realAvailableDates.length, '个', this.realAvailableDates)
          }
        }
      } catch (err) {
        console.error('[Home] 加载可预约日期失败:', err)
        this.realAvailableDates = []
      }
    },
    
    // 🔥 加载作品数据（用于轮播图和画廊）
    async loadWorksData() {
      try {
        // 从当前路由获取 slug
        const slug = this.$route.params.slug || this.$route.path.split('/')[1]?.replace('@', '')
        if (!slug) {
          console.log('[Home] 缺少 slug，跳过加载作品')
          return
        }
        
        const res = await getPublicWorksAPI(slug)
        if (res.data?.list) {
          this.apiWorks = res.data.list
          console.log('[Home] 作品加载成功:', this.apiWorks.length, '个')
        }
      } catch (err) {
        console.error('[Home] 加载作品失败:', err)
      }
    },
    
    // 🔥 加载当月每日留言（单次请求，解决 N+1 问题）
    async loadMonthDailyNotes(year, month) {
      try {
        const res = await getPublicMonthNotesAPI(this.currentSlug, year, month)
        const notesMap = {}
        if (res.data) {
          res.data.forEach(item => {
            if (item.content && item.content.trim()) {
              notesMap[item.date] = item.content
            }
          })
        }
        this.todoDailyNotes = { ...notesMap }
        console.log('[Home] 当月留言:', Object.keys(this.todoDailyNotes).length, '条')
      } catch (err) {
        console.error('[Home] 加载当月留言失败:', err)
        this.todoDailyNotes = {}
      }
    },
    // 计算当日工作量
    calculateDayWorkload(commissions) {
      return commissions.reduce((sum, c) => {
        const style = this.todoStyles.find(s => s.id === c.styleId)
        return sum + (style ? style.days * c.quantity : 0)
      }, 0)
    },
    // 获取工作量状态样式
    getWorkloadStatusClass(workload) {
      if (workload === 0) return ''
      if (workload > this.todoMaxWorkload) return 'status-overload'
      if (workload === this.todoMaxWorkload) return 'status-busy'
      return 'status-free'
    },
    openTodoModal(date) {
      if (!date) return
      this.selectedDate = date
      this.showTodoModal = true
    },
    closeTodoModal() {
      this.showTodoModal = false
    },
    // 检查选中日期的每日留言
    hasDailyNote(date) {
      if (!date || !this.todoDailyNotes) return false
      const note = this.todoDailyNotes[date]
      return note && note.trim && note.trim().length > 0
    },
    // 获取选中日期的每日留言内容
    getDailyNote(date) {
      if (!date || !this.todoDailyNotes) return ''
      return this.todoDailyNotes[date] || ''
    },
    // 获取选中日期的排单（只读展示）
    getSelectedDateCommissions() {
      if (!this.selectedDate) return []
      return this.todoCommissions.filter(c => c.date === this.selectedDate)
    },
    // 获取画风信息
    getStyle(styleId) {
      return this.todoStyles.find(s => s.id === styleId)
    },
    nextCard() {
      if (this.currentCard < 2) this.currentCard++
    },
    prevCard() {
      if (this.currentCard > 0) this.currentCard--
    },
    goToCard(index) {
      this.currentCard = index
    },
    replaceCount(template, count) {
      return template.replace('{count}', count)
    },
    createLocalDate(year, month, day) {
      return new Date(year, month - 1, day)
    },
    parseDate(dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    },
    formatMonthTitle(year, month) {
      const date = this.createLocalDate(year, month, 1)
      if (this.locale === 'zh') {
        return `${year}年${month}月`
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric'
      }).format(date)
    },
    formatMonthLabel(year, month) {
      const date = this.createLocalDate(year, month, 1)
      if (this.locale === 'zh') {
        return `${month}月`
      }
      return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)
    },
    formatMonthDay(month, day) {
      const date = this.createLocalDate(2026, month, day)
      if (this.locale === 'zh') {
        return `${month}月${day}日`
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date)
    },
    formatMonthRange(year, month, lastDay) {
      if (this.locale === 'zh') {
        return `${year}年${month}月1日 - ${month}月${lastDay}日`
      }
      const start = this.createLocalDate(year, month, 1)
      const end = this.createLocalDate(year, month, lastDay)
      return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(start)} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}`
    },
    formatDateForTodo(dateStr) {
      const date = this.parseDate(dateStr)
      if (this.locale === 'zh') {
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date)
    },
    updateAvailableSlots() {
      if (!this.commissions.length) {
        return
      }
      const currentMonthStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}`
      const acceptedCount = this.commissions.filter(c => {
        const date = c.schedule_date
        return date && date.startsWith(currentMonthStr) && ['accepted', 'progress'].includes(c.status)
      }).length
      this.availableSlots = Math.max(0, this.maxSlots - acceptedCount)
    },
    async loadCommissions() {
      try {
        const res = await fetch('/api/v1/commissions')
        if (res.ok) {
          const json = await res.json()
          // 后端统一响应信封 { code, message, data: { commissions } }
          this.commissions = json.data?.commissions || []
          this.updateAvailableSlots()
        }
      } catch (e) {
        this.commissions = []
        this.availableSlots = 3
      }
    },
    openLightbox(src) {
      eventBus.emit('open-lightbox', src)
    },
    async exitPreviewFromHome() {
      exitPreviewMode()
      await this.$router.push({
        path: '/personalization',
        query: { from: 'preview' }
      })
      showToast('已退出预览模式', 'success')
    }
  }
}
</script>

<style scoped>
/* 轮播图 */
.hero-section {
  padding: 64px 0;
}

.carousel-container {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.carousel {
  display: flex;
  transition: transform 0.5s ease;
}

.carousel-slide {
  min-width: 100%;
  height: 400px;
  position: relative;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: var(--white);
}

.carousel-overlay h2 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.carousel-overlay p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.carousel-actions {
  display: flex;
  gap: 20px;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.9);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 1.2rem;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-btn:hover {
  background: var(--white);
}

.carousel-btn.prev { left: 20px; }
.carousel-btn.next { right: 20px; }

.carousel-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: var(--transition);
}

.carousel-dot.active {
  background: var(--white);
}

/* 排单区域 */
.schedule-section {
  padding: 64px 0;
  background: var(--white);
}

.section-title {
  text-align: center;
  margin-bottom: 40px;
}

.section-title h2 {
  font-size: 2rem;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.section-title p {
  color: var(--text-light);
}

.schedule-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 40px;
  max-width: 1000px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .schedule-container {
    grid-template-columns: 1fr;
  }
}

/* 日历/排单只开一个模块时单列居中 */
.schedule-container.schedule-single {
  grid-template-columns: 1fr;
  max-width: 640px;
}

/* 约稿日历/排单日历切换（仅画师本人可见） */
.calendar-mode-toggle {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.calendar-mode-toggle button {
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--text-light);
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.calendar-mode-toggle button:hover {
  color: var(--primary-color);
}

.calendar-mode-toggle button.active {
  background: var(--primary-color);
  color: var(--white);
}

/* 日历 */
.calendar {
  background: var(--bg-light);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-header h3 {
  font-size: 1.2rem;
  color: var(--text-dark);
}

.calendar-nav {
  display: flex;
  gap: 10px;
}

.calendar-nav button {
  background: var(--white);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.calendar-nav button:hover {
  background: var(--primary-color);
  color: var(--white);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-weekday {
  text-align: center;
  font-weight: 600;
  color: var(--text-muted);
  padding: 10px 0;
  font-size: 0.85rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 8px;
  background: var(--white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  font-size: 0.9rem;
  min-height: 60px;
}

.calendar-day:hover {
  background: var(--secondary-color);
}

.calendar-day.other-month {
  color: var(--text-muted);
  background: transparent;
  cursor: default;
}

.calendar-day.today {
  background: var(--primary-color) !important;
  color: var(--white);
}

.calendar-day.has-todo::after {
  content: '';
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-color);
}

.todo-indicator {
  position: absolute;
  bottom: 2px;
  font-size: 0.6rem;
  color: var(--accent-color);
}

/* Todo 弹窗 */
.todo-modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  align-items: center;
  justify-content: center;
}

.todo-modal.active {
  display: flex;
}

.todo-modal-content {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.todo-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.todo-modal-header h3 {
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.todo-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.todo-input input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #E5E7EB;
  border-radius: var(--radius-sm);
  font-size: 1rem;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-light);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.todo-item:hover {
  background: var(--secondary-color);
}

.todo-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.todo-item span {
  flex: 1;
}

.todo-item.completed span {
  text-decoration: line-through;
  color: var(--text-muted);
}

.delete-todo {
  background: none;
  border: none;
  color: #DC2626;
  cursor: pointer;
  opacity: 0;
  transition: var(--transition);
}

.todo-item:hover .delete-todo {
  opacity: 1;
}

/* 排单详情弹窗样式 */
.commission-modal .todo-modal-content {
  max-width: 450px;
}

/* 日期数字旁的星号标记 */
.day-number {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.note-star {
  color: #DC2626;
  font-weight: bold;
  margin-right: 2px;
  font-size: 1.1em;
  line-height: 1;
}

/* 每日备注显示 */
.daily-note-display {
  background: #FAFAFA;
  border-radius: var(--radius-sm);
  padding: 15px;
  margin-bottom: 20px;
  border-left: 4px solid #E5E7EB;
}

.daily-note-label {
  font-size: 0.85rem;
  color: var(--text-dark);
  font-weight: 600;
  margin-bottom: 8px;
}

.daily-note-content {
  color: var(--text-light);
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.commission-detail-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
}

.empty-commissions {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-commissions .empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.commission-detail-item {
  background: var(--bg-light);
  border-radius: var(--radius-sm);
  padding: 16px;
  border-left: 4px solid var(--primary-color);
}

.commission-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.commission-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius);
  font-size: 0.85rem;
  font-weight: 500;
}

.commission-tag .style-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-badge {
  padding: 2px 8px;
  border-radius: var(--radius);
  font-size: 0.75rem;
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.1);
  color: #15803D;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.12);
  color: #B45309;
}

.commission-client {
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-dark);
}

.commission-meta {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.commission-note {
  font-size: 0.85rem;
  color: var(--text-light);
  padding-top: 8px;
  border-top: 1px dashed #E5E7EB;
}

.modal-footer-hint {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #E5E7EB;
}

.btn-full {
  width: 100%;
  text-align: center;
}

/* 日历工作量状态样式 */
.calendar-day.status-free {
  background: rgba(34, 197, 94, 0.08);
}

.calendar-day.status-busy {
  background: rgba(245, 158, 11, 0.1);
}

.calendar-day.status-overload {
  background: rgba(239, 68, 68, 0.08);
}

.calendar-day .day-number {
  font-size: 0.95rem;
  font-weight: 500;
  z-index: 2;
  position: relative;
}

.calendar-day.today .day-number {
  color: var(--white);
  font-weight: 700;
}

.calendar-day .day-dots {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 2px;
  z-index: 1;
  position: relative;
}

.calendar-day .day-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  /* 🔥 终极防隐身魔法：用纯白色的 box-shadow 充当描边，无论背景多黑多绿都绝对清晰！ */
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.95), 0 2px 4px rgba(0, 0, 0, 0.2);
}

.calendar-day .day-workload {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 1px;
  z-index: 1;
  position: relative;
}

.calendar-day.today .day-workload {
  color: rgba(255, 255, 255, 0.9);
}

/* 🔥 当日日期的圆点缩小 */
.calendar-day.today .day-dot {
  width: 4px;
  height: 4px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 🔥 可预约日期样式 */
.calendar-day.available-date {
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.45);
}

.calendar-day.available-date-full {
  background: rgba(156, 163, 175, 0.12);
  border: 1px solid #D1D5DB;
}

.calendar-day .available-marker {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #22C55E;
  color: white;
  font-size: 0.55rem;
  font-weight: bold;
  border-radius: 50%;
  z-index: 2;
}

.calendar-day .available-marker.is-full {
  background: var(--text-muted);
}

/* 排单卡片 */
.schedule-cards-container {
  position: relative;
}

.schedule-card-wrapper {
  min-height: 220px;
  position: relative;
}

.schedule-card {
  background: var(--secondary-color);
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
}

/* 卡片内容切换动画 */
.card-fade-enter-active,
.card-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.card-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.card-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.schedule-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status {
  padding: 5px 12px;
  border-radius: var(--radius);
  font-size: 0.8rem;
  font-weight: 600;
}

.status.open {
  background: rgba(34, 197, 94, 0.12);
  color: #15803D;
}

.status.busy {
  background: rgba(245, 158, 11, 0.12);
  color: #B45309;
}

.status.closed {
  background: rgba(239, 68, 68, 0.1);
  color: #DC2626;
}

.schedule-card h4 {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: var(--text-dark);
}

.schedule-card p {
  color: var(--text-light);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* 单主列表样式 */
.clients-list {
  margin: 15px 0;
  max-height: 100px;
  overflow-y: auto;
}

.client-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #E5E7EB;
}

.client-item:last-child {
  border-bottom: none;
}

.client-num {
  width: 22px;
  height: 22px;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.client-name {
  flex: 1;
  font-weight: 500;
}

.client-style {
  font-size: 0.8rem;
  color: var(--text-muted);
  background: #F3F4F6;
  padding: 2px 8px;
  border-radius: var(--radius);
}

/* 日期标签样式 */
.dates-list {
  margin: 15px 0;
}

.dates-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.date-tag {
  background: var(--primary-color);
  color: white;
  padding: 4px 10px;
  border-radius: var(--radius);
  font-size: 0.85rem;
}

.date-tag.more {
  background: var(--accent-color);
}

.empty-text {
  color: var(--text-muted);
  font-style: italic;
  margin: 15px 0;
}

.date-range {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary-color);
  font-weight: 600;
}

.schedule-card-nav {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.schedule-card-nav button {
  background: var(--white);
  border: 1px solid #E5E7EB;
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: var(--transition);
}

.schedule-card-nav button:hover:not(:disabled) {
  background: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
}

.schedule-card-nav button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.schedule-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 15px;
}

.schedule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D1D5DB;
  cursor: pointer;
  transition: var(--transition);
}

.schedule-dot.active {
  background: var(--primary-color);
}

/* 画风展示 */
.gallery-section {
  padding: 64px 0;
}

.style-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.style-tab {
  padding: 10px 20px;
  background: var(--white);
  border: 1px solid #E5E7EB;
  border-radius: var(--radius);
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.style-tab:hover,
.style-tab.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.style-tab.active {
  background: var(--primary-color);
  color: var(--white);
}

/* 作品网格：自适应列数，统一卡片比例，任意数量作品都能整齐铺满 */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

@media (max-width: 480px) {
  .masonry-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
}

.masonry-item {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 4 / 5;
  background: var(--bg-light);
}

.masonry-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: var(--transition);
}

.masonry-item:hover img {
  transform: scale(1.03);
}

.gallery-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
}

.masonry-item-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: var(--white);
  opacity: 0;
  transition: var(--transition);
}

.masonry-item:hover .masonry-item-overlay {
  opacity: 1;
}

.masonry-item-overlay h4 {
  font-size: 1rem;
  margin-bottom: 5px;
}

.masonry-item-overlay p {
  font-size: 0.85rem;
  opacity: 0.8;
}

/* 置顶标记 */
.pinned-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  background: var(--accent-color);
  color: var(--white);
  font-size: 0.8rem;
  font-weight: 500;
}

/* 置顶作品 */
.pinned-work-card {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto 30px;
  padding: 16px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: var(--transition);
}

.pinned-work-card:hover {
  box-shadow: var(--shadow-hover);
}

.pinned-work-card img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.pinned-work-info h4 {
  margin: 8px 0 6px;
  color: var(--text-dark);
}

.pinned-work-info p {
  margin: 0;
  color: var(--text-light);
  font-size: 0.9rem;
}

/* 动态 */
.moments-section {
  padding: 64px 0;
  background: var(--white);
}

.home-moments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.home-moment-card {
  padding: 20px;
  background: var(--bg-light);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.home-moment-card.is-pinned {
  border: 1px solid var(--accent-color);
}

.home-moment-card h4 {
  margin: 8px 0 6px;
  color: var(--text-dark);
}

.home-moment-card p {
  margin: 0;
  color: var(--text-light);
  line-height: 1.6;
  white-space: pre-wrap;
}

.home-moment-images {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.home-moment-images img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.home-moments-empty {
  text-align: center;
  color: var(--text-muted);
}

/* 自定义板块 */
.custom-section-block {
  padding: 64px 0;
}

.custom-section-card {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.custom-section-title {
  margin: 0 0 16px;
  font-family: var(--font-heading);
  color: var(--text-dark);
}

.custom-section-content {
  color: var(--text-dark);
  line-height: 1.8;
}

.custom-section-content :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
}

.custom-section-content :deep(a) {
  color: var(--accent-color);
}

.custom-section-content :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid var(--border-color);
  color: var(--text-light);
}

/* 快速导航 */
.quick-nav-section {
  padding: 64px 0;
  background: var(--white);
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  max-width: 900px;
  margin: 0 auto;
}

.preview-home-dock {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 5000;
}

.preview-home-panel {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: var(--radius);
  background: rgba(17, 24, 39, 0.94);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: var(--shadow-hover);
  backdrop-filter: blur(12px);
}

.preview-home-label {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.preview-home-btn {
  min-width: 168px;
  box-shadow: none;
}

.preview-home-dock-enter-active,
.preview-home-dock-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.preview-home-dock-enter-from,
.preview-home-dock-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
}

@media (max-width: 768px) {
  .hero-section,
  .schedule-section,
  .gallery-section,
  .quick-nav-section {
    padding: 40px 0;
  }

  .quick-nav-grid {
    grid-template-columns: 1fr;
  }

  .preview-home-dock {
    left: 16px;
    right: 16px;
    bottom: 16px;
    transform: none;
  }

  .preview-home-panel {
    width: 100%;
    justify-content: space-between;
    border-radius: var(--radius);
  }

  .preview-home-btn {
    min-width: 0;
  }
}

.quick-nav-card {
  background: var(--bg-light);
  border-radius: var(--radius);
  padding: 40px 30px;
  text-align: center;
  transition: var(--transition);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
}

.quick-nav-card:hover {
  box-shadow: var(--shadow-hover);
}

.quick-nav-icon {
  width: 64px;
  height: 64px;
  background: var(--primary-color);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 1.8rem;
  color: var(--white);
}

.quick-nav-card h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: var(--text-dark);
}

.quick-nav-card p {
  color: var(--text-light);
  font-size: 0.95rem;
}
</style>
