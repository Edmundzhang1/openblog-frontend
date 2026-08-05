<template>
  <div class="artist-apply-page">
    <header class="page-header fade-in">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="apply-section">
      <div class="container apply-container">
        <!-- 提交成功 -->
        <div v-if="submitted" class="result-card fade-in">
          <div class="result-icon">✅</div>
          <h2>{{ content.successTitle }}</h2>
          <p>{{ content.successDesc }}</p>
          <router-link to="/" class="btn btn-primary">{{ content.backHome }}</router-link>
        </div>

        <!-- 申请表单 -->
        <form v-else class="apply-form fade-in" @submit.prevent="submitApplication">
          <div class="form-card">
            <h2>{{ content.portfolioTitle }}</h2>
            <p class="form-hint">{{ content.portfolioHint }}</p>
            <div v-for="(url, index) in form.portfolioUrls" :key="index" class="url-row">
              <input
                type="url"
                v-model.trim="form.portfolioUrls[index]"
                :placeholder="content.portfolioPlaceholder"
                maxlength="500"
              >
              <button
                type="button"
                class="btn-remove"
                :disabled="form.portfolioUrls.length <= 1"
                @click="removeUrl(index)"
              >×</button>
            </div>
            <button
              type="button"
              class="btn btn-outline btn-add"
              :disabled="form.portfolioUrls.length >= maxUrls"
              @click="addUrl"
            >
              {{ content.addUrl }} ({{ form.portfolioUrls.length }}/{{ maxUrls }})
            </button>

            <!-- 或直接上传作品文件（图片 / zip / pdf） -->
            <div class="upload-or">{{ content.uploadOr }}</div>
            <div class="file-upload" @click="triggerFileInput">
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*,.zip,.pdf"
                @change="handleFiles"
              >
              <div class="file-upload-icon">📎</div>
              <p>{{ uploading ? content.uploading : content.uploadHint }}</p>
            </div>
          </div>

          <div class="form-card">
            <h2>{{ content.reasonTitle }}</h2>
            <p class="form-hint">{{ content.reasonHint }}</p>
            <textarea
              v-model.trim="form.reason"
              rows="6"
              :placeholder="content.reasonPlaceholder"
              maxlength="2000"
            ></textarea>
            <span class="char-count" :class="{ invalid: reasonTooShort }">
              {{ form.reason.length }}/2000
            </span>
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>

          <button type="submit" class="btn btn-primary submit-btn" :disabled="submitting">
            {{ submitting ? content.submitting : content.submit }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script>
import { inject } from 'vue'
import { apiRequest, showToast } from '../utils/eventBus'

const MAX_URLS = 10
const MIN_REASON_LENGTH = 10

const CONTENT = {
  zh: {
    title: '申请成为画师',
    subtitle: '提交作品集与申请理由，审核通过后即可开通画师空间',
    portfolioTitle: '作品集链接',
    portfolioHint: '至少提供一个可访问的作品集链接（如 Pixiv、Lofter、个人网站），最多 10 个',
    portfolioPlaceholder: 'https://...',
    addUrl: '+ 添加链接',
    reasonTitle: '申请理由',
    reasonHint: '介绍你的创作方向与经验（至少 10 个字）',
    reasonPlaceholder: '例如：擅长日系赛璐璐风格，有 3 年商稿经验...',
    submit: '提交申请',
    submitting: '提交中...',
    successTitle: '申请已提交',
    successDesc: '您的画师入驻申请已提交，请耐心等待审核。审核结果将通过站内通知告知。',
    backHome: '返回首页',
    urlRequired: '请至少填写一个有效的作品集链接',
    urlInvalid: '作品集链接格式不正确',
    uploadOr: '或直接上传作品文件',
    uploadHint: '点击选择文件上传（支持图片、zip、pdf，可多选）',
    uploading: '上传中...',
    uploadFailed: '文件上传失败，请稍后重试',
    reasonRequired: `申请理由至少需要 ${MIN_REASON_LENGTH} 个字`,
    submitFailed: '提交失败，请稍后重试'
  },
  en: {
    title: 'Apply to Become an Artist',
    subtitle: 'Submit your portfolio and a short introduction. Your artist space opens once approved.',
    portfolioTitle: 'Portfolio Links',
    portfolioHint: 'Provide at least one accessible portfolio link (Pixiv, personal site, etc.), up to 10',
    portfolioPlaceholder: 'https://...',
    addUrl: '+ Add Link',
    reasonTitle: 'Application Reason',
    reasonHint: `Tell us about your creative focus and experience (at least ${MIN_REASON_LENGTH} characters)`,
    reasonPlaceholder: 'e.g. Specialized in anime cel-shading with 3 years of commercial experience...',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    successTitle: 'Application Submitted',
    successDesc: 'Your artist application has been submitted. You will be notified once it is reviewed.',
    backHome: 'Back to Home',
    urlRequired: 'Please provide at least one valid portfolio link',
    urlInvalid: 'Invalid portfolio link format',
    uploadOr: 'Or upload your work files',
    uploadHint: 'Click to upload files (images, zip, pdf; multiple allowed)',
    uploading: 'Uploading...',
    uploadFailed: 'File upload failed, please try again later',
    reasonRequired: `Reason must be at least ${MIN_REASON_LENGTH} characters`,
    submitFailed: 'Submission failed, please try again later'
  }
}

const URL_RE = /^https?:\/\/.+\..+/i

export default {
  name: 'ArtistApply',
  setup() {
    return { i18n: inject('i18n') }
  },
  data() {
    return {
      maxUrls: MAX_URLS,
      form: {
        portfolioUrls: [''],
        reason: ''
      },
      submitting: false,
      submitted: false,
      uploading: false,
      formError: ''
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return CONTENT[this.locale]
    },
    reasonTooShort() {
      return this.form.reason.length > 0 && this.form.reason.length < MIN_REASON_LENGTH
    }
  },
  methods: {
    addUrl() {
      if (this.form.portfolioUrls.length < MAX_URLS) {
        this.form.portfolioUrls.push('')
      }
    },
    removeUrl(index) {
      if (this.form.portfolioUrls.length > 1) {
        this.form.portfolioUrls.splice(index, 1)
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    async handleFiles(event) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (!files.length) return

      this.uploading = true
      try {
        for (const file of files) {
          if (this.form.portfolioUrls.filter(Boolean).length >= MAX_URLS) break
          const formData = new FormData()
          formData.append('file', file)
          const data = await apiRequest('/api/v1/upload', { method: 'POST', body: formData })
          if (data?.url) {
            const emptyIndex = this.form.portfolioUrls.findIndex(u => !u)
            if (emptyIndex >= 0) {
              this.form.portfolioUrls.splice(emptyIndex, 1, data.url)
            } else if (this.form.portfolioUrls.length < MAX_URLS) {
              this.form.portfolioUrls.push(data.url)
            }
          }
        }
      } catch (err) {
        showToast(err?.message || this.content.uploadFailed, 'error')
      } finally {
        this.uploading = false
      }
    },
    validate() {
      const urls = this.form.portfolioUrls.filter(Boolean)
      if (!urls.length) return this.content.urlRequired
      // 站内上传的文件是相对路径（/uploads/...），外链必须是 http(s) 地址
      if (urls.some(url => !URL_RE.test(url) && !url.startsWith('/uploads/'))) return this.content.urlInvalid
      if (this.form.reason.length < MIN_REASON_LENGTH) return this.content.reasonRequired
      return ''
    },
    async submitApplication() {
      this.formError = this.validate()
      if (this.formError) return

      this.submitting = true
      try {
        await apiRequest('/api/v1/me/artist-application', {
          method: 'POST',
          body: {
            portfolio_urls: this.form.portfolioUrls.filter(Boolean),
            application_reason: this.form.reason
          }
        })
        this.submitted = true
      } catch (err) {
        // 409 冲突（审核中 / 已是画师）等错误直接展示后端文案
        const message = err?.message || this.content.submitFailed
        this.formError = message
        showToast(message, 'error')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.artist-apply-page {
  background: var(--white);
  min-height: 100vh;
}

.apply-section {
  padding: 0 0 96px;
}

.apply-container {
  max-width: 640px;
}

.apply-form {
  display: grid;
  gap: 24px;
}

.form-card {
  padding: 32px;
  background: var(--white);
  border: 1px solid #E5E7EB;
  border-radius: var(--radius);
}

.form-card h2 {
  font-size: 1.15rem;
  margin-bottom: 8px;
}

.form-hint {
  color: var(--text-light);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.url-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.url-row input {
  flex: 1;
}

.btn-remove {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 1px solid #E5E7EB;
  background: var(--white);
  color: var(--text-muted);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: color 0.3s, border-color 0.3s;
}

.btn-remove:hover:not(:disabled) {
  color: var(--text-dark);
  border-color: var(--text-dark);
}

.btn-remove:disabled {
  opacity: 0.4;
  cursor: default;
}

.btn-add {
  margin-top: 4px;
}

.form-card textarea {
  width: 100%;
  resize: vertical;
}

.char-count {
  display: block;
  text-align: right;
  margin-top: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.char-count.invalid {
  color: #DC2626;
}

.form-error {
  color: #DC2626;
  font-size: 0.92rem;
}

.submit-btn {
  justify-self: start;
  padding-left: 48px;
  padding-right: 48px;
}

.result-card {
  padding: 64px 32px;
  text-align: center;
  background: var(--white);
  border: 1px solid #E5E7EB;
  border-radius: var(--radius);
}

.result-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.result-card h2 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.result-card p {
  color: var(--text-light);
  max-width: 420px;
  margin: 0 auto 32px;
}

.upload-or {
  margin: 24px 0 12px;
  color: var(--text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.file-upload.uploading {
  opacity: 0.6;
  pointer-events: none;
}
</style>
