/**
 * 空间个性化装修工具
 *
 * 数据结构（personalization config）：
 * {
 *   profile:    { avatar, name, tags[], bio, email, emails[], social[] },
 *   theme:      { primaryColor, primaryDark, secondaryColor, accentColor, bgLight },
 *   hero:       { enabled, slides: [{ image, title, desc }] },
 *   background: { enabled, type: 'color'|'image'|'gradient', color, image,
 *                 gradientFrom, gradientTo, gradientAngle, opacity },
 *   gallery:    { title, subtitle, works: [{ id, image, title, category }] },
 *   site:       { name, logo, logoSize, fontFamily },
 *   modules:    { hero, gallery, moments, about, contact, calendar, commission } 模块显隐,
 *   sectionOrder: ['hero','gallery','calendar','moments','about','contact','custom'] 主页模块顺序,
 *   customSections: [{ id, title, content, enabled }] 自定义板块（content 为白名单 HTML）,
 *   pinned:     { momentId, workId } 置顶内容,
 *   customCSS:  仅作用于自己主页的自定义 CSS 字符串
 * }
 *
 * 持久化：
 * - 正式配置：localStorage['space_personalization']
 * - 自定义主题预设：localStorage['space_theme_presets']
 * - 预览草稿：sessionStorage['space_personalization_preview_draft']
 * - 预览态标记：sessionStorage['space_personalization_preview_active']
 *
 * 事件（window CustomEvent）：
 * - 'personalization-changed'         detail: personalization 对象
 * - 'personalization-preview-changed' detail: { active: boolean }
 */
import { PERSONALIZATION_IMAGES } from '../config/assets.js'
import { API_ENDPOINTS } from '../config/api.js'
import { apiRequest } from './eventBus.js'

const STORAGE_KEY = 'space_personalization'
const PRESETS_KEY = 'space_theme_presets'
const PREVIEW_DRAFT_KEY = 'space_personalization_preview_draft'
const PREVIEW_ACTIVE_KEY = 'space_personalization_preview_active'

const CHANGED_EVENT = 'personalization-changed'
const PREVIEW_CHANGED_EVENT = 'personalization-preview-changed'

// ==================== 常量 ====================

// 社交平台选项（与 Personalization.vue 的 copy.platforms 键对齐）
export const availablePlatforms = [
  { platform: 'twitter', name: 'Twitter', icon: '🐦' },
  { platform: 'instagram', name: 'Instagram', icon: '📷' },
  { platform: 'pixiv', name: 'Pixiv', icon: '🎨' },
  { platform: 'weibo', name: '微博', icon: '📝' },
  { platform: 'bilibili', name: 'Bilibili', icon: '📺' },
  { platform: 'github', name: 'GitHub', icon: '🐙' },
  { platform: 'youtube', name: 'YouTube', icon: '▶️' },
  { platform: 'facebook', name: 'Facebook', icon: '📘' },
  { platform: 'discord', name: 'Discord', icon: '💬' },
  { platform: 'telegram', name: 'Telegram', icon: '✈️' }
]

// 站点字体选项（与 Personalization.vue 的 copy.site.fontOptions 顺序对齐）
export const siteFontOptions = [
  {
    value: "'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    label: '清晰黑体',
    preview: '结构清晰，适合内容展示'
  },
  {
    value: "'PP Neue Montreal', 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    label: '圆润现代',
    preview: '更轻盈的现代界面风格'
  },
  {
    value: "'Songti SC', 'SimSun', 'Noto Serif SC', serif",
    label: '雅致宋体',
    preview: '偏编辑感，适合站点标题展示'
  },
  {
    value: "'Kaiti SC', 'KaiTi', 'STKaiti', serif",
    label: '手写楷体',
    preview: '更有个性和作品集气质'
  },
  {
    value: "Georgia, 'Times New Roman', 'Songti SC', serif",
    label: '经典衬线',
    preview: '更偏传统杂志式排版'
  }
]

// ==================== 默认配置 ====================

function buildDefaultConfig() {
  return {
    profile: {
      avatar: '',
      name: '',
      tags: ['插画师', '设计师'],
      bio: '',
      email: '',
      emails: ['contact@example.com'],
      social: []
    },
    theme: {
      primaryColor: '#1A1A1A',
      primaryDark: '#000000',
      secondaryColor: '#4B5563',
      accentColor: '#3B82F6',
      bgLight: '#FFFFFF'
    },
    hero: {
      enabled: true,
      slides: [
        { image: PERSONALIZATION_IMAGES.defaultHero, title: '', desc: '' }
      ]
    },
    background: {
      enabled: false,
      type: 'color',
      color: '#FFFFFF',
      image: '',
      gradientFrom: '#FFFFFF',
      gradientTo: '#E5E7EB',
      gradientAngle: 135,
      opacity: 1
    },
    gallery: {
      title: '',
      subtitle: '',
      works: []
    },
    site: {
      name: 'OpenBlog',
      logo: '',
      logoSize: 56,
      fontFamily: siteFontOptions[0].value
    },
    modules: {
      hero: true,
      gallery: true,
      moments: true,
      about: true,
      contact: true,
      calendar: true,
      commission: true
    },
    sectionOrder: ['hero', 'gallery', 'calendar', 'moments', 'about', 'contact', 'custom'],
    customSections: [],
    pinned: {
      momentId: null,
      workId: null
    },
    customCSS: ''
  }
}

// 深拷贝（配置对象均为可 JSON 序列化数据）
const clone = (value) => JSON.parse(JSON.stringify(value))

// 将 stored 合并到 defaults 上（保留新增字段的默认值）
const mergeWithDefaults = (stored) => {
  const base = buildDefaultConfig()
  if (!stored || typeof stored !== 'object') return base
  for (const key of Object.keys(base)) {
    if (stored[key] && typeof stored[key] === 'object' && !Array.isArray(stored[key])) {
      base[key] = { ...base[key], ...stored[key] }
    } else if (stored[key] !== undefined) {
      base[key] = stored[key]
    }
  }
  return base
}

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    return null
  }
}

// ==================== 事件派发 ====================

function dispatchChanged(config) {
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: config }))
}

function dispatchPreviewChanged(active) {
  window.dispatchEvent(new CustomEvent(PREVIEW_CHANGED_EVENT, { detail: { active } }))
}

// ==================== 读取 / 保存 ====================

/**
 * 获取已保存的个性化配置（localStorage），无则返回默认配置
 */
export function getSavedPersonalization() {
  const stored = safeParse(localStorage.getItem(STORAGE_KEY))
  return mergeWithDefaults(stored)
}

/**
 * 获取当前生效的个性化配置，优先级：
 * 预览草稿 > 访客查看配置 > 本地保存配置 > 默认值
 */
export function getPersonalization() {
  if (isPreviewModeActive()) {
    const draft = getPreviewDraft()
    if (draft) return draft
  }
  // 空间查看态：空间主有配置用配置，否则白色默认（不回退到查看者本人的存档）
  if (viewingActive) return viewingConfig ? clone(viewingConfig) : buildDefaultConfig()
  return getSavedPersonalization()
}

/**
 * 保存个性化配置到 localStorage，并广播变更事件
 * @returns {boolean} 是否保存成功
 */
export function savePersonalization(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    // 本人保存配置时同步刷新访客查看配置，避免主页读到旧的查看缓存
    if (viewingActive) {
      viewingConfig = mergeWithDefaults(config)
    }
    dispatchChanged(clone(getPersonalization()))
    return true
  } catch (err) {
    console.error('[personalization] 保存失败:', err)
    return false
  }
}

// ==================== 访客查看配置 ====================

// 运行时内存中的"当前查看的配置"（访客模式，不写入 localStorage）
let viewingConfig = null
// 是否处于空间查看态（无论空间主是否有自定义配置）；
// 空间配色只看空间主的设置，与平台主题完全隔离
let viewingActive = false

/**
 * 设置当前查看的空间配置（访客打开 /@slug 时由 Space.vue 调用）
 * - 只写入内存变量，不动 localStorage 中的本人配置
 * - 立即套用空间配色：空间主有自定义用自定义，否则回退白色默认主题；
 *   绝不沿用平台主题（平台主题只作用于平台页面）
 * - 派发 personalization-changed，detail 为当前生效的配置
 * @param {object|null} config 后端拉取的配置（configFromBackend 之后的 camelCase 结构），传 null 使用白色默认
 */
export function setViewingPersonalization(config) {
  viewingActive = true
  viewingConfig = config && typeof config === 'object' ? mergeWithDefaults(config) : null
  const effective = viewingConfig || buildDefaultConfig()
  applyTheme(effective.theme, effective.site)
  applyBackground(effective.background)
  dispatchChanged(clone(getPersonalization()))
}

/**
 * 清除访客查看配置（离开空间壳 Space.vue 时调用）
 * 离开后恢复平台主题（若 admin 已应用）；未设置平台主题则移除行内变量回到静态默认
 */
export function clearViewingPersonalization() {
  if (!viewingActive) return
  viewingActive = false
  viewingConfig = null
  // 先派发事件再套用主题：本函数在 Space.vue 卸载期间调用，此时子组件（SpaceHome）
  // 的 personalization-changed 监听器仍然存活，会按事件 detail 重新套用主题；
  // 最后执行的必须是我们自己的主题恢复，否则会被监听器的默认主题覆盖
  dispatchChanged(clone(getPersonalization()))
  if (platformTheme) {
    applyTheme(mapKeys(platformTheme, THEME_FIELD_MAP, 'fromBackend'))
  } else {
    removeInlineThemeVars()
  }
  // 空间的自定义背景（图片/渐变）也不能带出到平台页面
  applyBackground(buildDefaultConfig().background)
}

/**
 * 重置为默认配置（清除本地存档并广播）
 */
export function resetPersonalization() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    // ignore
  }
  const defaults = buildDefaultConfig()
  dispatchChanged(clone(defaults))
  return defaults
}

// ==================== 主题与背景应用 ====================

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const safeColor = (value, fallback) => (HEX_COLOR_RE.test(String(value || '')) ? value : fallback)

/**
 * 将主题色与站点字体应用到文档 CSS 变量
 * @param {object} theme { primaryColor, primaryDark, secondaryColor, accentColor, bgLight }
 * @param {object} [site] { fontFamily, logoSize }
 */
export function applyTheme(theme = {}, site = {}) {
  if (typeof document === 'undefined') return
  const root = document.documentElement.style
  const defaults = buildDefaultConfig().theme

  root.setProperty('--primary-color', safeColor(theme.primaryColor, defaults.primaryColor))
  root.setProperty('--primary-dark', safeColor(theme.primaryDark, defaults.primaryDark))
  root.setProperty('--secondary-color', safeColor(theme.secondaryColor, defaults.secondaryColor))
  root.setProperty('--accent-color', safeColor(theme.accentColor, defaults.accentColor))
  root.setProperty('--bg-light', safeColor(theme.bgLight, defaults.bgLight))

  if (site && typeof site.fontFamily === 'string' && site.fontFamily) {
    root.setProperty('--font-body', site.fontFamily)
    root.setProperty('--font-heading', site.fontFamily)
  }
}

// ==================== 平台主题 ====================

// 移除 applyTheme 写入的行内 CSS 变量，恢复静态 CSS 默认值
function removeInlineThemeVars() {
  if (typeof document === 'undefined') return
  const root = document.documentElement.style
  root.removeProperty('--primary-color')
  root.removeProperty('--primary-dark')
  root.removeProperty('--secondary-color')
  root.removeProperty('--accent-color')
  root.removeProperty('--bg-light')
}

// 管理后台应用的全平台主题（snake_case，来自 GET /site/home 的 platform_theme），
// 只作用于平台页面；空间页面的配色由空间主决定（默认白色）
let platformTheme = null

/**
 * 应用平台主题到文档 CSS 变量并记为基准主题
 * 当前正处于空间查看态时只记录不套用（空间配色归空间主）
 * @param {object} theme { primary_color, primary_dark, secondary_color, accent_color, bg_light }
 */
export function applyPlatformTheme(theme = {}) {
  if (typeof document === 'undefined') return
  const defaults = buildDefaultConfig().theme
  platformTheme = {
    primary_color: safeColor(theme.primary_color, defaults.primaryColor),
    primary_dark: safeColor(theme.primary_dark, defaults.primaryDark),
    secondary_color: safeColor(theme.secondary_color, defaults.secondaryColor),
    accent_color: safeColor(theme.accent_color, defaults.accentColor),
    bg_light: safeColor(theme.bg_light, defaults.bgLight)
  }
  if (!viewingActive) {
    applyTheme(mapKeys(platformTheme, THEME_FIELD_MAP, 'fromBackend'))
  }
}

/**
 * 清除平台主题：移除行内 CSS 变量，恢复静态 CSS 默认值
 * 未应用过平台主题时为无操作
 */
export function clearPlatformTheme() {
  if (!platformTheme) return
  platformTheme = null
  removeInlineThemeVars()
}

/**
 * 路由级主题同步（由 router.afterEach 调用）：
 * - 空间路由：无操作，空间配色由 Space.vue 的查看态逻辑（setViewingPersonalization）负责
 * - 非空间路由：已应用平台主题则重新套用（覆盖装修页/预览残留的行内变量），
 *   否则移除行内变量回到静态默认；同时重置 body 背景，
 *   避免空间/预览的背景图片或渐变泄漏到平台页面
 * @param {boolean} isSpaceRoute
 */
export function applyRouteTheme(isSpaceRoute) {
  if (isSpaceRoute) return
  if (platformTheme) {
    applyTheme(mapKeys(platformTheme, THEME_FIELD_MAP, 'fromBackend'))
  } else {
    removeInlineThemeVars()
  }
  applyBackground(buildDefaultConfig().background)
}

/**
 * 拼接 CSS 渐变字符串
 * @param {object} background { gradientFrom, gradientTo, gradientAngle }
 */
export function buildGradientValue(background = {}) {
  const from = safeColor(background.gradientFrom, '#FFFFFF')
  const to = safeColor(background.gradientTo, '#E5E7EB')
  const angle = Number.isFinite(Number(background.gradientAngle)) ? Number(background.gradientAngle) : 135
  return `linear-gradient(${angle}deg, ${from}, ${to})`
}

/**
 * 将页面背景应用到 body
 * @param {object} background 见文件头数据结构
 */
export function applyBackground(background = {}) {
  if (typeof document === 'undefined') return
  const body = document.body.style

  // 先重置
  body.backgroundImage = ''
  body.backgroundColor = ''
  body.backgroundSize = ''
  body.backgroundPosition = ''
  body.backgroundRepeat = ''
  body.backgroundAttachment = ''

  if (!background.enabled) return

  if (background.type === 'color') {
    body.backgroundColor = safeColor(background.color, '#FFFFFF')
  } else if (background.type === 'image' && background.image) {
    body.backgroundImage = `url("${String(background.image).replace(/"/g, '%22')}")`
    body.backgroundSize = 'cover'
    body.backgroundPosition = 'center'
    body.backgroundRepeat = 'no-repeat'
    body.backgroundAttachment = 'fixed'
  } else if (background.type === 'gradient') {
    body.backgroundImage = buildGradientValue(background)
    body.backgroundAttachment = 'fixed'
  }
}

// ==================== 预览模式 ====================

/**
 * 进入预览模式：把当前编辑草稿写入 sessionStorage 并实时应用
 */
export function enterPreviewMode(config) {
  try {
    sessionStorage.setItem(PREVIEW_DRAFT_KEY, JSON.stringify(config))
    sessionStorage.setItem(PREVIEW_ACTIVE_KEY, '1')
  } catch (err) {
    console.error('[personalization] 预览草稿保存失败:', err)
  }
  applyTheme(config.theme, config.site)
  applyBackground(config.background)
  dispatchChanged(clone(config))
  dispatchPreviewChanged(true)
}

/**
 * 退出预览模式：清除草稿，恢复已保存配置
 */
export function exitPreviewMode() {
  try {
    sessionStorage.removeItem(PREVIEW_DRAFT_KEY)
    sessionStorage.removeItem(PREVIEW_ACTIVE_KEY)
  } catch (err) {
    // ignore
  }
  const saved = getSavedPersonalization()
  applyTheme(saved.theme, saved.site)
  applyBackground(saved.background)
  dispatchChanged(saved)
  dispatchPreviewChanged(false)
}

/**
 * 当前是否处于预览模式
 */
export function isPreviewModeActive() {
  try {
    return sessionStorage.getItem(PREVIEW_ACTIVE_KEY) === '1'
  } catch (err) {
    return false
  }
}

/**
 * 获取预览草稿（装修页返回时恢复编辑现场），无则返回 null
 */
export function getPreviewDraft() {
  try {
    const draft = safeParse(sessionStorage.getItem(PREVIEW_DRAFT_KEY))
    return draft ? mergeWithDefaults(draft) : null
  } catch (err) {
    return null
  }
}

// ==================== 主题预设 ====================

// 内置预设（name 与 Personalization.vue 的 copy.presets 键对齐）
const BUILT_IN_PRESETS = [
  { name: '森林绿', primaryColor: '#4A6B4A', primaryDark: '#3A563A', secondaryColor: '#6B8E6B', accentColor: '#8FAE8F', bgLight: '#F4F7F4' },
  { name: '海洋蓝', primaryColor: '#2563EB', primaryDark: '#1D4ED8', secondaryColor: '#3B82F6', accentColor: '#60A5FA', bgLight: '#EFF6FF' },
  { name: '樱花粉', primaryColor: '#DB2777', primaryDark: '#BE185D', secondaryColor: '#EC4899', accentColor: '#F472B6', bgLight: '#FDF2F8' },
  { name: '紫罗兰', primaryColor: '#7C3AED', primaryDark: '#6D28D9', secondaryColor: '#8B5CF6', accentColor: '#A78BFA', bgLight: '#F5F3FF' },
  { name: '薄荷青', primaryColor: '#0D9488', primaryDark: '#0F766E', secondaryColor: '#14B8A6', accentColor: '#2DD4BF', bgLight: '#F0FDFA' },
  { name: '日落橙', primaryColor: '#EA580C', primaryDark: '#C2410C', secondaryColor: '#F97316', accentColor: '#FB923C', bgLight: '#FFF7ED' }
]

function loadCustomPresets() {
  const list = safeParse(localStorage.getItem(PRESETS_KEY))
  return Array.isArray(list) ? list : []
}

// 平台预设（管理后台发布的主题，GET /theme-presets），缓存 Promise，静默失败返回 []
let platformPresetsPromise = null

/**
 * 获取平台主题预设（snake_case -> 与内置预设一致的 camelCase 结构）
 * @returns {Promise<Array>} [{ name, primaryColor, primaryDark, secondaryColor, accentColor, bgLight }]
 */
export function fetchPlatformPresets() {
  if (!platformPresetsPromise) {
    platformPresetsPromise = apiRequest(API_ENDPOINTS.THEME_PRESETS, { auth: false, showError: false })
      .then((data) => {
        const list = Array.isArray(data?.list) ? data.list : []
        return list.map(preset => ({
          name: preset.name,
          primaryColor: preset.primary_color,
          primaryDark: preset.primary_dark,
          secondaryColor: preset.secondary_color,
          accentColor: preset.accent_color,
          bgLight: preset.bg_light
        }))
      })
      .catch(() => [])
  }
  return platformPresetsPromise
}

/**
 * 获取全部主题预设（内置 + 自定义），每项：
 * { name, primaryColor, primaryDark, secondaryColor, accentColor, bgLight, isCustom }
 */
export function getThemePresets() {
  const builtIn = BUILT_IN_PRESETS.map(preset => ({ ...preset, isCustom: false }))
  const custom = loadCustomPresets().map(preset => ({ ...preset, isCustom: true }))
  return [...builtIn, ...custom]
}

/**
 * 添加自定义主题预设
 * @returns {{ ok: boolean, reason?: string, preset?: object }}
 */
export function addThemePreset(preset) {
  const name = String(preset?.name || '').trim()
  if (!name) {
    return { ok: false, reason: 'invalid' }
  }

  const existing = getThemePresets().find(item => item.name === name)
  if (existing) {
    return { ok: false, reason: 'duplicate', preset: existing }
  }

  const record = {
    name,
    primaryColor: safeColor(preset.primaryColor, '#1A1A1A'),
    primaryDark: safeColor(preset.primaryDark, '#000000'),
    secondaryColor: safeColor(preset.secondaryColor, '#4B5563'),
    accentColor: safeColor(preset.accentColor, '#3B82F6'),
    bgLight: safeColor(preset.bgLight, '#FFFFFF')
  }

  try {
    const custom = loadCustomPresets()
    custom.push(record)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(custom))
  } catch (err) {
    console.error('[personalization] 预设保存失败:', err)
    return { ok: false, reason: 'storage' }
  }

  return { ok: true, preset: { ...record, isCustom: true } }
}

/**
 * 删除自定义主题预设（内置预设不可删除）
 * @returns {{ ok: boolean }}
 */
export function removeThemePreset(name) {
  const custom = loadCustomPresets()
  const next = custom.filter(preset => preset.name !== name)
  if (next.length === custom.length) {
    return { ok: false }
  }
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(next))
    return { ok: true }
  } catch (err) {
    console.error('[personalization] 预设删除失败:', err)
    return { ok: false }
  }
}

// ==================== 文件工具 ====================

/**
 * 读取图片文件为 base64 data URL
 * @param {File} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error('无效的文件'))
      return
    }
    if (file.type && !file.type.startsWith('image/')) {
      reject(new Error('仅支持图片文件'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

// ==================== HTML / CSS 白名单过滤 ====================

// 自定义板块允许的标签与属性
const ALLOWED_HTML_TAGS = new Set(['P', 'B', 'I', 'U', 'A', 'UL', 'OL', 'LI', 'H3', 'H4', 'BLOCKQUOTE', 'BR', 'IMG'])
const ALLOWED_HTML_ATTRS = {
  A: ['href', 'target', 'rel'],
  IMG: ['src', 'alt']
}

const isSafeUrl = (value, { allowDataImage = false } = {}) => {
  const url = String(value || '').trim()
  if (!url) return false
  if (/^javascript\s*:/i.test(url)) return false
  if (/^data\s*:/i.test(url)) {
    return allowDataImage && /^data\s*:\s*image\//i.test(url)
  }
  return true
}

/**
 * 白名单过滤自定义板块 HTML：
 * - 剥离 script/style/iframe 等未放行标签（保留其纯文本内容）
 * - 剥离 on* 事件属性与 javascript:/data:（图片除外）协议
 * @param {string} html
 * @returns {string} 过滤后的 HTML
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return ''
  if (typeof DOMParser === 'undefined') {
    // 非浏览器环境兜底：去掉所有标签
    return html.replace(/<[^>]*>/g, '')
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')

  const cleanNode = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) continue
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove()
        continue
      }

      const tag = child.tagName
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'].includes(tag)) {
        child.remove()
        continue
      }

      if (!ALLOWED_HTML_TAGS.has(tag)) {
        // 未放行标签：递归处理子节点后拆包（保留内部文本/合法标签）
        cleanNode(child)
        child.replaceWith(...Array.from(child.childNodes))
        continue
      }

      // 属性白名单
      const allowedAttrs = ALLOWED_HTML_ATTRS[tag] || []
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase()
        if (!allowedAttrs.includes(name) || name.startsWith('on')) {
          child.removeAttribute(attr.name)
          continue
        }
        if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value, { allowDataImage: tag === 'IMG' })) {
          child.removeAttribute(attr.name)
        }
      }
      if (tag === 'A') {
        child.setAttribute('rel', 'noopener noreferrer')
        if (!child.getAttribute('target')) child.setAttribute('target', '_blank')
      }

      cleanNode(child)
    }
  }

  cleanNode(doc.body)
  return doc.body.innerHTML
}

/**
 * 基本防注入的 CSS 过滤：
 * - 剥离 </style、@import、expression(、javascript:
 * - url() 中禁止 data: 协议（http(s) 图片地址放行）
 * @param {string} css
 * @returns {string} 过滤后的 CSS
 */
export function sanitizeCSS(css) {
  if (!css || typeof css !== 'string') return ''
  return css
    .replace(/<\/?style[^>]*>/gi, '')
    .replace(/@import\b[^;]*;?/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/url\(\s*(['"]?)\s*data\s*:[^)]*\)/gi, 'none')
}

// ==================== 前后端字段映射 ====================

const THEME_FIELD_MAP = {
  primaryColor: 'primary_color',
  primaryDark: 'primary_dark',
  secondaryColor: 'secondary_color',
  accentColor: 'accent_color',
  bgLight: 'bg_light'
}

const BACKGROUND_FIELD_MAP = {
  gradientFrom: 'gradient_from',
  gradientTo: 'gradient_to',
  gradientAngle: 'gradient_angle'
}

const SITE_FIELD_MAP = {
  logoSize: 'logo_size',
  fontFamily: 'font_family'
}

const PINNED_FIELD_MAP = {
  momentId: 'moment_id',
  workId: 'work_id'
}

const mapKeys = (obj, map, direction) => {
  const result = {}
  for (const [key, value] of Object.entries(obj || {})) {
    if (direction === 'toBackend') {
      result[map[key] || key] = value
    } else {
      const frontendKey = Object.keys(map).find(k => map[k] === key) || key
      result[frontendKey] = value
    }
  }
  return result
}

/**
 * 前端 config -> 后端 DTO（snake_case）
 */
export function configToBackend(config) {
  const safe = config || {}
  return {
    profile: clone(safe.profile || {}),
    theme: mapKeys(safe.theme, THEME_FIELD_MAP, 'toBackend'),
    hero: clone(safe.hero || {}),
    background: mapKeys(safe.background, BACKGROUND_FIELD_MAP, 'toBackend'),
    gallery: clone(safe.gallery || {}),
    site: mapKeys(safe.site, SITE_FIELD_MAP, 'toBackend'),
    modules: clone(safe.modules || {}),
    section_order: Array.isArray(safe.sectionOrder) ? [...safe.sectionOrder] : [],
    custom_sections: clone(safe.customSections || []),
    pinned: mapKeys(safe.pinned, PINNED_FIELD_MAP, 'toBackend'),
    custom_css: typeof safe.customCSS === 'string' ? safe.customCSS : ''
  }
}

/**
 * 后端 DTO -> 前端 config（camelCase），无效输入返回 null
 */
export function configFromBackend(data) {
  if (!data || typeof data !== 'object') return null
  const config = {}
  if (data.profile) config.profile = data.profile
  if (data.theme) config.theme = mapKeys(data.theme, THEME_FIELD_MAP, 'fromBackend')
  if (data.hero) config.hero = data.hero
  if (data.background) config.background = mapKeys(data.background, BACKGROUND_FIELD_MAP, 'fromBackend')
  if (data.gallery) config.gallery = data.gallery
  if (data.site) config.site = mapKeys(data.site, SITE_FIELD_MAP, 'fromBackend')
  if (data.modules) config.modules = data.modules
  if (data.section_order) config.sectionOrder = data.section_order
  if (data.custom_sections) config.customSections = data.custom_sections
  if (data.pinned) config.pinned = mapKeys(data.pinned, PINNED_FIELD_MAP, 'fromBackend')
  if (data.custom_css !== undefined) config.customCSS = data.custom_css
  return Object.keys(config).length > 0 ? config : null
}
