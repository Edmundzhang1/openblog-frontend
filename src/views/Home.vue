<template>
  <div class="home">
    <!-- 轮播图 -->
    <section class="hero-section">
      <div class="container">
        <div class="carousel-container" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
          <div class="carousel" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
            <div v-for="(slide, index) in slides" :key="index" class="carousel-slide">
              <img :src="slide.image" :alt="slide.title" @error="handleImageError">
              <div class="carousel-overlay">
                <h2>{{ slide.title }}</h2>
                <p>{{ slide.desc }}</p>
                <div class="carousel-actions">
                  <router-link to="/commission" class="btn btn-primary">{{ content.ctaCommission }}</router-link>
                  <router-link to="/gallery" class="btn btn-secondary">{{ content.ctaGallery }}</router-link>
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
    <section class="schedule-section">
      <div class="container">
        <div class="section-title">
          <h2>{{ content.scheduleTitle }}</h2>
          <p>{{ content.scheduleDesc }}</p>
        </div>
        <div class="schedule-container">
          <!-- 日历 -->
          <div class="calendar">
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
                v-for="(day, index) in calendarData.days" 
                :key="index"
                class="calendar-day"
                :class="{ 
                  'other-month': day.isOtherMonth, 
                  'today': day.isToday,
                  'has-todo': day.hasTodo 
                }"
                @click="!day.isOtherMonth && openTodoModal(day.date)"
              >
                {{ day.day }}
                <span v-if="day.hasTodo" class="todo-indicator">{{ day.todoCount }}</span>
              </div>
            </div>
          </div>
          
          <!-- 排单卡片 -->
          <div class="schedule-cards-container">
            <div class="schedule-card-wrapper">
              <transition name="card-fade" mode="out-in">
                <!-- 卡片1：当前排单情况 -->
                <div v-if="currentCard === 0" key="card1" class="schedule-card">
                  <div class="schedule-card-header">
                    <span>{{ cards.currentLabel }}</span>
                    <span class="status open">{{ cards.currentStatus }}</span>
                  </div>
                  <h4>{{ currentScheduleTitle }}</h4>
                  <p>{{ currentScheduleSummaryPrefix }}<strong>{{ availableSlots }}</strong>{{ currentScheduleSummarySuffix }}</p>
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
                      {{ availableStatus }}
                    </span>
                  </div>
                  <h4>{{ availableDatesTitle }}</h4>
                  <div v-if="availableDates.length > 0" class="dates-list">
                    <div class="dates-tags">
                      <span v-for="date in availableDates.slice(0, 8)" :key="date" class="date-tag">
                        {{ date }}
                      </span>
                      <span v-if="availableDates.length > 8" class="date-tag more">+{{ availableDates.length - 8 }}</span>
                    </div>
                  </div>
                  <p v-else class="empty-text">{{ cards.availableEmpty }}</p>
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
      </div>
    </section>

    <!-- Todo 弹窗 -->
    <div class="todo-modal" :class="{ active: showTodoModal }" @click.self="closeTodoModal">
      <div class="todo-modal-content">
        <div class="todo-modal-header">
          <h3>{{ todoModalTitle }}</h3>
          <button class="close-btn" @click="closeTodoModal">×</button>
        </div>
        <div class="todo-input">
          <input v-model="newTodo" type="text" :placeholder="content.todoPlaceholder" @keypress.enter="addTodo">
          <button class="btn btn-primary" @click="addTodo">{{ content.addTodo }}</button>
        </div>
        <div class="todo-list">
          <div 
            v-for="(todo, index) in currentTodos" 
            :key="todo.id"
            class="todo-item"
            :class="{ completed: todo.completed }"
          >
            <input type="checkbox" :checked="todo.completed" @change="toggleTodo(index)">
            <span>{{ todo.text }}</span>
            <button class="delete-todo" @click="deleteTodo(index)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 画风展示 -->
    <section class="gallery-section">
      <div class="container">
        <div class="section-title">
          <h2>{{ content.galleryTitle }}</h2>
          <p>{{ content.galleryDesc }}</p>
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
        <div class="masonry-grid">
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
      </div>
    </section>

    <!-- 快速导航 -->
    <section class="quick-nav-section">
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
  </div>
</template>

<script>
import { inject } from 'vue'
import { Calendar } from '../utils/calendar'
import { eventBus } from '../utils/eventBus'

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
        image: 'https://via.placeholder.com/1000x400/6b8e6b/ffffff?text=FUREST+作品展示1',
        title: '专业插画约稿服务',
        desc: '为您的创意提供完美的视觉呈现'
      },
      {
        image: 'https://via.placeholder.com/1000x400/d4a574/ffffff?text=FUREST+作品展示2',
        title: '多样化画风选择',
        desc: '头像、立绘、插图、设定图，满足您的各种需求'
      },
      {
        image: 'https://via.placeholder.com/1000x400/4a6b4a/ffffff?text=FUREST+作品展示3',
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
    galleryItems: [
      { id: 1, category: 'avatar', image: 'https://via.placeholder.com/300x400/6b8e6b/ffffff?text=头像作品', title: 'Q版头像', desc: '可爱风格头像' },
      { id: 2, category: 'character', image: 'https://via.placeholder.com/300x500/d4a574/ffffff?text=立绘作品', title: '角色立绘', desc: '日系风格立绘' },
      { id: 3, category: 'illustration', image: 'https://via.placeholder.com/400x300/4a6b4a/ffffff?text=插图作品', title: '场景插图', desc: '氛围感插图' },
      { id: 4, category: 'concept', image: 'https://via.placeholder.com/350x350/8b7355/ffffff?text=设定图作品', title: '角色设定', desc: '完整角色设计' },
      { id: 5, category: 'avatar', image: 'https://via.placeholder.com/300x400/9dc183/ffffff?text=头像作品2', title: '写实头像', desc: '写实风格头像' },
      { id: 6, category: 'illustration', image: 'https://via.placeholder.com/400x300/b8a089/ffffff?text=插图作品2', title: '封面插图', desc: '小说封面设计' }
    ],
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
        image: 'https://via.placeholder.com/1000x400/6b8e6b/ffffff?text=FUREST+Showcase+1',
        title: 'Professional Illustration Commissions',
        desc: 'Bring your ideas to life with polished visual storytelling'
      },
      {
        image: 'https://via.placeholder.com/1000x400/d4a574/ffffff?text=FUREST+Showcase+2',
        title: 'Flexible Style Options',
        desc: 'Avatars, character art, illustrations, and concept sheets for different needs'
      },
      {
        image: 'https://via.placeholder.com/1000x400/4a6b4a/ffffff?text=FUREST+Showcase+3',
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
    galleryItems: [
      { id: 1, category: 'avatar', image: 'https://via.placeholder.com/300x400/6b8e6b/ffffff?text=Avatar+Sample', title: 'Chibi Avatar', desc: 'A cute profile commission' },
      { id: 2, category: 'character', image: 'https://via.placeholder.com/300x500/d4a574/ffffff?text=Character+Art', title: 'Character Illustration', desc: 'Full-body anime style artwork' },
      { id: 3, category: 'illustration', image: 'https://via.placeholder.com/400x300/4a6b4a/ffffff?text=Scene+Illustration', title: 'Scene Illustration', desc: 'Mood-driven environment art' },
      { id: 4, category: 'concept', image: 'https://via.placeholder.com/350x350/8b7355/ffffff?text=Concept+Sheet', title: 'Character Design Sheet', desc: 'A complete original character package' },
      { id: 5, category: 'avatar', image: 'https://via.placeholder.com/300x400/9dc183/ffffff?text=Avatar+Sample+2', title: 'Realistic Portrait', desc: 'A more natural portrait style' },
      { id: 6, category: 'illustration', image: 'https://via.placeholder.com/400x300/b8a089/ffffff?text=Cover+Illustration', title: 'Cover Illustration', desc: 'Artwork prepared for novel or campaign covers' }
    ],
    quickNavs: [
      { path: '/about', icon: '🏢', title: 'About Us', desc: 'Learn about the studio history, values, and team' },
      { path: '/contact', icon: '📧', title: 'Contact', desc: 'Reach us through QQ, Xiaohongshu, X, and Bilibili' },
      { path: '/commission', icon: '🎨', title: 'Commission Guide', desc: 'Review the workflow, pricing, and commission notes' }
    ]
  }
}

export default {
  name: 'Home',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      currentSlide: 0,
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
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return HOME_CONTENT[this.locale]
    },
    cards() {
      return this.content.cards
    },
    slides() {
      return this.content.slides
    },
    weekdays() {
      return this.content.weekdays
    },
    styleTabs() {
      return this.content.styleTabs
    },
    galleryItems() {
      return this.content.galleryItems
    },
    quickNavs() {
      return this.content.quickNavs
    },
    filteredGallery() {
      if (this.activeStyle === 'all') return this.galleryItems
      return this.galleryItems.filter(item => item.category === this.activeStyle)
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
      if (this.locale === 'zh') {
        return `${this.currentMonth}月${this.cards.availableTitle}`
      }
      return `${this.formatMonthLabel(this.currentYear, this.currentMonth)} ${this.cards.availableTitle}`
    },
    availableDatesTotal() {
      return this.replaceCount(this.cards.availableTotal, this.availableDates.length)
    },
    todoModalTitle() {
      if (!this.selectedDate) {
        return this.content.todoTitle
      }
      if (this.locale === 'zh') {
        return `${this.formatDateForTodo(this.selectedDate)} ${this.content.todoTitle}`
      }
      return `${this.content.todoTitle} for ${this.formatDateForTodo(this.selectedDate)}`
    },
    monthlyClients() {
      const currentMonthStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}`
      
      return this.commissions
        .filter(c => {
          const date = c.schedule_date || c.created_at?.split('T')[0]
          return date && date.startsWith(currentMonthStr) && 
                 ['accepted', 'progress', 'pending'].includes(c.status)
        })
        .map(c => ({
          name: c.client_name,
          style: this.content.styleNames[c.style] || c.style
        }))
    },
    availableDates() {
      const currentMonthStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}`
      
      const bookedDates = this.commissions
        .filter(c => {
          const date = c.schedule_date
          return date && date.startsWith(currentMonthStr) && 
                 ['accepted', 'progress'].includes(c.status)
        })
        .map(c => c.schedule_date)
      
      const today = new Date()
      const year = this.currentYear
      const month = this.currentMonth - 1
      const lastDay = this.lastDayOfMonth
      const available = []
      
      for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const date = new Date(year, month, day)
        
        if (date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) && 
            !bookedDates.includes(dateStr) &&
            available.length < this.availableSlots) {
          available.push(this.formatMonthDay(month + 1, day))
        }
      }
      
      return available
    }
  },
  mounted() {
    this.updateCalendar()
    this.startAutoplay()
    this.loadCommissions()
  },
  beforeUnmount() {
    this.stopAutoplay()
  },
  methods: {
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
      e.target.src = `https://via.placeholder.com/1000x400/cccccc/666666?text=${encodeURIComponent(this.content.imageFallbackText)}`
    },
    updateCalendar() {
      this.calendarData = this.calendar.getMonthData()
    },
    changeMonth(delta) {
      this.calendar.changeMonth(delta)
      this.updateCalendar()
      this.updateAvailableSlots()
    },
    openTodoModal(date) {
      if (!date) return
      this.selectedDate = date
      this.currentTodos = this.calendar.getTodos(date)
      this.showTodoModal = true
    },
    closeTodoModal() {
      this.showTodoModal = false
      this.newTodo = ''
    },
    addTodo() {
      if (!this.newTodo.trim()) return
      this.calendar.addTodo(this.selectedDate, this.newTodo.trim())
      this.currentTodos = this.calendar.getTodos(this.selectedDate)
      this.updateCalendar()
      this.newTodo = ''
    },
    toggleTodo(index) {
      this.calendar.toggleTodo(this.selectedDate, index)
      this.currentTodos = this.calendar.getTodos(this.selectedDate)
    },
    deleteTodo(index) {
      this.calendar.deleteTodo(this.selectedDate, index)
      this.currentTodos = this.calendar.getTodos(this.selectedDate)
      this.updateCalendar()
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
        const res = await fetch('/api/commissions')
        if (res.ok) {
          const data = await res.json()
          this.commissions = data.commissions || []
          this.updateAvailableSlots()
        }
      } catch (e) {
        this.commissions = []
        this.availableSlots = 3
      }
    },
    openLightbox(src) {
      eventBus.emit('open-lightbox', src)
    }
  }
}
</script>

<style scoped>
/* 轮播图 */
.hero-section {
  padding: 40px 0;
}

.carousel-container {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-hover);
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
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-btn:hover {
  background: var(--white);
  transform: translateY(-50%) scale(1.1);
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
  width: 30px;
  border-radius: 5px;
}

/* 排单区域 */
.schedule-section {
  padding: 60px 0;
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
  justify-content: center;
  background: var(--white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  font-size: 0.9rem;
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
  background: var(--primary-color);
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
  border: 1px solid #ddd;
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
  color: #e74c3c;
  cursor: pointer;
  opacity: 0;
  transition: var(--transition);
}

.todo-item:hover .delete-todo {
  opacity: 1;
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
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--white) 100%);
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
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status.open {
  background: #d4edda;
  color: #155724;
}

.status.busy {
  background: #fff3cd;
  color: #856404;
}

.status.closed {
  background: #f8d7da;
  color: #721c24;
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
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.client-item:last-child {
  border-bottom: none;
}

.client-num {
  width: 22px;
  height: 22px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
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
  background: rgba(107, 142, 107, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
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
  border-radius: 12px;
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
  border-top: 1px solid rgba(0,0,0,0.1);
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
  border: 1px solid #ddd;
  width: 36px;
  height: 36px;
  border-radius: 50%;
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
  background: #ddd;
  cursor: pointer;
  transition: var(--transition);
}

.schedule-dot.active {
  background: var(--primary-color);
}

/* 画风展示 */
.gallery-section {
  padding: 60px 0;
}

.style-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.style-tab {
  padding: 12px 30px;
  background: var(--white);
  border: 2px solid transparent;
  border-radius: 30px;
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

.masonry-grid {
  column-count: 4;
  column-gap: 20px;
}

@media (max-width: 1024px) {
  .masonry-grid { column-count: 3; }
}

@media (max-width: 768px) {
  .masonry-grid { column-count: 2; }
}

@media (max-width: 480px) {
  .masonry-grid { column-count: 1; }
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 20px;
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
}

.masonry-item img {
  width: 100%;
  display: block;
  transition: var(--transition);
}

.masonry-item:hover img {
  transform: scale(1.05);
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

/* 快速导航 */
.quick-nav-section {
  padding: 60px 0;
  background: var(--white);
}

.quick-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  max-width: 900px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .quick-nav-grid {
    grid-template-columns: 1fr;
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
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
}

.quick-nav-icon {
  width: 70px;
  height: 70px;
  background: var(--primary-color);
  border-radius: 50%;
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
