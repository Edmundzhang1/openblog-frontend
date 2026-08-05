<template>
  <div class="admin-works">
    <div class="section-heading">
      <div>
        <span class="section-index">07</span>
        <h2>{{ copy.title }}</h2>
        <p>{{ copy.hint }}</p>
      </div>
    </div>

    <form class="upload-form" @submit.prevent="submitWork">
      <h3>{{ copy.uploadTitle }}</h3>
      <div class="upload-body">
        <label class="image-picker">
          <input type="file" accept="image/*" @change="handleFileChange">
          <img v-if="previewUrl" :src="previewUrl" :alt="copy.previewAlt">
          <span v-else class="picker-placeholder">{{ copy.pickImage }}</span>
        </label>
        <div class="upload-fields">
          <textarea
            v-model.trim="intro"
            rows="4"
            maxlength="500"
            required
            :placeholder="copy.introPlaceholder"
          ></textarea>
          <p class="intro-counter">{{ intro.length }}/500</p>
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          <div class="form-actions">
            <button type="submit" class="btn-search" :disabled="uploading">
              {{ uploading ? copy.uploading : copy.submit }}
            </button>
          </div>
        </div>
      </div>
    </form>

    <div v-if="loading" class="inline-state">{{ copy.loading }}</div>
    <div v-else-if="error" class="inline-state error-state">
      <p>{{ error }}</p>
      <button type="button" class="text-button" @click="loadWorks(pagination.page)">{{ copy.retry }}</button>
    </div>
    <template v-else-if="works.length">
      <div class="works-grid">
        <article v-for="work in works" :key="work.id" class="work-card">
          <div class="work-image">
            <img :src="getAssetUrl(work.image_url)" :alt="work.intro" loading="lazy">
          </div>
          <div class="work-body">
            <p class="work-intro">{{ work.intro }}</p>
            <p class="work-date">{{ formatDate(work.created_at) }}</p>
            <button
              type="button"
              class="delete-button"
              :disabled="deletingId === work.id"
              @click="removeWork(work)"
            >
              {{ copy.delete }}
            </button>
          </div>
        </article>
      </div>

      <div v-if="pagination.total_pages > 1" class="pagination">
        <button
          type="button"
          :disabled="pagination.page <= 1"
          class="btn-page"
          @click="goPage(pagination.page - 1)"
        >
          {{ copy.prevPage }}
        </button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.total_pages }}</span>
        <button
          type="button"
          :disabled="pagination.page >= pagination.total_pages"
          class="btn-page"
          @click="goPage(pagination.page + 1)"
        >
          {{ copy.nextPage }}
        </button>
      </div>
    </template>
    <div v-else class="inline-state">{{ copy.empty }}</div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS, getAssetUrl } from '../../config/api'
import { apiRequest, showToast } from '../../utils/eventBus'

const CONTENT = {
  zh: {
    title: '平台作品库', hint: '上传并维护前台画廊展示的平台作品',
    uploadTitle: '上传新作品', pickImage: '点击选择图片', previewAlt: '作品预览',
    introPlaceholder: '作品介绍（必填，500 字以内）', imageRequired: '请先选择作品图片',
    submit: '发布作品', uploading: '上传中...', uploaded: '作品已发布',
    delete: '删除', confirmDelete: '确定删除该作品？删除后不可恢复', deleted: '作品已删除',
    loading: '加载中...', retry: '重新加载', empty: '还没有平台作品，先在上方上传一张吧。',
    prevPage: '上一页', nextPage: '下一页'
  },
  en: {
    title: 'Works Library', hint: 'Upload and maintain the platform works shown in the public gallery',
    uploadTitle: 'Upload New Work', pickImage: 'Click to pick an image', previewAlt: 'Work preview',
    introPlaceholder: 'Work intro (required, up to 500 chars)', imageRequired: 'Please pick an image first.',
    submit: 'Publish', uploading: 'Uploading...', uploaded: 'Work published.',
    delete: 'Delete', confirmDelete: 'Delete this work? This cannot be undone.', deleted: 'Work deleted.',
    loading: 'Loading...', retry: 'Try again', empty: 'No platform works yet. Upload one above.',
    prevPage: 'Previous', nextPage: 'Next'
  }
}

export default {
  name: 'AdminWorks',
  setup() { return { i18n: inject('i18n') } },
  data() {
    return {
      works: [],
      pagination: { page: 1, page_size: 12, total: 0, total_pages: 1 },
      loading: false, error: '',
      // 上传表单
      selectedFile: null, previewUrl: '', intro: '', formError: '', uploading: false,
      deletingId: null
    }
  },
  computed: {
    locale() { return this.i18n.getLocale() },
    copy() { return CONTENT[this.locale] }
  },
  mounted() { this.loadWorks(1) },
  methods: {
    getAssetUrl,
    async loadWorks(page = 1) {
      this.loading = true
      this.error = ''
      try {
        const params = new URLSearchParams()
        params.append('page', String(page))
        params.append('page_size', String(this.pagination.page_size || 12))
        const data = await apiRequest(`${API_ENDPOINTS.ADMIN_WORKS}?${params.toString()}`, { showError: false })
        this.works = Array.isArray(data?.list) ? data.list : []
        const total = Number(data?.total) || 0
        const pageSize = Number(data?.page_size) || this.pagination.page_size || 12
        this.pagination = {
          page: Number(data?.page) || page,
          page_size: pageSize,
          total,
          total_pages: Math.max(1, Math.ceil(total / pageSize))
        }
      } catch (error) { this.error = error.message } finally { this.loading = false }
    },
    goPage(page) {
      if (page < 1 || page > this.pagination.total_pages) return
      this.loadWorks(page)
    },
    handleFileChange(event) {
      const file = event.target.files && event.target.files[0]
      this.formError = ''
      if (!file) {
        this.selectedFile = null
        this.previewUrl = ''
        return
      }
      if (file.type && !file.type.startsWith('image/')) {
        this.selectedFile = null
        this.previewUrl = ''
        this.formError = this.copy.imageRequired
        return
      }
      this.selectedFile = file
      const reader = new FileReader()
      reader.onload = (e) => { this.previewUrl = e.target.result }
      reader.readAsDataURL(file)
    },
    resetForm() {
      this.selectedFile = null
      this.previewUrl = ''
      this.intro = ''
      this.formError = ''
    },
    async submitWork() {
      if (this.uploading) return
      if (!this.selectedFile) {
        this.formError = this.copy.imageRequired
        return
      }
      this.uploading = true
      this.formError = ''
      try {
        // 先上传图片拿到访问地址，再创建作品记录
        const formData = new FormData()
        formData.append('file', this.selectedFile)
        const uploaded = await apiRequest(API_ENDPOINTS.UPLOAD, { method: 'POST', body: formData })
        await apiRequest(API_ENDPOINTS.ADMIN_WORKS, {
          method: 'POST',
          body: { image_url: uploaded.url, intro: this.intro }
        })
        showToast(this.copy.uploaded, 'success')
        this.resetForm()
        await this.loadWorks(1)
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.uploading = false }
    },
    async removeWork(work) {
      if (!window.confirm(this.copy.confirmDelete)) return
      this.deletingId = work.id
      try {
        await apiRequest(API_ENDPOINTS.ADMIN_WORK(work.id), { method: 'DELETE' })
        showToast(this.copy.deleted, 'success')
        // 删除后当前页可能变空，回退一页
        const page = this.works.length === 1 && this.pagination.page > 1
          ? this.pagination.page - 1
          : this.pagination.page
        await this.loadWorks(page)
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.deletingId = null }
    },
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return new Intl.DateTimeFormat(this.locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
    }
  }
}
</script>

<style scoped>
.section-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.section-index { display: block; margin-bottom: 6px; color: var(--text-muted); font: 800 0.72rem/1 monospace; }
.section-heading h2 { margin: 0; font-size: 1.25rem; }
.section-heading p { margin: 5px 0 0; color: var(--text-muted); }
.upload-form { margin-bottom: 24px; padding: 20px; background: #FAFAFA; border: 1px solid #E5E7EB; border-radius: var(--radius); }
.upload-form h3 { margin: 0 0 16px; font-size: 1rem; }
.upload-body { display: grid; grid-template-columns: 220px 1fr; gap: 16px; }
.image-picker { position: relative; display: flex; align-items: center; justify-content: center; height: 160px; border: 1px dashed #D1D5DB; border-radius: var(--radius); background: #fff; overflow: hidden; cursor: pointer; transition: var(--transition); }
.image-picker:hover { border-color: var(--primary-color); }
.image-picker input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.image-picker img { width: 100%; height: 100%; object-fit: cover; }
.picker-placeholder { padding: 0 12px; color: var(--text-muted); font-size: 0.85rem; text-align: center; }
.upload-fields textarea { width: 100%; padding: 10px 12px; border: 1px solid #E5E7EB; border-radius: var(--radius); font: inherit; background: #fff; resize: vertical; box-sizing: border-box; }
.upload-fields textarea:focus { outline: none; border-color: var(--primary-color); }
.intro-counter { margin: 4px 0 0; color: var(--text-muted); font-size: 0.75rem; text-align: right; }
.form-error { margin: 10px 0 0; padding: 11px 13px; background: #FEF2F2; color: #B91C1C; border-left: 3px solid #EF4444; }
.form-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
.btn-search { min-height: 40px; padding: 0 16px; border: 0; border-radius: var(--radius); background: var(--primary-color); color: #fff; font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.btn-search:disabled { opacity: 0.5; cursor: not-allowed; }
.works-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
.work-card { border: 1px solid #E5E7EB; border-radius: var(--radius); overflow: hidden; background: #fff; }
.work-image { position: relative; height: 160px; background: #F3F4F6; }
.work-image img { width: 100%; height: 100%; object-fit: cover; }
.work-body { padding: 14px; }
.work-intro { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0 0 8px; font-size: 0.9rem; overflow-wrap: anywhere; }
.work-date { margin: 0 0 12px; color: var(--text-muted); font-size: 0.75rem; }
.delete-button { width: 100%; min-height: 36px; border: 1px solid #FCA5A5; border-radius: var(--radius); background: #fff; color: #B91C1C; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: var(--transition); }
.delete-button:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
.btn-page { min-height: 38px; padding: 0 16px; background: #fff; border: 1px solid #E5E7EB; border-radius: var(--radius); font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.btn-page:hover:not(:disabled) { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { color: var(--text-muted); font-size: 0.9rem; }
.inline-state { padding: 34px 18px; background: #FAFAFA; color: var(--text-muted); text-align: center; }
.inline-state p { margin: 0; }
.error-state { color: #B91C1C; }
.text-button { margin-top: 8px; border: 0; background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; transition: var(--transition); }
@media (max-width: 620px) {
  .section-heading { flex-direction: column; }
  .upload-body { grid-template-columns: 1fr; }
}
</style>
