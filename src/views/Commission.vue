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
            <div class="style-options">
              <div 
                v-for="style in localizedStyles" 
                :key="style.key"
                class="style-option"
                :class="{ selected: selectedStyle === style.key }"
                @click="selectedStyle = style.key"
              >
                <img :src="style.image" :alt="style.name">
                <h4>{{ style.name }}</h4>
                <p>{{ style.desc }}</p>
                <p class="price"><strong>{{ style.price }}</strong></p>
              </div>
            </div>
          </div>

          <!-- 步骤2：填写委托信息 -->
          <div class="step">
            <div class="step-header">
              <div class="step-number">2</div>
              <h3>{{ $t('commission.step2') }}</h3>
            </div>

            <!-- 委托模式选择 -->
            <div class="mode-selection">
              <label class="mode-option">
                <input type="radio" v-model="isGuestMode" :value="true">
                <span class="mode-label">{{ $t('commission.guestMode') }}</span>
              </label>
              <label class="mode-option">
                <input type="radio" v-model="isGuestMode" :value="false">
                <span class="mode-label">{{ $t('commission.loginMode') }}</span>
              </label>
            </div>

            <!-- 登录提示 -->
            <div v-if="!isGuestMode && !isLoggedIn" class="login-prompt">
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
                      v-for="(day, index) in calendarData.days" 
                      :key="index"
                      class="commission-calendar__day"
                      :class="{ 
                        'is-other-month': day.isOtherMonth, 
                        'is-selected': form.schedule_date === day.date,
                        'is-occupied': day.isOccupied
                      }"
                      @click="!day.isOtherMonth && !day.isOccupied && (form.schedule_date = day.date)"
                    >
                      {{ day.day }}
                      <span v-if="day.isOccupied" class="commission-calendar__marker">{{ $t('commission.occupiedLabel') }}</span>
                    </div>
                  </div>
                </div>
                <p class="date-hint">
                  {{ $t('commission.selectedDate') }}<strong>{{ form.schedule_date || $t('commission.notSelected') }}</strong>
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
          <template v-for="(section, index) in termsSections" :key="section.title">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Calendar } from '../utils/calendar'
import { showToast } from '../utils/eventBus'
import { inject } from 'vue'
import { API_ENDPOINTS, getApiUrl } from '../config/api'

export default {
  name: 'Commission',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
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
      calendar: new Calendar({ readOnly: true }),
      calendarData: { year: 2026, month: 3, days: [] },
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
  mounted() {
    this.updateCalendar()
    this.checkLoginStatus()
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
    localizedStyles() {
      const colors = {
        avatar: '6b8e6b',
        character: 'd4a574',
        illustration: '4a6b4a',
        concept: '8b7355'
      }

      return this.$t('commission.styles').map((style) => ({
        ...style,
        image: this.createStyleImage(colors[style.key], style.placeholder || style.name)
      }))
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
    termsSections() {
      return this.$t('commission.termsSections')
    }
  },
  methods: {
    createStyleImage(color, label) {
      return `https://via.placeholder.com/400x200/${color}/ffffff?text=${encodeURIComponent(label)}`
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
      const token = localStorage.getItem('furest-token')
      this.isLoggedIn = !!token
      if (this.isLoggedIn) {
        this.isGuestMode = false
      }
    },
    updateCalendar() {
      this.calendarData = this.calendar.getMonthData()
    },
    changeMonth(delta) {
      this.calendar.changeMonth(delta)
      this.updateCalendar()
      this.loadSchedule()
    },
    async loadSchedule() {
      // 模拟加载排期数据
      const occupiedDates = ['2026-03-15', '2026-03-16', '2026-03-20', '2026-03-25']
      this.calendarData.days = this.calendarData.days.map(day => ({
        ...day,
        isOccupied: occupiedDates.includes(day.date)
      }))
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

      this.submitting = true

      try {
        const formData = new FormData()
        formData.append('style', this.selectedStyle)
        formData.append('client_name', this.form.client_name)
        formData.append('contact_type', this.form.contact_type)
        formData.append('contact_value', this.form.contact_value)
        formData.append('usage', this.form.usage)
        formData.append('description', this.form.description)
        formData.append('details', this.form.details)
        formData.append('budget', this.form.budget)
        formData.append('schedule_date', this.form.schedule_date)
        formData.append('agreed_terms', this.form.agreedTerms)

        this.form.files.forEach((file, index) => {
          formData.append(`reference_files[${index}]`, file)
        })

        // 调用新 API
        const endpoint = this.isGuestMode ? 
          API_ENDPOINTS.GUEST_COMMISSION : 
          API_ENDPOINTS.GUEST_COMMISSION

        const response = await fetch(getApiUrl(endpoint), {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (response.ok) {
          this.orderNumber = data.order_id || 'ORD' + Date.now()
          this.showSuccess = true
          this.resetForm()
        } else {
          showToast(data.error || this.$t('commission.submitFailed'), 'error')
        }
      } catch (error) {
        // 演示模式
        this.orderNumber = 'ORD' + Date.now()
        this.showSuccess = true
        this.resetForm()
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

/* 模式选择 */
.mode-selection {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  padding: 15px;
  background: var(--bg-light);
  border-radius: var(--radius);
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.mode-option input {
  width: 18px;
  height: 18px;
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

.commission-calendar__day:hover:not(.is-other-month):not(.is-occupied) {
  background: var(--primary-color);
  color: var(--white);
}

.commission-calendar__day.is-other-month {
  color: #ccc;
  background: transparent;
  cursor: default;
}

.commission-calendar__day.is-selected {
  background: var(--primary-color);
  color: var(--white);
  font-weight: bold;
}

.commission-calendar__day.is-occupied {
  background: #ffebee;
  color: #e74c3c;
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
</style>
