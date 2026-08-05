<template>
  <main class="commission-page fade-in">
    <header class="page-header">
      <div class="container">
        <h1>{{ $t('commission.title') }}</h1>
        <p>{{ $t('commission.subtitle') }}</p>
      </div>
    </header>

    <section class="commission-section">
      <div class="container commission-shell">
        <div v-if="!['CLIENT', 'ARTIST'].includes(currentUser?.role)" class="notice notice-error">
          {{ copy.clientOnly }}
        </div>

        <template v-else>
          <section class="step-panel">
            <div class="step-heading">
              <span class="step-number">1</span>
              <div>
                <h2>{{ copy.chooseArtist }}</h2>
                <p>{{ copy.chooseArtistHint }}</p>
              </div>
            </div>

            <div v-if="loadingArtists" class="inline-state">{{ copy.loadingArtists }}</div>
            <div v-else-if="artists.length" class="artist-grid">
              <button
                v-for="artist in artists"
                :key="artist.uid"
                type="button"
                class="artist-option"
                :class="{ selected: selectedArtistId === artist.uid }"
                @click="selectedArtistId = artist.uid"
              >
                <span class="avatar" :style="avatarStyle(artist)">{{ artistInitial(artist) }}</span>
                <span class="artist-details">
                  <strong>{{ artist.nickname }}</strong>
                  <small>{{ artist.bio || copy.artistFallbackBio }}</small>
                  <span v-if="artist.tags?.length" class="tag-row">
                    <span v-for="tag in artist.tags" :key="tag">{{ tag }}</span>
                  </span>
                </span>
                <span class="artist-price">{{ formatPriceRange(artist) }}</span>
              </button>
            </div>
            <div v-else class="inline-state error-state">
              <p>{{ artistError || copy.noArtists }}</p>
              <button type="button" class="text-button" @click="loadArtists">{{ copy.retry }}</button>
            </div>

            <div class="type-heading">
              <h3>{{ $t('commission.step1') }}</h3>
            </div>
            <div class="style-options">
              <button
                v-for="style in localizedStyles"
                :key="style.key"
                type="button"
                class="style-option"
                :class="{ selected: selectedStyle === style.key }"
                @click="selectedStyle = style.key"
              >
                <img :src="style.image" :alt="style.name">
                <span class="style-copy">
                  <strong>{{ style.name }}</strong>
                  <small>{{ style.desc }}</small>
                </span>
                <span class="style-price">{{ style.price }}</span>
              </button>
            </div>
          </section>

          <section class="step-panel">
            <div class="step-heading">
              <span class="step-number">2</span>
              <div>
                <h2>{{ $t('commission.step2') }}</h2>
                <p>{{ copy.formHint }}</p>
              </div>
            </div>

            <form @submit.prevent="submitForm">
              <div class="form-row">
                <div class="form-group">
                  <label for="commission-title">{{ copy.title }} <span class="required">*</span></label>
                  <input
                    id="commission-title"
                    v-model.trim="form.title"
                    type="text"
                    minlength="2"
                    maxlength="200"
                    required
                    :placeholder="copy.titlePlaceholder"
                  >
                </div>
                <div class="form-group">
                  <label for="commission-usage">{{ $t('commission.usage') }} <span class="required">*</span></label>
                  <select id="commission-usage" v-model="form.usage" required>
                    <option v-for="option in usageOptions" :key="option.value || 'empty'" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="commission-description">{{ $t('commission.description') }} <span class="required">*</span></label>
                <textarea
                  id="commission-description"
                  v-model.trim="form.description"
                  rows="7"
                  minlength="10"
                  maxlength="4200"
                  required
                  :placeholder="$t('commission.descriptionPlaceholder')"
                ></textarea>
                <span class="field-counter">{{ form.description.length }}/4200</span>
              </div>

              <div class="form-group">
                <label for="commission-details">{{ $t('commission.details') }}</label>
                <textarea
                  id="commission-details"
                  v-model.trim="form.details"
                  rows="4"
                  maxlength="500"
                  :placeholder="$t('commission.detailsPlaceholder')"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="commission-date">{{ $t('commission.schedule') }}</label>
                  <input id="commission-date" v-model="form.scheduleDate" type="date" :min="today">
                </div>
                <div class="form-group">
                  <label for="commission-budget">{{ $t('commission.budget') }}</label>
                  <select id="commission-budget" v-model="form.budget">
                    <option v-for="option in budgetOptions" :key="option.value || 'empty'" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>{{ $t('commission.uploadRef') }}</label>
                <div
                  class="file-upload"
                  :class="{ 'has-file': form.files.length, 'drag-over': dragOver }"
                  @click="$refs.fileInput.click()"
                  @drop.prevent="handleDrop"
                  @dragover.prevent="dragOver = true"
                  @dragleave.prevent="dragOver = false"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    multiple
                    @change="handleFileChange"
                  >
                  <span class="upload-symbol">+</span>
                  <p>{{ copy.uploadHint }}</p>
                  <small>{{ copy.uploadLimit }}</small>
                </div>
                <ul v-if="form.files.length" class="file-list">
                  <li v-for="(file, index) in form.files" :key="`${file.name}-${file.lastModified}`">
                    <span>{{ file.name }}</span>
                    <small>{{ formatFileSize(file.size) }}</small>
                    <button type="button" :aria-label="copy.removeFile" @click="removeFile(index)">×</button>
                  </li>
                </ul>
              </div>

              <label class="terms-label">
                <input v-model="form.agreedTerms" type="checkbox" required>
                <span>
                  {{ $t('commission.terms') }}
                  <button type="button" class="terms-link" @click="showTerms = true">{{ $t('commission.termsLink') }}</button>
                </span>
              </label>

              <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
              <button
                type="submit"
                class="btn btn-primary submit-btn"
                :disabled="submitting || !artists.length"
              >
                {{ submitting ? copy.submittingProgress : $t('commission.submit') }}
              </button>
            </form>
          </section>
        </template>
      </div>
    </section>

    <div v-if="showTerms" class="modal-backdrop" @click.self="showTerms = false">
      <section class="terms-modal" role="dialog" aria-modal="true" :aria-label="$t('commission.termsTitle')">
        <header>
          <h2>{{ $t('commission.termsTitle') }}</h2>
          <button type="button" :aria-label="$t('common.close')" @click="showTerms = false">×</button>
        </header>
        <div class="terms-body">
          <template v-for="(section, index) in termsSections" :key="section.title">
            <h3>{{ index + 1 }}. {{ section.title }}</h3>
            <p>{{ section.content }}</p>
          </template>
        </div>
        <footer>
          <button type="button" class="btn btn-primary" @click="acceptTerms">{{ $t('commission.termsAgree') }}</button>
        </footer>
      </section>
    </div>

    <div v-if="showSuccess" class="modal-backdrop" @click.self="showSuccess = false">
      <section class="success-modal" role="dialog" aria-modal="true">
        <span class="success-mark">✓</span>
        <h2>{{ $t('commission.submittedSuccess') }}</h2>
        <p>{{ $t('commission.orderNumber') }}</p>
        <strong>{{ orderNumber }}</strong>
        <p class="success-hint">{{ $t('commission.orderNumberHint') }}</p>
        <div class="success-actions">
          <router-link :to="`/orders?order=${encodeURIComponent(orderNumber)}`" class="btn btn-primary">
            {{ $t('order.query') }}
          </router-link>
          <button type="button" class="outline-button" @click="copyOrderNumber">
            {{ $t('commission.copyOrderNumber') }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS, getAssetUrl } from '../config/api'
import { apiRequest, showToast } from '../utils/eventBus'
import { getCurrentUser } from '../utils/auth'

const COPY = {
  zh: {
    chooseArtist: '选择画师',
    chooseArtistHint: '从已认证且开放约稿的画师中选择合作对象',
    loadingArtists: '正在加载可约稿画师...',
    noArtists: '当前没有开放约稿的画师，请稍后再试。',
    retry: '重新加载',
    artistFallbackBio: '已认证画师',
    formHint: '详细需求会帮助画师更准确地评估报价和工期',
    title: '委托标题',
    titlePlaceholder: '例如：原创角色半身头像',
    uploadHint: '点击或拖拽图片到这里',
    uploadLimit: 'JPG、PNG 或 GIF，单张不超过 10MB，最多 9 张',
    removeFile: '移除文件',
    clientOnly: '只有委托人和画师账号可以提交新委托。',
    chooseArtistError: '请选择画师',
    chooseTypeError: '请选择委托类型',
    descriptionTooLong: '组合后的需求内容超过 5000 字，请精简描述或细节。',
    invalidFileType: '仅支持 JPG、PNG 或 GIF 图片',
    fileTooLarge: '单张图片不能超过 10MB',
    tooManyFiles: '参考图最多上传 9 张',
    submittingProgress: '正在上传并提交...',
    created: '委托已提交',
    copyFailed: '复制失败，请手动记录订单号',
    artistLoadFailed: '无法加载画师列表'
  },
  en: {
    chooseArtist: 'Choose an artist',
    chooseArtistHint: 'Select from verified artists who are currently open for commissions',
    loadingArtists: 'Loading available artists...',
    noArtists: 'No artists are accepting commissions right now. Please try again later.',
    retry: 'Try again',
    artistFallbackBio: 'Verified artist',
    formHint: 'A clear brief helps the artist estimate pricing and delivery time',
    title: 'Commission title',
    titlePlaceholder: 'Example: Original character portrait',
    uploadHint: 'Click or drag reference images here',
    uploadLimit: 'JPG, PNG, or GIF; up to 10MB each and 9 files total',
    removeFile: 'Remove file',
    clientOnly: 'Only client and artist accounts can submit a new commission.',
    chooseArtistError: 'Choose an artist first.',
    chooseTypeError: 'Choose a commission type first.',
    descriptionTooLong: 'The combined brief exceeds 5,000 characters. Shorten the description or notes.',
    invalidFileType: 'Only JPG, PNG, or GIF images are supported.',
    fileTooLarge: 'Each image must be 10MB or smaller.',
    tooManyFiles: 'You can upload up to 9 reference images.',
    submittingProgress: 'Uploading and submitting...',
    created: 'Commission submitted.',
    copyFailed: 'Copy failed. Please record the order number manually.',
    artistLoadFailed: 'Unable to load artists.'
  }
}

const STYLE_IMAGES = {
  avatar: '/images/art-avatar.jpg',
  character: '/images/art-character.jpg',
  illustration: '/images/art-scene.jpg',
  concept: '/images/art-concept.jpg'
}

export default {
  name: 'Commission',
  setup() {
    return { i18n: inject('i18n') }
  },
  data() {
    return {
      currentUser: getCurrentUser(),
      artists: [],
      loadingArtists: false,
      artistError: '',
      selectedArtistId: null,
      selectedStyle: '',
      submitting: false,
      dragOver: false,
      showTerms: false,
      showSuccess: false,
      orderNumber: '',
      formError: '',
      form: this.emptyForm()
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    copy() {
      return COPY[this.locale]
    },
    localizedStyles() {
      return this.$t('commission.styles').map((style) => ({ ...style, image: STYLE_IMAGES[style.key] }))
    },
    selectedStyleData() {
      return this.localizedStyles.find((style) => style.key === this.selectedStyle)
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
    termsSections() {
      return this.$t('commission.termsSections')
    },
    today() {
      const now = new Date()
      const offset = now.getTimezoneOffset() * 60000
      return new Date(now.getTime() - offset).toISOString().slice(0, 10)
    }
  },
  mounted() {
    if (['CLIENT', 'ARTIST'].includes(this.currentUser?.role)) this.loadArtists()
  },
  methods: {
    emptyForm() {
      return {
        title: '',
        usage: '',
        description: '',
        details: '',
        budget: '',
        scheduleDate: '',
        files: [],
        agreedTerms: false
      }
    },
    async loadArtists() {
      this.loadingArtists = true
      this.artistError = ''
      try {
        const data = await apiRequest(API_ENDPOINTS.SITE_HOME, { auth: false, showError: false })
        this.artists = Array.isArray(data?.featured_artists) ? data.featured_artists : []
        if (!this.selectedArtistId && this.artists.length) this.selectedArtistId = this.artists[0].uid
      } catch (error) {
        this.artistError = error.message || this.copy.artistLoadFailed
      } finally {
        this.loadingArtists = false
      }
    },
    avatarStyle(artist) {
      const url = getAssetUrl(artist.avatar_url)
      return url ? { backgroundImage: `url("${url.replace(/"/g, '%22')}")` } : {}
    },
    artistInitial(artist) {
      return String(artist.nickname || 'A').slice(0, 1).toUpperCase()
    },
    formatPriceRange(artist) {
      if (!artist.price_range_min && !artist.price_range_max) return this.locale === 'zh' ? '价格面议' : 'Ask for quote'
      const min = Math.round((artist.price_range_min || 0) / 100)
      const max = Math.round((artist.price_range_max || artist.price_range_min || 0) / 100)
      return `¥${min}-${max}`
    },
    handleFileChange(event) {
      this.addFiles(Array.from(event.target.files || []))
      event.target.value = ''
    },
    handleDrop(event) {
      this.dragOver = false
      this.addFiles(Array.from(event.dataTransfer.files || []))
    },
    addFiles(files) {
      const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif'])
      let rejectedType = false
      let rejectedSize = false
      const accepted = files.filter((file) => {
        if (!allowedTypes.has(file.type)) {
          rejectedType = true
          return false
        }
        if (file.size > 10 * 1024 * 1024) {
          rejectedSize = true
          return false
        }
        return true
      })
      const availableSlots = 9 - this.form.files.length
      this.form.files.push(...accepted.slice(0, availableSlots))
      if (rejectedType) showToast(this.copy.invalidFileType, 'error')
      if (rejectedSize) showToast(this.copy.fileTooLarge, 'error')
      if (accepted.length > availableSlots) showToast(this.copy.tooManyFiles, 'error')
    },
    removeFile(index) {
      this.form.files.splice(index, 1)
    },
    formatFileSize(bytes) {
      return bytes < 1024 * 1024
        ? `${Math.max(1, Math.round(bytes / 1024))} KB`
        : `${(bytes / 1024 / 1024).toFixed(1)} MB`
    },
    buildDescription() {
      const labels = this.locale === 'zh'
        ? { usage: '作品用途', budget: '预算范围', date: '期望日期', details: '补充细节' }
        : { usage: 'Usage', budget: 'Budget', date: 'Preferred date', details: 'Additional details' }
      const usageLabel = this.usageOptions.find((option) => option.value === this.form.usage)?.label || this.form.usage
      const metadata = [
        `${labels.usage}: ${usageLabel}`,
        this.form.budget ? `${labels.budget}: ¥${this.form.budget}` : '',
        this.form.scheduleDate ? `${labels.date}: ${this.form.scheduleDate}` : '',
        this.form.details ? `${labels.details}: ${this.form.details}` : ''
      ].filter(Boolean)
      return `${this.form.description}\n\n${metadata.join('\n')}`.trim()
    },
    async uploadReferences() {
      const references = []
      for (const file of this.form.files) {
        const body = new FormData()
        body.append('file', file)
        const uploaded = await apiRequest(API_ENDPOINTS.UPLOAD, { method: 'POST', body })
        references.push(uploaded.url)
      }
      return references
    },
    async submitForm() {
      this.formError = ''
      if (!this.selectedArtistId) {
        this.formError = this.copy.chooseArtistError
        return
      }
      if (!this.selectedStyleData) {
        this.formError = this.copy.chooseTypeError
        return
      }
      const description = this.buildDescription()
      if (description.length > 5000) {
        this.formError = this.copy.descriptionTooLong
        return
      }

      this.submitting = true
      try {
        const references = await this.uploadReferences()
        const result = await apiRequest(API_ENDPOINTS.COMMISSIONS, {
          method: 'POST',
          body: {
            artist_id: this.selectedArtistId,
            order_type: this.selectedStyleData.name,
            title: this.form.title,
            description,
            references
          }
        })
        this.orderNumber = result.order_no
        this.showSuccess = true
        this.form = this.emptyForm()
        this.selectedStyle = ''
        showToast(this.copy.created, 'success')
      } catch (error) {
        this.formError = error.message
      } finally {
        this.submitting = false
      }
    },
    acceptTerms() {
      this.form.agreedTerms = true
      this.showTerms = false
    },
    async copyOrderNumber() {
      try {
        await navigator.clipboard.writeText(this.orderNumber)
        showToast(this.$t('commission.orderCopied'), 'success')
      } catch {
        showToast(this.copy.copyFailed, 'error')
      }
    }
  }
}
</script>

<style scoped>
.commission-section { padding: 64px 0 96px; }
.commission-shell { max-width: 920px; }
.step-panel { background: var(--white); border-radius: var(--radius); padding: 40px; margin-bottom: 32px; box-shadow: var(--shadow); }
.step-heading { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.step-heading h2 { font-weight: 600; font-size: 1.35rem; margin: 0 0 4px; }
.step-heading p { color: var(--text-muted); margin: 0; }
.step-number { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; background: var(--text-dark); color: var(--white); font-weight: 600; border-radius: 50%; }
.notice { margin-bottom: 24px; line-height: 1.7; }
.notice-error { color: #B91C1C; }
.inline-state { padding: 32px 0; text-align: center; color: var(--text-light); }
.error-state p { margin-bottom: 10px; }
.text-button { border: 0; padding: 0; background: transparent; color: var(--primary-color); font-weight: 600; cursor: pointer; transition: var(--transition); }
.text-button:hover { color: var(--primary-dark); }
.artist-grid { display: grid; gap: 16px; }
.artist-option { width: 100%; min-height: 94px; display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; align-items: center; gap: 16px; padding: 16px; text-align: left; border: 1px solid transparent; background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); cursor: pointer; transition: var(--transition), box-shadow 0.3s ease; }
.artist-option:hover { box-shadow: var(--shadow-hover); }
.artist-option.selected { border-color: var(--primary-color); }
.avatar { width: 58px; height: 58px; display: grid; place-items: center; background: #F5F5F5 center/cover no-repeat; color: var(--text-dark); font-size: 1.25rem; font-weight: 600; border-radius: 50%; }
.artist-details { min-width: 0; display: grid; gap: 4px; }
.artist-details strong { color: var(--text-dark); font-weight: 600; }
.artist-details small { color: var(--text-light); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.artist-price { color: var(--text-dark); font-weight: 600; white-space: nowrap; }
.tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-row span { padding: 2px 8px; background: #F5F5F5; color: var(--text-muted); font-size: 0.74rem; border-radius: var(--radius-sm); }
.type-heading { margin: 32px 0 16px; }
.type-heading h3 { font-size: 1rem; font-weight: 600; }
.style-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.style-option { min-width: 0; display: grid; grid-template-columns: 86px minmax(0, 1fr); grid-template-rows: auto auto; gap: 0 14px; align-items: center; padding: 0; overflow: hidden; text-align: left; border: 1px solid transparent; background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); cursor: pointer; transition: var(--transition), box-shadow 0.3s ease; }
.style-option:hover { box-shadow: var(--shadow-hover); }
.style-option.selected { border-color: var(--primary-color); }
.style-option img { grid-row: 1 / 3; width: 86px; height: 94px; object-fit: cover; }
.style-copy { min-width: 0; align-self: end; display: grid; padding: 11px 10px 2px 0; }
.style-copy strong { font-size: 0.98rem; font-weight: 600; }
.style-copy small { color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.style-price { align-self: start; padding: 2px 10px 10px 0; color: var(--text-dark); font-size: 0.84rem; font-weight: 600; }
.field-counter { display: block; text-align: right; color: var(--text-muted); font-size: 0.78rem; margin-top: 4px; }
.file-upload { padding: 32px; }
.upload-symbol { display: grid; place-items: center; width: 38px; height: 38px; margin: 0 auto 8px; border: 1px solid var(--border-color); color: var(--primary-color); font-size: 1.5rem; border-radius: 50%; }
.file-upload small { color: var(--text-muted); }
.file-list { display: grid; gap: 8px; margin-top: 12px; }
.file-list li { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto 28px; gap: 10px; align-items: center; padding: 9px 12px; background: #F5F5F5; border-radius: var(--radius); }
.file-list span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-list small { color: var(--text-muted); }
.file-list button { width: 28px; height: 28px; border: 0; background: transparent; color: #B91C1C; font-size: 1.2rem; cursor: pointer; transition: var(--transition); }
.terms-label { display: flex; align-items: flex-start; gap: 10px; margin: 6px 0 20px; line-height: 1.5; }
.terms-label input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--primary-color); }
.terms-link { border: 0; padding: 0; background: transparent; color: var(--primary-color); text-decoration: underline; cursor: pointer; font: inherit; transition: var(--transition); }
.terms-link:hover { color: var(--primary-dark); }
.form-error { margin: 0 0 16px; color: #B91C1C; }
.submit-btn { width: 100%; }
.modal-backdrop { position: fixed; inset: 0; z-index: 2100; display: grid; place-items: center; padding: 20px; background: rgba(0, 0, 0, 0.45); }
.terms-modal, .success-modal { width: min(100%, 620px); max-height: 85vh; background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow-hover); overflow: hidden; }
.terms-modal { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }
.terms-modal header, .terms-modal footer { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
.terms-modal footer { justify-content: flex-end; }
.terms-modal header h2 { font-weight: 600; }
.terms-modal header button { width: 36px; height: 36px; border: 0; background: transparent; font-size: 1.5rem; cursor: pointer; transition: var(--transition); }
.terms-modal header button:hover { color: var(--primary-color); }
.terms-body { overflow-y: auto; padding: 8px 24px 24px; }
.terms-body h3 { margin: 18px 0 6px; font-size: 1rem; font-weight: 600; }
.terms-body h3:first-child { margin-top: 0; }
.terms-body p { color: var(--text-light); line-height: 1.75; }
.success-modal { max-width: 460px; padding: 40px 36px; text-align: center; }
.success-mark { width: 56px; height: 56px; margin: 0 auto 16px; display: grid; place-items: center; background: #F0FDF4; color: #15803D; border-radius: 50%; font-size: 1.8rem; }
.success-modal h2 { margin-bottom: 18px; font-weight: 600; }
.success-modal > strong { display: block; margin: 8px 0; color: var(--text-dark); font: 600 1.4rem/1.2 monospace; overflow-wrap: anywhere; }
.success-hint { color: var(--text-muted); }
.success-actions { display: flex; justify-content: center; gap: 12px; margin-top: 24px; }
.outline-button { padding: 11px 18px; border: 1px solid var(--primary-color); background: var(--white); color: var(--primary-color); border-radius: var(--radius); font-weight: 600; cursor: pointer; transition: var(--transition); }
.outline-button:hover { background: var(--primary-color); color: var(--white); }
@media (max-width: 768px) {
  .commission-section { padding: 32px 0 64px; }
  .step-panel { padding: 24px 20px; }
  .style-options { grid-template-columns: 1fr; }
  .artist-option { grid-template-columns: 50px minmax(0, 1fr); }
  .avatar { width: 50px; height: 50px; }
  .artist-price { grid-column: 2; }
  .success-actions { flex-direction: column; }
}
</style>
