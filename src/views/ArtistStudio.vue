<template>
  <div class="studio-page">
    <header class="page-header">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="studio-section">
      <div class="container studio-shell">
        <div class="studio-tabs">
          <button
            type="button"
            class="studio-tab"
            :class="{ active: activeTab === 'profile' }"
            @click="activeTab = 'profile'"
          >
            {{ content.tabProfile }}
          </button>
          <button
            type="button"
            class="studio-tab"
            :class="{ active: activeTab === 'schedule' }"
            @click="activeTab = 'schedule'"
          >
            {{ content.tabSchedule }}
          </button>
        </div>

        <!-- Tab 1: 主页 DIY -->
        <div v-if="activeTab === 'profile'" class="panel">
          <div class="panel-header">
            <h2>{{ content.profileTitle }}</h2>
            <router-link :to="`/artists/${currentUser?.uid}`" class="view-home-link">
              {{ content.viewMyHome }} →
            </router-link>
          </div>

          <div v-if="profileLoading" class="inline-state">{{ content.loading }}</div>
          <form v-else @submit.prevent="saveProfile">
            <div class="form-group">
              <label>{{ content.avatar }}</label>
              <div class="avatar-editor">
                <span class="avatar-preview" :style="avatarPreviewStyle">{{ profileInitial }}</span>
                <div>
                  <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/gif" hidden @change="handleAvatarChange">
                  <button type="button" class="outline-button" :disabled="avatarUploading" @click="$refs.avatarInput.click()">
                    {{ avatarUploading ? content.uploading : content.uploadAvatar }}
                  </button>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="studio-nickname">{{ content.nickname }}</label>
                <input id="studio-nickname" v-model.trim="profile.nickname" type="text" maxlength="50">
              </div>
              <div class="form-group">
                <label for="studio-tags">{{ content.tags }}</label>
                <input id="studio-tags" v-model="tagsInput" type="text" :placeholder="content.tagsPlaceholder">
              </div>
            </div>

            <div class="form-group">
              <label for="studio-bio">{{ content.bio }}</label>
              <textarea id="studio-bio" v-model.trim="profile.bio" rows="3" maxlength="500"></textarea>
            </div>

            <div class="form-group">
              <label for="studio-rules">{{ content.rules }}</label>
              <textarea id="studio-rules" v-model.trim="profile.commission_rules" rows="5" maxlength="2000" :placeholder="content.rulesPlaceholder"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="studio-price-min">{{ content.priceMin }}</label>
                <input id="studio-price-min" v-model.number="priceMinYuan" type="number" min="0" step="1">
              </div>
              <div class="form-group">
                <label for="studio-price-max">{{ content.priceMax }}</label>
                <input id="studio-price-max" v-model.number="priceMaxYuan" type="number" min="0" step="1">
              </div>
            </div>

            <label class="switch-label">
              <input v-model="profile.commission_open" type="checkbox">
              <span>{{ content.commissionOpen }}</span>
            </label>

            <div class="form-group">
              <label>{{ content.portfolio }}</label>
              <div class="portfolio-editor">
                <div v-for="(url, index) in profile.portfolio_urls" :key="url" class="portfolio-thumb">
                  <img :src="assetUrl(url)" :alt="`${index + 1}`" @click="openLightbox(url)">
                  <button type="button" class="remove-thumb" :aria-label="content.removeImage" @click="removePortfolio(index)">×</button>
                </div>
                <button
                  type="button"
                  class="add-thumb"
                  :disabled="portfolioUploading"
                  @click="$refs.portfolioInput.click()"
                >
                  {{ portfolioUploading ? content.uploading : '+' }}
                </button>
                <input ref="portfolioInput" type="file" accept="image/jpeg,image/png,image/gif" hidden @change="handlePortfolioChange">
              </div>
              <small class="field-hint">{{ content.portfolioHint }}</small>
            </div>

            <p v-if="profileError" class="form-error" role="alert">{{ profileError }}</p>
            <button type="submit" class="btn btn-primary submit-btn" :disabled="profileSaving">
              {{ profileSaving ? content.saving : content.save }}
            </button>
          </form>
        </div>

        <!-- Tab 2: 排期管理 -->
        <div v-else class="panel">
          <div class="panel-header">
            <h2>{{ content.scheduleTitle }}</h2>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="scheduleSaving || (!Object.keys(pendingSlots).length && !pendingDeletes.size)"
              @click="saveSchedule"
            >
              {{ scheduleSaving ? content.saving : content.saveChanges }}
            </button>
          </div>

          <div class="calendar">
            <div class="calendar-header">
              <h3>{{ calendarTitle }}</h3>
              <div class="calendar-nav">
                <button type="button" @click="changeMonth(-1)">‹</button>
                <button type="button" @click="changeMonth(1)">›</button>
              </div>
            </div>
            <div v-if="scheduleLoading" class="inline-state">{{ content.loading }}</div>
            <template v-else>
              <div class="calendar-grid">
                <div v-for="day in content.weekdays" :key="day" class="calendar-weekday">{{ day }}</div>
                <div
                  v-for="(day, index) in calendarDays"
                  :key="index"
                  class="calendar-day"
                  :class="dayClass(day)"
                  :title="dayTitle(day)"
                  @click="day.day && openSlotModal(day)"
                >
                  <span class="day-number">{{ day.day || '' }}</span>
                  <span v-if="dayInfo(day)?.note" class="day-note">{{ dayInfo(day).note }}</span>
                  <span v-if="capacityLabel(day)" class="day-capacity">{{ capacityLabel(day) }}</span>
                </div>
              </div>
              <div class="calendar-legend">
                <span><i class="legend-dot available"></i>{{ content.legendAvailable }}</span>
                <span><i class="legend-dot booked"></i>{{ content.legendBooked }}</span>
                <span><i class="legend-dot unavailable"></i>{{ content.legendUnavailable }}</span>
                <span v-if="Object.keys(pendingSlots).length || pendingDeletes.size" class="pending-hint">
                  {{ content.pendingHint(pendingCount) }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- 排期编辑弹层 -->
    <div v-if="slotModal" class="modal-backdrop" @click.self="closeSlotModal">
      <section class="slot-modal" role="dialog" aria-modal="true">
        <header>
          <h2>{{ slotModal.dateStr }}</h2>
          <button type="button" :aria-label="content.close" @click="closeSlotModal">×</button>
        </header>
        <div class="slot-form">
          <div class="form-group">
            <label>{{ content.slotStatus }}</label>
            <div class="status-options">
              <button
                v-for="option in statusOptions"
                :key="option.value"
                type="button"
                class="status-option"
                :class="[{ selected: slotModal.status === option.value }, option.value.toLowerCase()]"
                @click="slotModal.status = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="slot-capacity">{{ content.slotCapacity }}</label>
            <input id="slot-capacity" v-model.number="slotModal.total_capacity" type="number" min="1" max="99">
            <small v-if="slotModal.booked_count" class="field-hint">
              {{ content.bookedCount(slotModal.booked_count) }}
            </small>
          </div>
          <div class="form-group">
            <label for="slot-note">{{ content.slotNote }}</label>
            <input id="slot-note" v-model.trim="slotModal.note" type="text" maxlength="500" :placeholder="content.slotNotePlaceholder">
          </div>
        </div>
        <footer>
          <button v-if="slotModal.hasExisting" type="button" class="danger-button" @click="stageDelete">
            {{ content.clearDay }}
          </button>
          <span class="footer-spacer"></span>
          <button type="button" class="outline-button" @click="closeSlotModal">{{ content.cancel }}</button>
          <button type="button" class="btn btn-primary" @click="stageSlot">{{ content.confirm }}</button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS, getAssetUrl } from '../config/api'
import { apiRequest, eventBus, showToast } from '../utils/eventBus'
import { getCurrentUser } from '../utils/auth'

const CONTENT = {
  zh: {
    title: '画师工作台',
    subtitle: '管理你的公开主页与排期',
    tabProfile: '主页设置',
    tabSchedule: '排期管理',
    profileTitle: '公开主页资料',
    viewMyHome: '查看我的主页',
    loading: '加载中...',
    avatar: '头像',
    uploadAvatar: '上传头像',
    uploading: '上传中...',
    nickname: '昵称',
    tags: '标签',
    tagsPlaceholder: '用逗号分隔，如：头像, 立绘, 插图',
    bio: '个人简介',
    rules: '约稿须知',
    rulesPlaceholder: '接单范围、工期、修改次数等说明',
    priceMin: '价格下限（元）',
    priceMax: '价格上限（元）',
    commissionOpen: '开放约稿',
    portfolio: '作品墙',
    portfolioHint: '点击图片可预览，最多 20 张',
    removeImage: '移除图片',
    save: '保存',
    saving: '保存中...',
    saved: '主页资料已保存',
    saveFailed: '保存失败',
    uploadFailed: '图片上传失败',
    invalidImage: '仅支持 JPG、PNG 或 GIF 图片',
    scheduleTitle: '排期管理',
    saveChanges: '保存全部修改',
    scheduleSaved: '排期已保存',
    legendAvailable: '可约',
    legendBooked: '约满',
    legendUnavailable: '休息',
    pendingHint: (n) => `${n} 项修改待保存`,
    slotStatus: '状态',
    slotCapacity: '当日容量（单数）',
    slotNote: '备注',
    slotNotePlaceholder: '可选，公开展示',
    bookedCount: (n) => `已约 ${n} 单`,
    clearDay: '清除该天',
    cancel: '取消',
    confirm: '确定',
    close: '关闭',
    weekdays: ['日', '一', '二', '三', '四', '五', '六']
  },
  en: {
    title: 'Artist Studio',
    subtitle: 'Manage your public profile and schedule',
    tabProfile: 'Profile',
    tabSchedule: 'Schedule',
    profileTitle: 'Public Profile',
    viewMyHome: 'View my page',
    loading: 'Loading...',
    avatar: 'Avatar',
    uploadAvatar: 'Upload avatar',
    uploading: 'Uploading...',
    nickname: 'Nickname',
    tags: 'Tags',
    tagsPlaceholder: 'Comma separated, e.g. avatar, character, illustration',
    bio: 'Bio',
    rules: 'Commission Rules',
    rulesPlaceholder: 'Scope, turnaround, revision policy, etc.',
    priceMin: 'Price min (CNY)',
    priceMax: 'Price max (CNY)',
    commissionOpen: 'Open for commissions',
    portfolio: 'Portfolio',
    portfolioHint: 'Click an image to preview, up to 20 images',
    removeImage: 'Remove image',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Profile saved.',
    saveFailed: 'Save failed',
    uploadFailed: 'Image upload failed',
    invalidImage: 'Only JPG, PNG, or GIF images are supported.',
    scheduleTitle: 'Schedule',
    saveChanges: 'Save All Changes',
    scheduleSaved: 'Schedule saved.',
    legendAvailable: 'Available',
    legendBooked: 'Booked',
    legendUnavailable: 'Unavailable',
    pendingHint: (n) => `${n} change(s) pending`,
    slotStatus: 'Status',
    slotCapacity: 'Daily capacity',
    slotNote: 'Note',
    slotNotePlaceholder: 'Optional, shown publicly',
    bookedCount: (n) => `${n} booked`,
    clearDay: 'Clear this day',
    cancel: 'Cancel',
    confirm: 'OK',
    close: 'Close',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  }
}

const STATUS_CLASS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  UNAVAILABLE: 'unavailable'
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif'])

export default {
  name: 'ArtistStudio',
  setup() {
    return { i18n: inject('i18n') }
  },
  data() {
    const now = new Date()
    return {
      currentUser: getCurrentUser(),
      activeTab: 'profile',
      profileLoading: false,
      profileSaving: false,
      profileError: '',
      avatarUploading: false,
      portfolioUploading: false,
      profile: {
        nickname: '',
        avatar_url: '',
        bio: '',
        commission_rules: '',
        commission_open: false,
        portfolio_urls: []
      },
      tagsInput: '',
      priceMinYuan: null,
      priceMaxYuan: null,
      scheduleLoading: false,
      scheduleSaving: false,
      slots: {},
      pendingSlots: {},
      pendingDeletes: new Set(),
      slotModal: null,
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth() + 1
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return CONTENT[this.locale]
    },
    statusOptions() {
      return [
        { value: 'AVAILABLE', label: this.content.legendAvailable },
        { value: 'BOOKED', label: this.content.legendBooked },
        { value: 'UNAVAILABLE', label: this.content.legendUnavailable }
      ]
    },
    avatarPreviewStyle() {
      const url = getAssetUrl(this.profile.avatar_url)
      return url ? { backgroundImage: `url("${url.replace(/"/g, '%22')}")` } : {}
    },
    profileInitial() {
      return String(this.profile.nickname || 'A').slice(0, 1).toUpperCase()
    },
    monthKey() {
      return `${this.viewYear}-${String(this.viewMonth).padStart(2, '0')}`
    },
    calendarTitle() {
      const date = new Date(this.viewYear, this.viewMonth - 1, 1)
      if (this.locale === 'zh') {
        return `${this.viewYear}年${this.viewMonth}月`
      }
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
    },
    calendarDays() {
      const first = new Date(this.viewYear, this.viewMonth - 1, 1)
      const daysInMonth = new Date(this.viewYear, this.viewMonth, 0).getDate()
      const days = []
      for (let i = 0; i < first.getDay(); i += 1) {
        days.push({ day: null, dateStr: null })
      }
      for (let d = 1; d <= daysInMonth; d += 1) {
        days.push({ day: d, dateStr: `${this.monthKey}-${String(d).padStart(2, '0')}` })
      }
      return days
    },
    pendingCount() {
      return Object.keys(this.pendingSlots).length + this.pendingDeletes.size
    }
  },
  mounted() {
    this.loadProfile()
    this.loadSchedule()
  },
  methods: {
    async loadProfile() {
      this.profileLoading = true
      try {
        const data = await apiRequest(API_ENDPOINTS.ME_ARTIST_PROFILE)
        this.profile = {
          nickname: data?.nickname || '',
          avatar_url: data?.avatar_url || '',
          bio: data?.bio || '',
          commission_rules: data?.commission_rules || '',
          commission_open: Boolean(data?.commission_open),
          portfolio_urls: Array.isArray(data?.portfolio_urls) ? [...data.portfolio_urls] : []
        }
        this.tagsInput = Array.isArray(data?.tags) ? data.tags.join(', ') : ''
        this.priceMinYuan = data?.price_range_min ? data.price_range_min / 100 : null
        this.priceMaxYuan = data?.price_range_max ? data.price_range_max / 100 : null
      } catch {
        // apiRequest 已提示错误
      } finally {
        this.profileLoading = false
      }
    },
    parseTags() {
      return this.tagsInput
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    },
    async uploadImage(file) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        showToast(this.content.invalidImage, 'error')
        return null
      }
      const body = new FormData()
      body.append('file', file)
      try {
        const uploaded = await apiRequest(API_ENDPOINTS.UPLOAD, { method: 'POST', body, showError: false })
        return uploaded.url
      } catch (error) {
        showToast(error.message || this.content.uploadFailed, 'error')
        return null
      }
    },
    async handleAvatarChange(event) {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      this.avatarUploading = true
      const url = await this.uploadImage(file)
      this.avatarUploading = false
      if (url) this.profile.avatar_url = url
    },
    async handlePortfolioChange(event) {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      this.portfolioUploading = true
      const url = await this.uploadImage(file)
      this.portfolioUploading = false
      if (url) this.profile.portfolio_urls.push(url)
    },
    removePortfolio(index) {
      this.profile.portfolio_urls.splice(index, 1)
    },
    openLightbox(path) {
      eventBus.emit('open-lightbox', getAssetUrl(path))
    },
    assetUrl(path) {
      return getAssetUrl(path)
    },
    async saveProfile() {
      this.profileError = ''
      this.profileSaving = true
      try {
        await apiRequest(API_ENDPOINTS.ME_ARTIST_PROFILE, {
          method: 'PATCH',
          body: {
            nickname: this.profile.nickname,
            avatar_url: this.profile.avatar_url,
            bio: this.profile.bio,
            artist_tags: this.parseTags(),
            commission_rules: this.profile.commission_rules,
            price_range_min: Math.round((this.priceMinYuan || 0) * 100),
            price_range_max: Math.round((this.priceMaxYuan || 0) * 100),
            commission_open: this.profile.commission_open,
            portfolio_urls: this.profile.portfolio_urls
          }
        })
        showToast(this.content.saved, 'success')
      } catch (error) {
        this.profileError = error.message || this.content.saveFailed
      } finally {
        this.profileSaving = false
      }
    },

    // ---- 排期管理 ----
    async loadSchedule() {
      this.scheduleLoading = true
      try {
        const data = await apiRequest(`${API_ENDPOINTS.ME_SCHEDULE}?month=${this.monthKey}`)
        const map = {}
        for (const slot of data?.slots || []) {
          map[slot.slot_date] = slot
        }
        this.slots = map
        this.pendingSlots = {}
        this.pendingDeletes = new Set()
      } catch {
        this.slots = {}
      } finally {
        this.scheduleLoading = false
      }
    },
    changeMonth(delta) {
      let month = this.viewMonth + delta
      let year = this.viewYear
      if (month < 1) {
        month = 12
        year -= 1
      } else if (month > 12) {
        month = 1
        year += 1
      }
      this.viewYear = year
      this.viewMonth = month
      this.loadSchedule()
    },
    dayInfo(day) {
      if (!day.dateStr) return null
      if (this.pendingDeletes.has(day.dateStr)) return null
      return this.pendingSlots[day.dateStr] || this.slots[day.dateStr] || null
    },
    dayClass(day) {
      if (!day.day) return 'empty'
      const classes = []
      if (this.pendingSlots[day.dateStr] || this.pendingDeletes.has(day.dateStr)) classes.push('pending')
      const info = this.dayInfo(day)
      if (info) classes.push(STATUS_CLASS[info.status] || '')
      return classes.join(' ')
    },
    dayTitle(day) {
      const info = this.dayInfo(day)
      if (!info) return ''
      const labels = {
        AVAILABLE: this.content.legendAvailable,
        BOOKED: this.content.legendBooked,
        UNAVAILABLE: this.content.legendUnavailable
      }
      const status = labels[info.status] || info.status
      return info.note ? `${status}: ${info.note}` : status
    },
    capacityLabel(day) {
      const info = this.dayInfo(day)
      if (!info) return ''
      const total = info.total_capacity
      const booked = this.slots[day.dateStr]?.booked_count || 0
      if (!total) return booked ? `${booked}` : ''
      return booked ? `${booked}/${total}` : `${total}`
    },
    openSlotModal(day) {
      const existing = this.slots[day.dateStr]
      const staged = this.pendingSlots[day.dateStr]
      const source = staged || existing
      this.slotModal = {
        dateStr: day.dateStr,
        status: source?.status || 'AVAILABLE',
        note: source?.note || '',
        total_capacity: source?.total_capacity || 1,
        booked_count: existing?.booked_count || 0,
        hasExisting: Boolean(existing) || this.pendingDeletes.has(day.dateStr)
      }
    },
    closeSlotModal() {
      this.slotModal = null
    },
    stageSlot() {
      const modal = this.slotModal
      if (!modal) return
      const capacity = Math.max(1, Math.min(99, Number(modal.total_capacity) || 1))
      const next = { ...this.pendingSlots }
      next[modal.dateStr] = {
        slot_date: modal.dateStr,
        status: modal.status,
        note: modal.note,
        total_capacity: capacity
      }
      this.pendingSlots = next
      this.pendingDeletes = new Set([...this.pendingDeletes].filter((d) => d !== modal.dateStr))
      this.closeSlotModal()
    },
    stageDelete() {
      const modal = this.slotModal
      if (!modal) return
      const next = { ...this.pendingSlots }
      delete next[modal.dateStr]
      this.pendingSlots = next
      if (this.slots[modal.dateStr]) {
        this.pendingDeletes = new Set([...this.pendingDeletes, modal.dateStr])
      }
      this.closeSlotModal()
    },
    async saveSchedule() {
      this.scheduleSaving = true
      try {
        const staged = Object.values(this.pendingSlots)
        if (staged.length) {
          await apiRequest(API_ENDPOINTS.ME_SCHEDULE, {
            method: 'PUT',
            body: { slots: staged }
          })
        }
        for (const date of this.pendingDeletes) {
          await apiRequest(API_ENDPOINTS.ME_SCHEDULE_DATE(date), { method: 'DELETE' })
        }
        showToast(this.content.scheduleSaved, 'success')
        await this.loadSchedule()
      } catch {
        // apiRequest 已提示错误
      } finally {
        this.scheduleSaving = false
      }
    }
  }
}
</script>

<style scoped>
.studio-section {
  padding: 64px 0 96px;
}

.studio-shell {
  max-width: 920px;
}

.studio-tabs {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 48px;
}

.studio-tab {
  padding: 8px 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-muted);
  transition: var(--transition);
}

.studio-tab:hover,
.studio-tab.active {
  color: var(--primary-color);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.panel-header h2 {
  font-size: 1.3rem;
}

.view-home-link {
  color: var(--primary-color);
  font-weight: 600;
  white-space: nowrap;
  transition: var(--transition);
}

.view-home-link:hover {
  color: var(--primary-dark);
}

.inline-state {
  padding: 48px 0;
  text-align: center;
  color: var(--text-muted);
}

.field-hint {
  display: block;
  margin-top: 6px;
  color: var(--text-muted);
}

.avatar-editor {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-preview {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  background: #F5F5F5 center/cover no-repeat;
  color: var(--text-muted);
  font-size: 1.5rem;
  font-weight: 700;
  border-radius: 50%;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 25px;
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
}

.switch-label input {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
}

.portfolio-editor {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.portfolio-thumb {
  position: relative;
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.portfolio-thumb img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
  cursor: zoom-in;
}

.remove-thumb {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: var(--white);
  cursor: pointer;
}

.add-thumb {
  height: 100px;
  border: 1px dashed #E5E5E5;
  background: var(--white);
  border-radius: var(--radius-sm);
  font-size: 1.6rem;
  color: var(--primary-color);
  cursor: pointer;
  transition: var(--transition);
}

.add-thumb:hover:not(:disabled) {
  border-color: var(--primary-color);
}

.add-thumb:disabled {
  opacity: 0.5;
  cursor: default;
  font-size: 0.9rem;
}

.form-error {
  margin: 0 0 16px;
  color: #B91C1C;
}

.submit-btn {
  width: 100%;
}

/* 排期日历 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-header h3 {
  font-size: 1.15rem;
  color: var(--text-dark);
}

.calendar-nav {
  display: flex;
  gap: 10px;
}

.calendar-nav button {
  background: var(--white);
  border: 1px solid #E5E5E5;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.calendar-nav button:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.calendar-weekday {
  text-align: center;
  font-weight: 600;
  color: var(--text-muted);
  padding: 8px 0;
  font-size: 0.85rem;
}

.calendar-day {
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  background: #FAFAFA;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
}

.calendar-day:hover:not(.empty) {
  box-shadow: inset 0 0 0 1px var(--primary-color);
}

.calendar-day.empty {
  background: transparent;
  cursor: default;
}

.calendar-day.available {
  background: #EFF6FF;
  color: #1D4ED8;
}

.calendar-day.booked {
  background: #F5F5F5;
  color: var(--text-muted);
}

.calendar-day.unavailable {
  background: #FEF2F2;
  color: #B91C1C;
}

.calendar-day.pending {
  box-shadow: inset 0 0 0 2px var(--primary-color);
}

.day-number {
  font-weight: 700;
}

.day-note {
  margin-top: 3px;
  font-size: 0.68rem;
  line-height: 1.3;
  text-align: center;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.day-capacity {
  margin-top: 2px;
  font-size: 0.68rem;
  opacity: 0.8;
}

.calendar-legend {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 24px;
  color: var(--text-light);
  font-size: 0.85rem;
}

.calendar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.legend-dot.available { background: #EFF6FF; border: 1px solid #93C5FD; }
.legend-dot.booked { background: #F5F5F5; border: 1px solid #D4D4D4; }
.legend-dot.unavailable { background: #FEF2F2; border: 1px solid #FCA5A5; }

.pending-hint {
  margin-left: auto;
  color: var(--primary-color);
  font-weight: 600;
}

/* 弹层 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
}

.slot-modal {
  width: min(100%, 440px);
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow-hover);
  overflow: hidden;
}

.slot-modal header {
  padding: 20px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slot-modal header h2 {
  font-size: 1.1rem;
}

.slot-modal header button {
  width: 34px;
  height: 34px;
  border: 0;
  background: transparent;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: var(--transition);
}

.slot-modal header button:hover {
  color: var(--text-dark);
}

.slot-form {
  padding: 20px 24px;
}

.status-options {
  display: flex;
  gap: 10px;
}

.status-option {
  flex: 1;
  padding: 10px;
  border: 1px solid #E5E5E5;
  background: var(--white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.status-option:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.status-option.selected.available { background: #EFF6FF; border-color: #93C5FD; color: #1D4ED8; }
.status-option.selected.booked { background: #F5F5F5; border-color: #D4D4D4; color: var(--text-dark); }
.status-option.selected.unavailable { background: #FEF2F2; border-color: #FCA5A5; color: #B91C1C; }

.slot-modal footer {
  padding: 0 24px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-spacer {
  flex: 1;
}

.danger-button {
  padding: 10px 16px;
  border: 1px solid #FCA5A5;
  background: var(--white);
  color: #B91C1C;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.danger-button:hover {
  background: #FEF2F2;
}

@media (max-width: 768px) {
  .studio-section {
    padding: 32px 0 64px;
  }

  .studio-tabs {
    gap: 24px;
    margin-bottom: 32px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .calendar-day {
    min-height: 56px;
  }

  .day-note {
    display: none;
  }
}
</style>
