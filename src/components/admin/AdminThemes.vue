<template>
  <div class="admin-themes">
    <div class="section-heading">
      <div>
        <span class="section-index">09</span>
        <h2>{{ copy.title }}</h2>
        <p>{{ copy.hint }}</p>
      </div>
      <button v-if="!editing" type="button" class="btn-search" @click="startCreate">{{ copy.create }}</button>
    </div>

    <form v-if="editing" class="preset-form" @submit.prevent="savePreset">
      <h3>{{ editing.id ? copy.editTitle : copy.createTitle }}</h3>
      <div class="form-row">
        <div class="form-group">
          <label>{{ copy.fieldName }}</label>
          <input v-model.trim="editing.name" type="text" maxlength="50" required>
        </div>
        <div class="form-group">
          <label>{{ copy.fieldSort }}</label>
          <input v-model.number="editing.sort_order" type="number" min="0" max="9999">
        </div>
      </div>
      <div class="color-fields">
        <div class="color-field">
          <label>{{ copy.colorPrimary }}</label>
          <input v-model="editing.primary_color" type="color">
          <span>{{ editing.primary_color }}</span>
        </div>
        <div class="color-field">
          <label>{{ copy.colorPrimaryDark }}</label>
          <input v-model="editing.primary_dark" type="color">
          <span>{{ editing.primary_dark }}</span>
        </div>
        <div class="color-field">
          <label>{{ copy.colorSecondary }}</label>
          <input v-model="editing.secondary_color" type="color">
          <span>{{ editing.secondary_color }}</span>
        </div>
        <div class="color-field">
          <label>{{ copy.colorAccent }}</label>
          <input v-model="editing.accent_color" type="color">
          <span>{{ editing.accent_color }}</span>
        </div>
        <div class="color-field">
          <label>{{ copy.colorBgLight }}</label>
          <input v-model="editing.bg_light" type="color">
          <span>{{ editing.bg_light }}</span>
        </div>
      </div>
      <label class="active-check">
        <input v-model="editing.is_active" type="checkbox">
        {{ copy.fieldActive }}
      </label>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <div class="form-actions">
        <button type="button" class="btn-clear" :disabled="saving" @click="cancelEdit">{{ copy.cancel }}</button>
        <button type="submit" class="btn-search" :disabled="saving">{{ saving ? copy.saving : copy.save }}</button>
      </div>
    </form>

    <div v-if="loading" class="inline-state">{{ copy.loading }}</div>
    <div v-else-if="error" class="inline-state error-state">
      <p>{{ error }}</p>
      <button type="button" class="text-button" @click="loadPresets">{{ copy.retry }}</button>
    </div>
    <div v-else-if="presets.length" class="preset-list">
      <div v-for="preset in sortedPresets" :key="preset.id" :class="['preset-row', { inactive: !preset.is_active }]">
        <div class="preset-swatches">
          <span
            v-for="color in swatches(preset)"
            :key="color"
            class="swatch"
            :style="{ background: color }"
            :title="color"
          ></span>
        </div>
        <div class="preset-info">
          <strong>{{ preset.name }}</strong>
          <span>{{ copy.sortLabel }} {{ preset.sort_order }}</span>
          <span v-if="platformThemeName === preset.name" class="platform-badge">{{ copy.platformBadge }}</span>
        </div>
        <button
          type="button"
          :class="['switch', { on: preset.is_active }]"
          :title="copy.fieldActive"
          :disabled="togglingId === preset.id"
          @click="toggleActive(preset)"
        >
          <span class="switch-dot"></span>
        </button>
        <div class="preset-actions">
          <button
            v-if="platformThemeName === preset.name"
            type="button"
            class="text-button"
            :disabled="restoringDefault"
            @click="restoreDefault"
          >
            {{ copy.restoreDefault }}
          </button>
          <button
            v-else
            type="button"
            class="text-button"
            :disabled="applyingId === preset.id"
            @click="applyToPlatform(preset)"
          >
            {{ copy.applyPlatform }}
          </button>
          <button type="button" class="text-button" @click="startEdit(preset)">{{ copy.edit }}</button>
          <button type="button" class="text-button danger" :disabled="deletingId === preset.id" @click="removePreset(preset)">
            {{ copy.delete }}
          </button>
        </div>
      </div>
    </div>
    <div v-else class="inline-state">{{ copy.empty }}</div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS } from '../../config/api'
import { apiRequest, showToast } from '../../utils/eventBus'
import { refreshSiteConfig } from '../../state/siteConfig'

const CONTENT = {
  zh: {
    title: '主题预设', hint: '维护供用户选用的平台级主题配色（如圣诞主题）',
    create: '新增预设', createTitle: '新增主题预设', editTitle: '编辑主题预设',
    fieldName: '预设名称', fieldSort: '排序值', fieldActive: '启用',
    colorPrimary: '主色', colorPrimaryDark: '深色', colorSecondary: '次要色', colorAccent: '强调色', colorBgLight: '浅背景',
    save: '保存', cancel: '取消', saving: '保存中...', saved: '主题预设已保存', deleted: '主题预设已删除', updated: '启用状态已更新',
    edit: '编辑', delete: '删除', confirmDelete: '确定删除该主题预设吗？', nameRequired: '请填写预设名称',
    applyPlatform: '应用到平台', applied: '主题已应用到全平台', platformBadge: '当前平台主题',
    restoreDefault: '恢复默认主题', restored: '已恢复默认主题',
    sortLabel: '排序', loading: '加载中...', retry: '重新加载', empty: '还没有主题预设，点击右上角「新增预设」创建。'
  },
  en: {
    title: 'Themes', hint: 'Maintain platform-level theme presets for users (e.g. a Christmas theme)',
    create: 'New Preset', createTitle: 'New Theme Preset', editTitle: 'Edit Theme Preset',
    fieldName: 'Preset name', fieldSort: 'Sort order', fieldActive: 'Active',
    colorPrimary: 'Primary', colorPrimaryDark: 'Primary dark', colorSecondary: 'Secondary', colorAccent: 'Accent', colorBgLight: 'Light background',
    save: 'Save', cancel: 'Cancel', saving: 'Saving...', saved: 'Theme preset saved.', deleted: 'Theme preset deleted.', updated: 'Active state updated.',
    edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete this theme preset?', nameRequired: 'Please enter a preset name.',
    applyPlatform: 'Apply to platform', applied: 'Theme applied platform-wide.', platformBadge: 'Current platform theme',
    restoreDefault: 'Restore default theme', restored: 'Default theme restored.',
    sortLabel: 'Sort', loading: 'Loading...', retry: 'Try again', empty: 'No theme presets yet. Click "New Preset" to create one.'
  }
}

function emptyPreset() {
  return {
    id: null, name: '',
    primary_color: '#C0392B', primary_dark: '#96281B', secondary_color: '#1E824C',
    accent_color: '#D35400', bg_light: '#FDF6EC',
    is_active: true, sort_order: 0
  }
}

export default {
  name: 'AdminThemes',
  setup() { return { i18n: inject('i18n') } },
  data() {
    return {
      presets: [], editing: null, formError: '',
      loading: false, error: '', saving: false, deletingId: null, togglingId: null,
      // 当前应用到全平台的主题预设名（来自 extra_config.platform_theme）
      platformThemeName: '', applyingId: null, restoringDefault: false
    }
  },
  computed: {
    locale() { return this.i18n.getLocale() },
    copy() { return CONTENT[this.locale] },
    sortedPresets() {
      return [...this.presets].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
    }
  },
  mounted() {
    this.loadPresets()
    this.loadPlatformTheme()
  },
  methods: {
    swatches(preset) {
      return [preset.primary_color, preset.primary_dark, preset.secondary_color, preset.accent_color, preset.bg_light]
    },
    async loadPresets() {
      this.loading = true
      this.error = ''
      try {
        const data = await apiRequest(API_ENDPOINTS.ADMIN_THEME_PRESETS, { showError: false })
        this.presets = Array.isArray(data?.list) ? data.list : (Array.isArray(data) ? data : [])
      } catch (error) { this.error = error.message } finally { this.loading = false }
    },
    // 读取当前已应用的平台主题（extra_config.platform_theme）
    async loadPlatformTheme() {
      try {
        const data = await apiRequest(API_ENDPOINTS.ADMIN_SITE_CONFIG, { showError: false })
        const theme = data?.extra_config?.platform_theme
        this.platformThemeName = theme && typeof theme.name === 'string' ? theme.name : ''
      } catch (_) { /* 读取失败时仅不展示徽标 */ }
    },
    // extra_config 为整对象写入：先重新 GET，合并 platform_theme 后整体 PATCH
    async patchPlatformTheme(theme) {
      const data = await apiRequest(API_ENDPOINTS.ADMIN_SITE_CONFIG, { showError: false })
      const extra = { ...((data && typeof data.extra_config === 'object' && data.extra_config) || {}) }
      if (theme) {
        extra.platform_theme = theme
      } else {
        delete extra.platform_theme
      }
      await apiRequest(API_ENDPOINTS.ADMIN_SITE_CONFIG, { method: 'PATCH', body: { extra_config: extra } })
    },
    async applyToPlatform(preset) {
      this.applyingId = preset.id
      try {
        await this.patchPlatformTheme({
          name: preset.name,
          primary_color: preset.primary_color,
          primary_dark: preset.primary_dark,
          secondary_color: preset.secondary_color,
          accent_color: preset.accent_color,
          bg_light: preset.bg_light
        })
        this.platformThemeName = preset.name
        // 让管理后台立即看到新主题（/site/home 返回 platform_theme 后应用）
        await refreshSiteConfig()
        showToast(this.copy.applied, 'success')
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.applyingId = null }
    },
    async restoreDefault() {
      this.restoringDefault = true
      try {
        await this.patchPlatformTheme(null)
        this.platformThemeName = ''
        // /site/home 不再返回 platform_theme，refreshSiteConfig 内会清除行内变量
        await refreshSiteConfig()
        showToast(this.copy.restored, 'success')
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.restoringDefault = false }
    },
    startCreate() {
      this.formError = ''
      const maxSort = this.presets.reduce((max, preset) => Math.max(max, Number(preset.sort_order) || 0), 0)
      this.editing = { ...emptyPreset(), sort_order: maxSort + 1 }
    },
    startEdit(preset) {
      this.formError = ''
      this.editing = { ...emptyPreset(), ...preset }
    },
    cancelEdit() {
      this.editing = null
      this.formError = ''
    },
    presetBody() {
      const { name, primary_color, primary_dark, secondary_color, accent_color, bg_light, is_active, sort_order } = this.editing
      return { name, primary_color, primary_dark, secondary_color, accent_color, bg_light, is_active: !!is_active, sort_order: Number(sort_order) || 0 }
    },
    async savePreset() {
      if (!this.editing) return
      if (!this.editing.name) {
        this.formError = this.copy.nameRequired
        return
      }
      this.saving = true
      this.formError = ''
      try {
        const body = this.presetBody()
        if (this.editing.id) {
          await apiRequest(API_ENDPOINTS.ADMIN_THEME_PRESET(this.editing.id), { method: 'PUT', body })
        } else {
          await apiRequest(API_ENDPOINTS.ADMIN_THEME_PRESETS, { method: 'POST', body })
        }
        showToast(this.copy.saved, 'success')
        this.editing = null
        await this.loadPresets()
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.saving = false }
    },
    async toggleActive(preset) {
      const next = !preset.is_active
      this.togglingId = preset.id
      try {
        await apiRequest(API_ENDPOINTS.ADMIN_THEME_PRESET(preset.id), {
          method: 'PUT',
          body: {
            name: preset.name,
            primary_color: preset.primary_color,
            primary_dark: preset.primary_dark,
            secondary_color: preset.secondary_color,
            accent_color: preset.accent_color,
            bg_light: preset.bg_light,
            is_active: next,
            sort_order: Number(preset.sort_order) || 0
          }
        })
        preset.is_active = next
        showToast(this.copy.updated, 'success')
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.togglingId = null }
    },
    async removePreset(preset) {
      if (!window.confirm(this.copy.confirmDelete)) return
      this.deletingId = preset.id
      try {
        await apiRequest(API_ENDPOINTS.ADMIN_THEME_PRESET(preset.id), { method: 'DELETE' })
        showToast(this.copy.deleted, 'success')
        await this.loadPresets()
      } catch (_) { /* apiRequest 已经展示了接口错误 */ } finally { this.deletingId = null }
    }
  }
}
</script>

<style scoped>
.section-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.section-index { display: block; margin-bottom: 6px; color: var(--text-muted); font: 800 0.72rem/1 monospace; }
.section-heading h2 { margin: 0; font-size: 1.25rem; }
.section-heading p { margin: 5px 0 0; color: var(--text-muted); }
.preset-form { margin-bottom: 24px; padding: 20px; background: #FAFAFA; border: 1px solid #E5E7EB; border-radius: var(--radius); }
.preset-form h3 { margin: 0 0 16px; font-size: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 160px; gap: 14px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 0.82rem; font-weight: 600; color: var(--text-dark); }
.form-group input { width: 100%; height: 40px; padding: 0 12px; border: 1px solid #E5E7EB; border-radius: var(--radius); font: inherit; background: #fff; }
.form-group input:focus { outline: none; border-color: var(--primary-color); }
.color-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 14px; }
.color-field label { display: block; margin-bottom: 6px; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); }
.color-field input[type="color"] { width: 100%; height: 40px; padding: 2px; border: 1px solid #E5E7EB; border-radius: var(--radius); background: #fff; cursor: pointer; }
.color-field span { display: block; margin-top: 4px; color: var(--text-muted); font: 0.72rem monospace; }
.active-check { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 14px; font-size: 0.88rem; cursor: pointer; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; }
.preset-list { display: grid; gap: 10px; }
.preset-row { display: flex; align-items: center; gap: 18px; padding: 14px 16px; border: 1px solid #E5E7EB; border-radius: var(--radius); background: #fff; }
.preset-row.inactive { opacity: 0.6; }
.preset-swatches { display: flex; gap: 4px; flex-shrink: 0; }
.swatch { width: 22px; height: 22px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.08); }
.preset-info { flex: 1; min-width: 0; }
.preset-info strong { display: block; font-size: 0.92rem; overflow-wrap: anywhere; }
.preset-info span { color: var(--text-muted); font-size: 0.75rem; }
.platform-badge { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: var(--radius); background: var(--primary-color); color: #fff; font-size: 0.72rem; font-weight: 700; }
.preset-actions { display: flex; gap: 12px; flex-shrink: 0; }
.switch { position: relative; width: 42px; height: 24px; border: 1px solid #E5E7EB; border-radius: 999px; background: #E5E7EB; cursor: pointer; transition: var(--transition); flex-shrink: 0; }
.switch.on { background: var(--primary-color); border-color: var(--primary-color); }
.switch:disabled { opacity: 0.5; cursor: not-allowed; }
.switch-dot { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: var(--transition); }
.switch.on .switch-dot { left: 20px; }
.btn-search, .btn-clear { min-height: 40px; padding: 0 16px; border: 0; border-radius: var(--radius); font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.btn-search { background: var(--primary-color); color: #fff; }
.btn-clear { background: #F3F4F6; color: var(--text-light); }
.text-button { border: 0; background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; transition: var(--transition); }
.text-button.danger { color: #B91C1C; }
.text-button:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error { margin: 0 0 14px; padding: 11px 13px; background: #FEF2F2; color: #B91C1C; border-left: 3px solid #EF4444; }
.inline-state { padding: 34px 18px; background: #FAFAFA; color: var(--text-muted); text-align: center; }
.inline-state p { margin: 0; }
.error-state { color: #B91C1C; }
@media (max-width: 620px) {
  .section-heading { flex-direction: column; }
  .form-row { grid-template-columns: 1fr; }
  .preset-row { flex-wrap: wrap; }
}
</style>
