<template>
  <div class="commission">
    <header class="page-header">
      <div class="container">
        <h1>{{ $t('commission.title') }}</h1>
        <p>{{ $t('commission.subtitle') }}</p>
      </div>
    </header>

    <section class="commission-section">
      <div class="container">
        <div class="commission-steps">
          <!-- 步骤1：选择风格 -->
          <div class="step">
            <div class="step-header">
              <div class="step-number">1</div>
              <h3>{{ $t('commission.step1') }}</h3>
            </div>
            <div v-if="artStyles.length === 0" class="alert alert-info">
              {{ locale === 'zh' ? '画师暂未设置画风类型' : 'Artist has not set style types yet' }}
            </div>
            <div v-else class="style-options">
              <div 
                v-for="style in localizedStyles" 
                :key="style.key"
                class="style-option"
                :class="{ selected: selectedStyle === style.key }"
                @click="selectedStyle = style.key"
              >
                <div class="style-header">
                  <h4 class="style-name">{{ style.name }}</h4>
                  <span v-if="style.price" class="style-price">{{ style.price }}</span>
                </div>
                <p v-if="style.note" class="style-note">{{ style.note }}</p>
              </div>
            </div>
          </div>

          <!-- 步骤2：填写委托信息 -->
          <div class="step">
            <div class="step-header">
              <div class="step-number">2</div>
              <h3>{{ $t('commission.step2') }}</h3>
            </div>

            <!-- 登录提示 -->
            <div v-if="!isLoggedIn" class="login-prompt">
              <p>{{ $t('commission.loginRequired') }}</p>
              <router-link to="/login" class="btn btn-primary">{{ $t('commission.goLogin') }}</router-link>
            </div>

            <form v-else @submit.prevent="submitForm">
              <div class="form-row">
                <div class="form-group">
                  <label>{{ $t('commission.nickname') }} <span class="required">*</span></label>
                  <input v-model="form.client_name" type="text" required :placeholder="$t('commission.nickname')">
                </div>
                <div class="form-group">
                  <label>{{ $t('commission.contact') }} <span class="required">*</span></label>
                  <div class="contact-input-group">
                    <select v-model="form.contact_type" class="contact-type">
                      <option value="qq">QQ</option>
                      <option value="email">{{ $t('commission.contactEmail') }}</option>
                    </select>
                    <input 
                      v-model="form.contact_value" 
                      type="text" 
                      required 
                      :placeholder="$t('commission.contactHint')"
                    >
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>{{ $t('commission.usage') }} <span class="required">*</span></label>
                <select v-model="form.usage" required>
                  <option v-for="option in usageOptions" :key="option.value || 'usage-placeholder'" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>{{ $t('commission.description') }} <span class="required">*</span></label>
                <textarea 
                  v-model="form.description" 
                  required 
                  rows="6"
                  :placeholder="$t('commission.descriptionPlaceholder')"
                ></textarea>
              </div>

              <div class="form-group">
                <label>{{ $t('commission.details') }}</label>
                <textarea 
                  v-model="form.details" 
                  rows="4"
                  :placeholder="$t('commission.detailsPlaceholder')"
                ></textarea>
              </div>

              <div class="form-group">
                <label>{{ $t('commission.schedule') }}</label>
                <div class="commission-calendar">
                  <div class="commission-calendar__header">
                    <h3 class="commission-calendar__title">{{ calendarTitle }}</h3>
                    <div class="commission-calendar__nav">
                      <button type="button" class="commission-calendar__nav-btn" @click="changeMonth(-1)">‹</button>
                      <button type="button" class="commission-calendar__nav-btn" @click="changeMonth(1)">›</button>
                    </div>
                  </div>
                  <div class="commission-calendar__grid">
                    <div class="commission-calendar__weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
                    <div 
                      v-for="(day, index) in calendarDays" 
                      :key="index"
                      class="commission-calendar__day"
                      :class="{ 
                        'is-other-month': day.isOtherMonth, 
                        'is-selected': form.schedule_date === day.dateStr,
                        'is-available': day.isAvailable,
                        'is-full': day.isFull,
                        'is-not-opened': !day.isOtherMonth && day.isNotOpened
                      }"
                      @click="!day.isOtherMonth && day.isAvailable && (form.schedule_date = day.dateStr)"
                    >
                      {{ day.day }}
                      <span v-if="day.isAvailable" class="commission-calendar__marker commission-calendar__marker--available">可</span>
                      <span v-else-if="day.isFull" class="commission-calendar__marker commission-calendar__marker--full">满</span>
                    </div>
                  </div>
                </div>
                <p class="date-hint">
                  {{ $t('commission.selectedDate') }}<strong>{{ form.schedule_date || $t('commission.notSelected') }}</strong>
                  <span v-if="form.schedule_date" class="selected-status" :class="{
                    'status-available': calendarDays.find(d => d.dateStr === form.schedule_date)?.isAvailable,
                    'status-full': calendarDays.find(d => d.dateStr === form.schedule_date)?.isFull
                  }">
                    {{ calendarDays.find(d => d.dateStr === form.schedule_date)?.isAvailable ? '（可预约）' : calendarDays.find(d => d.dateStr === form.schedule_date)?.isFull ? '（已满）' : '' }}
                  </span>
                </p>
              </div>

              <div class="form-group">
                <label>{{ $t('commission.budget') }}</label>
                <select v-model="form.budget">
                  <option v-for="option in budgetOptions" :key="option.value || 'budget-placeholder'" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>{{ $t('commission.uploadRef') }}</label>
                <div 
                  class="file-upload" 
                  :class="{ 'has-file': form.files.length > 0, 'drag-over': dragOver }"
                  @click="$refs.fileInput.click()"
                  @drop.prevent="handleDrop"
                  @dragover.prevent="dragOver = true"
                  @dragleave.prevent="dragOver = false"
                >
                  <input 
                    ref="fileInput"
                    type="file" 
                    accept="image/*"
                    multiple
                    @change="handleFileChange"
                    style="display: none"
                  >
                  <div class="file-upload-icon">📎</div>
                  <p v-if="form.files.length === 0">
                    {{ $t('commission.uploadHint') }}
                  </p>
                  <div v-else class="file-list">
                    <span v-for="(file, idx) in form.files" :key="idx" class="file-tag">
                      {{ file.name }}
                      <button type="button" @click.stop="removeFile(idx)">×</button>
                    </span>
                  </div>
                </div>
              </div>

              <!-- 条款同意 -->
              <div class="form-group terms-group">
                <label class="terms-label">
                  <input type="checkbox" v-model="form.agreedTerms" required>
                  <span>
                    {{ $t('commission.terms') }}
                    <a href="#" @click.prevent="showTerms = true">{{ $t('commission.termsLink') }}</a>
                  </span>
                </label>
              </div>

              <button type="submit" class="btn btn-primary submit-btn" :disabled="submitting || !form.agreedTerms">
                {{ submitting ? $t('commission.submitting') : $t('commission.submit') }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- 委托条款弹窗 -->
    <div v-if="showTerms" class="terms-modal" @click.self="showTerms = false">
      <div class="terms-modal-content">
        <div class="terms-header">
          <h2>{{ $t('commission.termsTitle') }}</h2>
          <button class="close-btn" @click="showTerms = false">×</button>
        </div>
        <div class="terms-body">
          <!-- 🔥 如果画师设置了 commission_rules，直接显示纯文本 -->
          <div v-if="artistData?.commission_rules" class="terms-text-content">
            <pre style="white-space: pre-wrap; line-height: 1.8; font-family: inherit;">{{ artistData.commission_rules }}</pre>
          </div>
          <!-- 否则使用结构化的默认条款 -->
          <template v-else v-for="(section, index) in termsSections" :key="section.title">
            <h3>{{ index + 1 }}. {{ section.title }}</h3>
            <p>{{ section.content }}</p>
          </template>
        </div>
        <div class="terms-footer">
          <button class="btn btn-primary" @click="showTerms = false; form.agreedTerms = true">
            {{ $t('commission.termsAgree') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 提交成功弹窗 -->
    <div v-if="showSuccess" class="success-modal" @click.self="showSuccess = false">
      <div class="success-modal-content">
        <div class="success-icon">✓</div>
        <h2>{{ $t('commission.submittedSuccess') }}</h2>
        <div class="order-info">
          <p>{{ $t('commission.orderNumber') }}：</p>
          <div class="order-number">{{ orderNumber }}</div>
          <p class="hint">{{ $t('commission.orderNumberHint') }}</p>
        </div>
        <div class="success-actions">
          <router-link :to="`/orders?order=${orderNumber}`" class="btn btn-primary">
            {{ $t('order.query') }}
          </router-link>
          <button class="btn btn-secondary" @click="copyOrderNumber">
            {{ $t('commission.copyOrderNumber') }}
          </button>
          <button class="btn btn-chat" @click="goToChat">
            💬 去私信沟通
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Calendar } from '../../utils/calendar'
import { showToast } from '../../utils/eventBus'
import { getAccessToken } from '../../utils/auth.js'
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicArtStylesAPI } from '@/api/todo.js'
import { getPublicSchedulesAPI } from '@/api/calendar.js'
import { getPublicAvailableDatesAPI } from '@/api/availableDate.js'
import { COMMISSION_IMAGES } from '../../config/assets.js'

export default {
  name: 'Commission',
  setup() {
    const i18n = inject('i18n')
    const route = useRoute()
    // 从路由获取 slug
    const slug = route.params.slug
    return { i18n, slug }
  },
  data() {
    return {
      selectedStyle: '',
      isGuestMode: true,
      isLoggedIn: false,
      submitting: false,
      dragOver: false,
      showTerms: false,
      showSuccess: false,
      orderNumber: '',
      orderId: null,
      threadId: null,
      calendar: new Calendar({ readOnly: true }),
      calendarData: { year: 2026, month: 3, days: [] },
      // 🔥 画师数据（从 Space API 获取）
      artistData: null,
      artistId: null,
      // 🔥 画风列表（从 Todo API 获取）
      artStyles: [],
      // 🔥 排期数据（从 Todo API 获取）
      scheduleData: [],
      // 🔥 可预约日期列表（仅限在 /todo 中设置的日期可选）
      availableDates: [],
      form: {
        client_name: '',
        contact_type: 'qq',
        contact_value: '',
        usage: '',
        description: '',
        details: '',
        budget: '',
        schedule_date: '',
        files: [],
        agreedTerms: false
      }
    }
  },
  async mounted() {
    this.updateCalendar()
    this.checkLoginStatus()
    await this.loadArtistData() // 🔥 加载画师数据
    await this.loadAvailableDates() // 🔥 加载可预约日期
    this.loadSchedule()
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    weekdays() {
      return this.locale === 'zh'
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    // 🔥 画风列表：仅使用 API 数据（纯文本展示）
    localizedStyles() {
      // 使用从 Todo API 获取的画风数据
      if (this.artStyles.length > 0) {
        return this.artStyles.map(style => ({
          key: `style_${style.id}`,
          name: style.name,
          note: style.note, // 🔥 备注
          price: style.price // 🔥 仅显示设置的价格，没有则不显示
        }))
      }
      
      // 没有画风数据时返回空数组
      return []
    },
    
    // 🔥 约稿条款：优先使用 artistData.commission_rules
    termsSections() {
      // 如果画师设置了 commission_rules，解析它
      if (this.artistData?.commission_rules) {
        return this.parseCommissionRules(this.artistData.commission_rules)
      }
      // 兜底：使用 i18n
      return this.$t('commission.termsSections')
    },
    usageOptions() {
      return [
        { value: '', label: this.$t('commission.usagePlaceholder') },
        { value: 'personal', label: this.$t('commission.usagePersonal') },
        { value: 'commercial', label: this.$t('commission.usageCommercial') },
        { value: 'vtuber', label: 'Vtuber' },
        { value: 'game', label: this.$t('commission.usageGame') },
        { value: 'other', label: this.$t('commission.usageOther') }
      ]
    },
    budgetOptions() {
      return [
        { value: '', label: this.$t('commission.budgetPlaceholder') },
        { value: '100-300', label: '¥100-300' },
        { value: '300-500', label: '¥300-500' },
        { value: '500-800', label: '¥500-800' },
        { value: '800-1500', label: '¥800-1500' },
        { value: '1500+', label: '¥1500+' }
      ]
    },
    calendarTitle() {
      return this.formatCalendarTitle()
    },
    // 🔥 统一日历生成逻辑（与 Home.vue/TodoList.vue 一致）
    calendarDays() {
    const year = this.calendarData.year;
    const month = this.calendarData.month;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    
    const todayStr = new Date().toISOString().split('T')[0];
    const days = [];

    // 上月填充
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isOtherMonth: true });
    }

    // 当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 匹配后端返回的可预约日期数据
      const dateInfo = this.availableDates.find(d => d.date === dateStr);
      
      // 判定逻辑：
      // 1. 存在于列表且未满，且日期没过期 -> 可预约
      const isAvailable = !!dateInfo && !dateInfo.is_full && dateStr >= todayStr;
      // 2. 存在于列表且已满 -> 已满
      const isFull = !!dateInfo && dateInfo.is_full;
      // 3. 没在列表里，或者已经过期 -> 未开放
      const isNotOpened = !isAvailable && !isFull;

      days.push({
        day,
        dateStr,
        isOtherMonth: false,
        isAvailable,
        isFull,
        isNotOpened
      });
    }

    // 下月填充
    const totalCells = startPadding + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isOtherMonth: true });
    }
    return days;
  }
  },
  methods: {
    createStyleImage(color, label) {
      return COMMISSION_IMAGES.stylePlaceholder(label, color)
    },
    handleImageError(e) {
      e.target.src = COMMISSION_IMAGES.loadError
    },
    formatCalendarTitle() {
      const date = new Date(this.calendarData.year, this.calendarData.month - 1, 1)
      const locale = this.locale === 'zh' ? 'zh-CN' : 'en-US'
      const formatted = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long'
      }).format(date)

      return this.locale === 'zh' ? formatted.replace(/\s/g, '') : formatted
    },
    checkLoginStatus() {
      const token = getAccessToken()
      this.isLoggedIn = !!token
      if (this.isLoggedIn) {
        this.isGuestMode = false
      }
    },
    updateCalendar() {
      this.calendarData = this.calendar.getMonthData()
    },
    async changeMonth(delta) {
      this.calendar.changeMonth(delta)
      this.updateCalendar()
      await this.loadAvailableDates() // 🔥 切换月份时重新加载可预约日期
      this.loadSchedule()
    },
    // 🔥 加载画师空间数据（价格、条款等）
    async loadArtistData() {
      if (!this.slug) return
      
      try {
        const response = await fetch(`/api/v1/space/${this.slug}`)
        const data = await response.json()
        
        if (response.ok && data.code === 0) {
          this.artistData = data.data
          this.artistId = data.data.uid
          console.log('[Commission] 画师数据加载成功:', this.artistData.nickname)
          
          // 🔥 加载画风列表
          await this.loadArtStyles()
        } else {
          console.error('[Commission] 获取画师数据失败:', data.message)
        }
      } catch (err) {
        console.error('[Commission] 加载画师数据错误:', err)
      }
    },
    
    // 🔥 加载画风列表（从公开 Todo API）
    async loadArtStyles() {
      try {
        const res = await getPublicArtStylesAPI(this.slug)
        if (res.data && res.data.length > 0) {
          this.artStyles = res.data
          console.log('[Commission] 画风列表加载成功:', this.artStyles.length, '个')
        }
      } catch (err) {
        console.error('[Commission] 加载画风列表失败:', err)
      }
    },
    
    // 🔥 加载可预约日期（包含可预约和已满两种状态）
    // 现在状态由 calendarDays computed 属性自动计算，无需额外处理
    async loadAvailableDates() {
      if (!this.slug) return
      
      try {
        const year = this.calendarData.year
        const month = this.calendarData.month
        
        const res = await getPublicAvailableDatesAPI(this.slug, year, month)
        
        if (res.data) {
          // 保存完整的日期数据（包含 is_full 状态）
          this.availableDates = res.data
          console.log('[Commission] 可预约日期加载成通:', this.availableDates.length, '个', this.availableDates)
        }
      } catch (err) {
        console.error('[Commission] 加载可预约日期失败:', err)
        this.availableDates = []
      }
    },
    
    // 🔥 加载排期数据（从公开 Calendar API）
    // 注：现在主要使用 availableDates 来判断日期可选状态
    async loadSchedule() {
      try {
        const year = this.calendarData.year
        const month = this.calendarData.month
        
        const res = await getPublicSchedulesAPI(this.slug, year, month)
        
        if (res.data?.list) {
          this.scheduleData = res.data.list
          console.log('[Commission] 排期加载成功:', this.scheduleData.length, '个事件')
        }
      } catch (err) {
        console.error('[Commission] 加载排期失败:', err)
        this.scheduleData = []
      }
    },
    
    // 🔥 格式化价格显示
    formatPrice(days) {
      // 简单估算：每天工作量 = 基础价格
      // 实际应该根据画师设置的价格区间计算
      const basePrice = 200 // 基础价格 200元/天工作量
      const minPrice = Math.round(days * basePrice * 0.8)
      const maxPrice = Math.round(days * basePrice * 1.2)
      return `¥${minPrice}-${maxPrice}`
    },
    
    // 🔥 解析约稿条款文本为结构化数据
    parseCommissionRules(rulesText) {
      if (!rulesText) return this.$t('commission.termsSections')
      
      // 简单解析：按换行分割，寻找标题行（以【】或数字开头）
      const lines = rulesText.split('\n').filter(line => line.trim())
      const sections = []
      let currentSection = null
      
      lines.forEach(line => {
        const trimmed = line.trim()
        // 判断是否是标题行
        if (trimmed.startsWith('【') && trimmed.includes('】')) {
          if (currentSection) {
            sections.push(currentSection)
          }
          currentSection = {
            title: trimmed.replace(/【|】/g, ''),
            content: ''
          }
        } else if (trimmed.match(/^\d+\./) || trimmed.match(/^[-•]/)) {
          // 列表项，追加到当前内容
          if (currentSection) {
            currentSection.content += trimmed + '\n'
          }
        } else if (currentSection) {
          currentSection.content += trimmed + '\n'
        }
      })
      
      if (currentSection) {
        sections.push(currentSection)
      }
      
      // 如果没有解析出任何章节，使用整段文本作为一节
      if (sections.length === 0) {
        sections.push({
          title: '约稿须知',
          content: rulesText
        })
      }
      
      return sections
    },
    handleFileChange(e) {
      const files = Array.from(e.target.files)
      this.addFiles(files)
    },
    handleDrop(e) {
      this.dragOver = false
      const files = Array.from(e.dataTransfer.files)
      this.addFiles(files)
    },
    addFiles(files) {
      const imageFiles = files.filter(f => f.type.startsWith('image/'))
      this.form.files.push(...imageFiles)
      if (imageFiles.length < files.length) {
        showToast(this.$t('commission.imageOnlyError'), 'error')
      }
    },
    removeFile(index) {
      this.form.files.splice(index, 1)
    },
    async submitForm() {
      if (!this.selectedStyle) {
        showToast(this.$t('commission.styleRequiredError'), 'error')
        return
      }

      if (!this.form.agreedTerms) {
        showToast(this.$t('commission.termsRequiredError'), 'error')
        return
      }

      if (!this.artistId) {
        showToast('画师信息加载失败，请刷新页面重试', 'error')
        return
      }

      this.submitting = true

      try {
        // 🔥 保存表单数据供消息发送使用（在重置前）
        const submittedFormData = { ...this.form }
        const submittedStyle = this.selectedStyle
        
        // 🔥 构造订单提交数据（符合后端 DTO）
        // 获取画风名称作为订单类型
        const styleName = this.localizedStyles.find(s => s.key === this.selectedStyle)?.name || this.selectedStyle || '未指定'
        // 生成标题：客户名称 + 画风
        const title = `${this.form.client_name || '匿名'}的${styleName}委托`
        // 组合详细描述
        const fullDescription = `【画风】${styleName}
【用途】${this.form.usage || '未填写'}
【预算】${this.form.budget || '未填写'}
【期望排期】${this.form.schedule_date || '未选择'}
【联系方式】${this.form.contact_type} ${this.form.contact_value}
【详细描述】
${this.form.description || '无'}
【备注】
${this.form.details || '无'}`
        
        const orderData = {
          artist_id: this.artistId,
          order_type: styleName,           // 订单类型：画风名称
          title: title,                    // 标题：客户名称 + 画风
          description: fullDescription    // 详细描述（组合所有信息，确保超过10个字符）
          // references 字段省略，后端会处理为 null
        }
        
        // 保存提交的数据供消息发送使用
        this.submittedFormData = submittedFormData
        this.submittedStyle = submittedStyle

        // 🔥 调用后端 API 提交订单
        const response = await fetch('/api/v1/commissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`
          },
          body: JSON.stringify(orderData)
        })

        const data = await response.json()

        if (response.ok && data.code === 0) {
          this.orderNumber = data.data?.order_no || 'ORD' + Date.now()
          this.orderId = data.data?.order_id || null
          this.showSuccess = true
          showToast(this.$t('commission.submittedSuccess'), 'success')
          
          // 🔥 自动创建聊天会话并发送委托消息（在重置表单之前）
          if (this.orderId) {
            await this.sendCommissionMessage()
          }
          
          this.resetForm()
        } else {
          showToast(data.message || this.$t('commission.submitFailed'), 'error')
        }
      } catch (error) {
        console.error('[Commission] 提交订单失败:', error)
        showToast(this.$t('commission.submitFailed'), 'error')
      } finally {
        this.submitting = false
      }
    },
    resetForm() {
      this.form = {
        client_name: '',
        contact_type: 'qq',
        contact_value: '',
        usage: '',
        description: '',
        details: '',
        budget: '',
        schedule_date: '',
        files: [],
        agreedTerms: false
      }
      this.selectedStyle = ''
    },
    copyOrderNumber() {
      navigator.clipboard.writeText(this.orderNumber)
      showToast(this.$t('commission.orderCopied'), 'success')
    },
    
    // 🔥 发送委托消息到聊天
    async sendCommissionMessage() {
      try {
        const token = getAccessToken()
        if (!token) {
          console.log('[Commission] 未登录，跳过发送聊天消息')
          return
        }
        
        // 1. 创建或获取聊天线程
        const threadRes = await fetch('/api/v1/chat/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ order_id: this.orderId })
        })
        
        const threadData = await threadRes.json()
        
        if (!threadRes.ok || threadData.code !== 0) {
          console.error('[Commission] 创建聊天线程失败:', threadData.message)
          return
        }
        
        this.threadId = threadData.data?.thread_id
        console.log('[Commission] 聊天线程创建成功:', this.threadId)
        
        // 2. 拼接委托消息文本
        const styleName = this.localizedStyles.find(s => s.key === this.submittedStyle)?.name || this.submittedStyle || '未选择'
        const messageContent = this.formatCommissionMessage(styleName)
        
        // 3. 发送消息
        const msgRes = await fetch('/api/v1/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            thread_id: this.threadId,
            message_type: 'TEXT',
            content: messageContent
          })
        })
        
        const msgData = await msgRes.json()
        
        if (msgRes.ok && msgData.code === 0) {
          console.log('[Commission] 委托消息发送成功')
        } else {
          console.error('[Commission] 发送消息失败:', msgData.message)
        }
      } catch (error) {
        // 聊天发送失败不影响订单成功提示
        console.error('[Commission] 发送委托消息异常:', error)
      }
    },
    
    // 格式化委托消息
    formatCommissionMessage(styleName) {
      const contactTypeMap = { qq: 'QQ', wechat: '微信', email: '邮箱', other: '其他' }
      const usageMap = { personal: '个人用', commercial: '商用', other: '其他' }
      // 使用保存的提交数据，而不是已被重置的表单
      const formData = this.submittedFormData || this.form
      
      return `【新的委托申请】
订单号：${this.orderNumber}
客户昵称：${formData.client_name || '匿名'}
联系方式：${contactTypeMap[formData.contact_type] || formData.contact_type} ${formData.contact_value}
画风：${styleName}
用途：${usageMap[formData.usage] || formData.usage}
期望排期：${formData.schedule_date || '未选择'}
预算：${formData.budget || '未填写'}
描述：${formData.description || '无'}`
    },
    
    // 跳转到私信页面
    goToChat() {
      if (this.threadId) {
        this.$router.push(`/chat?thread_id=${this.threadId}`)
      } else {
        this.$router.push('/chat')
      }
      this.showSuccess = false
    }
  }
}
</script>

<style scoped>
.commission-section {
  padding: 60px 0;
}

.commission-steps {
  max-width: 800px;
  margin: 0 auto;
}

.step {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: var(--shadow);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.step-number {
  width: 50px;
  height: 50px;
  background: var(--primary-color);
  color: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.step-header h3 {
  font-size: 1.3rem;
  color: var(--text-dark);
}

.login-prompt {
  text-align: center;
  padding: 40px;
  background: var(--bg-light);
  border-radius: var(--radius);
}

.login-prompt p {
  margin-bottom: 15px;
  color: var(--text-muted);
}

/* 联系方式输入 */
.contact-input-group {
  display: flex;
  gap: 10px;
}

.contact-type {
  width: 100px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  background: var(--white);
}

.contact-input-group input {
  flex: 1;
}

/* 日期选择日历 */
.commission-calendar {
  background: var(--white);
  border: 1px solid #e0e0e0;
  border-radius: var(--radius);
  padding: 20px;
  margin-top: 10px;
  width: 100%;
  overflow: hidden;
}

.commission-calendar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  gap: 16px;
}

.commission-calendar__title {
  font-size: 1.2rem;
  color: var(--text-dark);
  margin: 0;
  line-height: 1.2;
}

.commission-calendar__nav {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.commission-calendar__nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: var(--white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.commission-calendar__nav-btn:hover {
  background: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
}

.commission-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.commission-calendar__weekday,
.commission-calendar__day {
  min-width: 0;
}

.commission-calendar__weekday {
  text-align: center;
  font-weight: 600;
  color: var(--text-muted);
  padding: 8px 0;
  font-size: 0.9rem;
}

.commission-calendar__day {
  aspect-ratio: 1 / 1;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.95rem;
  position: relative;
  transition: all 0.2s;
  background: var(--bg-light);
  line-height: 1;
}

.commission-calendar__day:hover:not(.is-other-month):not(.is-not-opened) {
  background: var(--primary-color);
  color: var(--white);
}

.commission-calendar__day.is-other-month {
  color: #ccc;
  background: transparent;
  cursor: default;
}

/* 选中的日期（高亮显示，优先级最高） */
.commission-calendar__day.is-selected {
  background: var(--primary-color) !important;
  color: var(--white) !important;
  font-weight: bold;
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb, 59, 130, 246), 0.3);
  transform: scale(1.05);
  z-index: 1;
}

/* 未开放的日期（灰色禁用状态） */
.commission-calendar__day.is-not-opened {
  background: #f5f5f5;
  color: #bbb;
  cursor: not-allowed;
}

/* 可预约的日期（绿色可选状态） */
.commission-calendar__day.is-available {
  background: #e8f5e9;
  color: #2e7d32;
  cursor: pointer;
}

.commission-calendar__day.is-available:hover {
  background: var(--primary-color);
  color: var(--white);
}

/* 已满的日期（红色禁用状态） */
.commission-calendar__day.is-full {
  background: #ffebee;
  color: #c62828;
  cursor: not-allowed;
}

.date-hint {
  margin-top: 10px;
  color: var(--text-light);
}

.commission-calendar__marker {
  position: absolute;
  bottom: 2px;
  font-size: 0.6rem;
  color: #e74c3c;
  background: #ffebee;
  padding: 0 4px;
  border-radius: 2px;
}

.commission-calendar__marker--available {
  color: #2e7d32;
  background: #c8e6c9;
}

.commission-calendar__marker--full {
  color: #c62828;
  background: #ffcdd2;
}

@media (max-width: 480px) {
  .commission-calendar {
    padding: 16px;
  }

  .commission-calendar__grid {
    gap: 6px;
  }

  .commission-calendar__day {
    min-height: 40px;
    font-size: 0.9rem;
  }
}

/* 文件上传 */
.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--primary-color);
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
}

.file-tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 条款 */
.terms-group {
  margin-top: 25px;
}

.terms-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.terms-label input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
}

.terms-label a {
  color: var(--primary-color);
}

/* 条款弹窗 */
.terms-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.terms-modal-content {
  background: var(--white);
  border-radius: var(--radius);
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.terms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
}

.terms-header h2 {
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.terms-body {
  padding: 30px;
  overflow-y: auto;
  line-height: 1.8;
}

.terms-body h3 {
  margin: 20px 0 10px;
  color: var(--text-dark);
}

.terms-body h3:first-child {
  margin-top: 0;
}

.terms-body p {
  color: var(--text-light);
  margin-bottom: 10px;
}

.terms-footer {
  padding: 20px 30px;
  border-top: 1px solid #eee;
  text-align: right;
}

/* 成功弹窗 */
.success-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.success-modal-content {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px;
  text-align: center;
  max-width: 450px;
  width: 100%;
}

.success-icon {
  width: 70px;
  height: 70px;
  background: #d4edda;
  color: #155724;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 20px;
}

.success-modal-content h2 {
  margin-bottom: 20px;
  color: var(--text-dark);
}

.order-info {
  margin-bottom: 25px;
}

.order-number {
  font-size: 1.8rem;
  font-weight: bold;
  font-family: monospace;
  letter-spacing: 2px;
  color: var(--primary-color);
  margin: 10px 0;
}

.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-chat {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-chat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .step {
    padding: 25px;
  }
  
  .mode-selection {
    flex-direction: column;
    gap: 10px;
  }
  
  .contact-input-group {
    flex-direction: column;
  }
  
  .contact-type {
    width: 100%;
  }
  
  .success-actions {
    flex-direction: column;
  }
}

/* 画风选项样式 - 简朴版 */
.style-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.style-option {
  background: var(--white);
  border: 2px solid #e0e0e0;
  border-radius: var(--radius);
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.style-option:hover {
  border-color: var(--primary-color);
}

.style-option.selected {
  border-color: var(--primary-color);
  background: rgba(107, 142, 107, 0.08);
}

.style-option img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
}

.style-option h4 {
  font-size: 1rem;
  color: var(--text-dark);
  margin-bottom: 6px;
}

.style-option .style-note {
  font-size: 0.8rem;
  color: var(--text-light);
  margin-bottom: 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.style-option .price {
  font-size: 0.95rem;
  color: var(--accent-color);
  font-weight: 600;
}

@media (max-width: 768px) {
  .style-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .style-option {
    padding: 12px;
  }
  
  .style-option img {
    height: 80px;
  }
}
</style>
