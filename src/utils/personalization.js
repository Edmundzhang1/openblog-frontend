/**
 * 个性化配置管理模块
 * 使用 localStorage 持久化存储用户的个性化设置
 */

const STORAGE_KEY = 'openblog_personalization'
const PREVIEW_DRAFT_KEY = 'openblog_personalization_preview_draft'
const PREVIEW_ACTIVE_KEY = 'openblog_personalization_preview_active'
const CUSTOM_THEME_PRESETS_KEY = 'openblog_custom_theme_presets'
const THEME_PRESET_FIELDS = ['primaryColor', 'primaryDark', 'secondaryColor', 'accentColor', 'bgLight']
const LEGACY_EMPTY_LOGO = '/src/assets/images/logo.png'
const DEFAULT_SITE_FONT_FAMILY = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif'
const DEFAULT_LOGO_SIZE = 56

export const siteFontOptions = [
  {
    label: '清晰黑体',
    value: DEFAULT_SITE_FONT_FAMILY,
    preview: '结构清晰，适合内容展示'
  },
  {
    label: '圆润现代',
    value: '"Segoe UI", "Helvetica Neue", "PingFang SC", sans-serif',
    preview: '更轻盈的现代界面风格'
  },
  {
    label: '雅致宋体',
    value: '"STSong", "Songti SC", "SimSun", serif',
    preview: '偏编辑感，适合站点标题展示'
  },
  {
    label: '手写楷体',
    value: '"STKaiti", "KaiTi", serif',
    preview: '更有个性和作品集气质'
  },
  {
    label: '经典衬线',
    value: 'Georgia, "Times New Roman", "Songti SC", serif',
    preview: '更偏传统杂志式排版'
  }
]

// 默认配置
export const defaultConfig = {
  // 站点信息
  site: {
    name: 'FUREST',
    logo: '',
    favicon: '/favicon.ico',
    fontFamily: DEFAULT_SITE_FONT_FAMILY,
    logoSize: DEFAULT_LOGO_SIZE
  },
  
  // 主题颜色
  theme: {
    primaryColor: '#6b8e6b',
    primaryDark: '#4a6b4a',
    secondaryColor: '#f5f0e8',
    accentColor: '#d4a574',
    bgLight: '#faf8f5'
  },
  
  // 个人信息
  profile: {
    avatar: 'https://via.placeholder.com/150',
    name: '创作者',
    tags: ['插画师', '设计师'],
    bio: '欢迎来到我的个人空间，在这里你可以查看我的作品，也可以找我约稿合作。',
    emails: ['contact@example.com'],
    social: [
      { platform: 'twitter', url: '', icon: '🐦', name: 'Twitter' },
      { platform: 'instagram', url: '', icon: '📷', name: 'Instagram' },
      { platform: 'pixiv', url: '', icon: '🎨', name: 'Pixiv' },
      { platform: 'weibo', url: '', icon: '📝', name: '微博' },
      { platform: 'bilibili', url: '', icon: '📺', name: 'Bilibili' }
    ]
  },
  
  // 首页轮播图
  hero: {
    enabled: true,
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200',
        title: '创作，从心开始',
        desc: '每一幅作品都承载着独特的情感与故事'
      },
      {
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
        title: '专业约稿服务',
        desc: '为您提供高质量的定制插画与设计服务'
      },
      {
        image: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1200',
        title: '用心对待每个细节',
        desc: '致力于打造令您满意的视觉作品'
      }
    ]
  },
  
  // 背景设置
  background: {
    enabled: false,
    type: 'color', // 'color' | 'image' | 'gradient'
    value: '#faf8f5',
    color: '#faf8f5',
    image: '',
    opacity: 1,
    gradientFrom: '#faf8f5',
    gradientTo: '#f5f0e8',
    gradientAngle: 135
  },
  
  // 作品展示
  gallery: {
    title: '作品集',
    subtitle: '精选作品展示',
    works: [
      { id: 1, image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600', title: '作品 1', category: '插画' },
      { id: 2, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600', title: '作品 2', category: '插画' },
      { id: 3, image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600', title: '作品 3', category: '设计' },
      { id: 4, image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600', title: '作品 4', category: '设计' }
    ]
  }
}

function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config))
}

function dispatchPersonalizationChange(config) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('personalization-changed', { detail: cloneConfig(config) }))
}

function dispatchPreviewModeChange(active) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('personalization-preview-changed', { detail: { active } }))
}

function clampNumber(value, min, max, fallback) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return fallback
  }
  return Math.min(Math.max(numericValue, min), max)
}

function isSolidColorValue(value) {
  return typeof value === 'string' && value.trim() && !/gradient\(/i.test(value)
}

function parseGradientValue(value = '') {
  const fallback = {
    gradientFrom: defaultConfig.background.gradientFrom,
    gradientTo: defaultConfig.background.gradientTo,
    gradientAngle: defaultConfig.background.gradientAngle
  }

  if (typeof value !== 'string' || !value.trim()) {
    return fallback
  }

  const colors = value.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g) || []
  const angleMatch = value.match(/(-?\d+(?:\.\d+)?)deg/i)

  return {
    gradientFrom: colors[0] || fallback.gradientFrom,
    gradientTo: colors[1] || colors[0] || fallback.gradientTo,
    gradientAngle: clampNumber(angleMatch?.[1], 0, 360, fallback.gradientAngle)
  }
}

export function buildGradientValue(background = {}) {
  const gradientFrom = background.gradientFrom || defaultConfig.background.gradientFrom
  const gradientTo = background.gradientTo || defaultConfig.background.gradientTo
  const gradientAngle = clampNumber(background.gradientAngle, 0, 360, defaultConfig.background.gradientAngle)

  return `linear-gradient(${gradientAngle}deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
}

function normalizeSiteConfig(site = {}) {
  const normalized = {
    ...defaultConfig.site,
    ...(site || {})
  }

  normalized.logo = typeof normalized.logo === 'string' ? normalized.logo.trim() : ''
  if (normalized.logo === LEGACY_EMPTY_LOGO) {
    normalized.logo = ''
  }

  normalized.fontFamily = normalized.fontFamily || defaultConfig.site.fontFamily
  normalized.logoSize = clampNumber(normalized.logoSize, 28, 120, DEFAULT_LOGO_SIZE)

  return normalized
}

function normalizeBackgroundConfig(background = {}) {
  const normalized = {
    ...defaultConfig.background,
    ...(background || {})
  }
  const parsedGradient = parseGradientValue(normalized.value)

  normalized.color = normalized.color || (isSolidColorValue(normalized.value) ? normalized.value : defaultConfig.background.color)
  normalized.gradientFrom = normalized.gradientFrom || parsedGradient.gradientFrom
  normalized.gradientTo = normalized.gradientTo || parsedGradient.gradientTo
  normalized.gradientAngle = clampNumber(normalized.gradientAngle, 0, 360, parsedGradient.gradientAngle)
  normalized.opacity = clampNumber(normalized.opacity, 0, 1, defaultConfig.background.opacity)

  if (normalized.type === 'color') {
    normalized.value = normalized.color
  } else if (normalized.type === 'gradient') {
    normalized.value = buildGradientValue(normalized)
  }

  return normalized
}

function normalizePersonalizationConfig(config = {}) {
  const mergedConfig = deepMerge(defaultConfig, config)
  mergedConfig.site = normalizeSiteConfig(mergedConfig.site)
  mergedConfig.background = normalizeBackgroundConfig(mergedConfig.background)
  if (mergedConfig.hero) {
    mergedConfig.hero.enabled = true
  }
  return mergedConfig
}

/**
 * 获取已保存的个性化配置
 */
export function getSavedPersonalization() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 合并默认配置和存储的配置，确保新字段不会丢失
      return normalizePersonalizationConfig(parsed)
    }
  } catch (e) {
    console.error('读取个性化配置失败:', e)
  }
  return normalizePersonalizationConfig()
}

/**
 * 获取预览草稿配置
 */
export function getPreviewDraft() {
  try {
    const stored = sessionStorage.getItem(PREVIEW_DRAFT_KEY)
    if (stored) {
      return normalizePersonalizationConfig(deepMerge(getSavedPersonalization(), JSON.parse(stored)))
    }
  } catch (e) {
    console.error('读取预览草稿失败:', e)
  }
  return null
}

/**
 * 获取个性化配置
 */
export function getPersonalization() {
  if (isPreviewModeActive()) {
    const previewDraft = getPreviewDraft()
    if (previewDraft) {
      return previewDraft
    }
  }

  return getSavedPersonalization()
}

/**
 * 保存预览草稿配置
 */
export function savePreviewDraft(config) {
  try {
    sessionStorage.setItem(PREVIEW_DRAFT_KEY, JSON.stringify(config))
    return true
  } catch (e) {
    console.error('保存预览草稿失败:', e)
    return false
  }
}

/**
 * 清除预览草稿配置
 */
export function clearPreviewDraft() {
  try {
    sessionStorage.removeItem(PREVIEW_DRAFT_KEY)
  } catch (e) {
    console.error('清除预览草稿失败:', e)
  }
}

/**
 * 预览模式是否激活
 */
export function isPreviewModeActive() {
  try {
    return sessionStorage.getItem(PREVIEW_ACTIVE_KEY) === 'true'
  } catch (e) {
    console.error('读取预览模式状态失败:', e)
    return false
  }
}

/**
 * 设置预览模式状态
 */
export function setPreviewModeActive(active) {
  try {
    if (active) {
      sessionStorage.setItem(PREVIEW_ACTIVE_KEY, 'true')
    } else {
      sessionStorage.removeItem(PREVIEW_ACTIVE_KEY)
    }
    dispatchPreviewModeChange(active)
  } catch (e) {
    console.error('设置预览模式状态失败:', e)
  }
}

/**
 * 保存个性化配置
 */
export function savePersonalization(config) {
  try {
    const normalizedConfig = normalizePersonalizationConfig(cloneConfig(config))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedConfig))
    clearPreviewDraft()
    setPreviewModeActive(false)
    dispatchPersonalizationChange(normalizedConfig)
    return true
  } catch (e) {
    console.error('保存个性化配置失败:', e)
    return false
  }
}

/**
 * 更新部分配置
 */
export function updatePersonalization(partialConfig) {
  const current = getPersonalization()
  const updated = deepMerge(current, partialConfig)
  return savePersonalization(updated)
}

/**
 * 重置为默认配置
 */
export function resetPersonalization() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    clearPreviewDraft()
    setPreviewModeActive(false)
    // 清除应用到DOM的样式
    const root = document.documentElement
    root.style.removeProperty('--primary-color')
    root.style.removeProperty('--primary-dark')
    root.style.removeProperty('--secondary-color')
    root.style.removeProperty('--accent-color')
    root.style.removeProperty('--bg-light')
    root.style.removeProperty('--site-font-family')
    
    const body = document.body
    body.style.background = ''
    body.style.backgroundImage = ''
    body.style.backgroundColor = ''
    body.style.backgroundSize = ''
    body.style.backgroundPosition = ''
    body.style.backgroundAttachment = ''
    body.style.backgroundRepeat = ''
    body.style.opacity = ''
    
    // 触发配置更新事件
    dispatchPersonalizationChange(normalizePersonalizationConfig())
    return true
  } catch (e) {
    console.error('重置个性化配置失败:', e)
    return false
  }
}

/**
 * 可用的社交平台列表
 */
export const availablePlatforms = [
  { platform: 'twitter', icon: '🐦', name: 'Twitter' },
  { platform: 'instagram', icon: '📷', name: 'Instagram' },
  { platform: 'pixiv', icon: '🎨', name: 'Pixiv' },
  { platform: 'weibo', icon: '📝', name: '微博' },
  { platform: 'bilibili', icon: '📺', name: 'Bilibili' },
  { platform: 'github', icon: '💻', name: 'GitHub' },
  { platform: 'youtube', icon: '▶️', name: 'YouTube' },
  { platform: 'facebook', icon: '📘', name: 'Facebook' },
  { platform: 'discord', icon: '💬', name: 'Discord' },
  { platform: 'telegram', icon: '✈️', name: 'Telegram' },
  { platform: 'xiaohongshu', icon: '📕', name: '小红书' },
  { platform: 'zhihu', icon: '❓', name: '知乎' },
  { platform: 'douyin', icon: '🎵', name: '抖音' },
  { platform: 'custom', icon: '🔗', name: '自定义' }
]

/**
 * 应用主题到 CSS 变量
 */
export function applyTheme(theme, site = {}) {
  const root = document.documentElement
  if (theme.primaryColor) root.style.setProperty('--primary-color', theme.primaryColor)
  if (theme.primaryDark) root.style.setProperty('--primary-dark', theme.primaryDark)
  if (theme.secondaryColor) root.style.setProperty('--secondary-color', theme.secondaryColor)
  if (theme.accentColor) root.style.setProperty('--accent-color', theme.accentColor)
  if (theme.bgLight) root.style.setProperty('--bg-light', theme.bgLight)
  root.style.setProperty('--site-font-family', site.fontFamily || defaultConfig.site.fontFamily)
}

function normalizeCssColor(color, fallback = defaultConfig.background.color) {
  if (typeof document === 'undefined' || !document.body) {
    return fallback
  }

  const probe = document.createElement('span')
  probe.style.color = color || fallback
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const normalizedColor = getComputedStyle(probe).color
  probe.remove()
  return normalizedColor || fallback
}

function colorToRgba(color, alpha) {
  const normalizedColor = normalizeCssColor(color)
  const channels = normalizedColor.match(/rgba?\(([^)]+)\)/i)?.[1]
    ?.split(',')
    .slice(0, 3)
    .map(value => Math.round(Number.parseFloat(value.trim()) || 0))

  if (!channels || channels.length < 3) {
    return `rgba(250, 248, 245, ${clampNumber(alpha, 0, 1, 1)})`
  }

  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${clampNumber(alpha, 0, 1, 1)})`
}

/**
 * 应用背景设置
 */
export function applyBackground(background) {
  const normalizedBackground = normalizeBackgroundConfig(background)
  const body = document.body

  // 清除之前的背景设置
  body.style.background = ''
  body.style.backgroundImage = ''
  body.style.backgroundColor = ''
  body.style.backgroundSize = ''
  body.style.backgroundPosition = ''
  body.style.backgroundAttachment = ''
  body.style.backgroundRepeat = ''
  body.style.opacity = ''

  if (!normalizedBackground.enabled) {
    body.style.backgroundColor = 'var(--bg-light)'
    return
  }

  switch (normalizedBackground.type) {
    case 'color':
      body.style.backgroundColor = normalizedBackground.color
      break
    case 'image':
      if (normalizedBackground.image) {
        const baseBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-light').trim() || normalizedBackground.color
        const overlayAlpha = clampNumber(1 - normalizedBackground.opacity, 0, 1, 0)
        const overlayColor = colorToRgba(baseBackgroundColor, overlayAlpha)

        body.style.backgroundColor = baseBackgroundColor
        body.style.backgroundImage = overlayAlpha > 0
          ? `linear-gradient(${overlayColor}, ${overlayColor}), url("${normalizedBackground.image}")`
          : `url("${normalizedBackground.image}")`
        body.style.backgroundSize = 'cover'
        body.style.backgroundPosition = 'center'
        body.style.backgroundAttachment = 'fixed'
        body.style.backgroundRepeat = 'no-repeat'
      }
      break
    case 'gradient':
      body.style.backgroundImage = buildGradientValue(normalizedBackground)
      break
  }
}

/**
 * 初始化个性化设置
 */
export function initPersonalization() {
  const config = getPersonalization()
  applyTheme(config.theme, config.site)
  applyBackground(config.background)
  return config
}

/**
 * 进入预览模式
 */
export function enterPreviewMode(config) {
  const previewConfig = normalizePersonalizationConfig(deepMerge(defaultConfig, cloneConfig(config)))
  savePreviewDraft(previewConfig)
  setPreviewModeActive(true)
  applyTheme(previewConfig.theme, previewConfig.site)
  applyBackground(previewConfig.background)
  dispatchPersonalizationChange(previewConfig)
  return previewConfig
}

/**
 * 退出预览模式
 */
export function exitPreviewMode(options = {}) {
  const { preserveDraft = true, emitChange = true } = options

  setPreviewModeActive(false)
  if (!preserveDraft) {
    clearPreviewDraft()
  }

  const savedConfig = getSavedPersonalization()
  applyTheme(savedConfig.theme, savedConfig.site)
  applyBackground(savedConfig.background)
  if (emitChange) {
    dispatchPersonalizationChange(savedConfig)
  }
  return savedConfig
}

/**
 * 深合并对象
 */
function deepMerge(target, source) {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isObject(result[key]) && isObject(source[key])) {
        result[key] = deepMerge(result[key], source[key])
      } else {
        result[key] = source[key]
      }
    }
  }
  
  return result
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * 图片转 Base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 预设主题配色方案
 */
export const themePresets = [
  { name: '森林绿', primaryColor: '#6b8e6b', primaryDark: '#4a6b4a', accentColor: '#d4a574' },
  { name: '海洋蓝', primaryColor: '#4a90a4', primaryDark: '#2d6a7a', accentColor: '#f4a261' },
  { name: '樱花粉', primaryColor: '#d4a5a5', primaryDark: '#b88888', accentColor: '#a8d8ea' },
  { name: '紫罗兰', primaryColor: '#8b7bb5', primaryDark: '#6b5a95', accentColor: '#f4d03f' },
  { name: '薄荷青', primaryColor: '#5fb3a3', primaryDark: '#4a9083', accentColor: '#f8b500' },
  { name: '日落橙', primaryColor: '#e07b53', primaryDark: '#c45a32', accentColor: '#2a9d8f' },
  { name: '暗夜黑', primaryColor: '#4a5568', primaryDark: '#2d3748', accentColor: '#63b3ed' }
]

function normalizeThemePreset(preset = {}) {
  const normalized = {
    name: String(preset.name || '自定义方案').trim() || '自定义方案'
  }

  THEME_PRESET_FIELDS.forEach((field) => {
    normalized[field] = preset[field] || defaultConfig.theme[field]
  })

  return normalized
}

function getThemePresetSignature(preset) {
  const normalized = normalizeThemePreset(preset)
  return THEME_PRESET_FIELDS.map(field => normalized[field]).join('|')
}

function createUniqueThemePresetName(baseName, presets) {
  const normalizedBaseName = String(baseName || '自定义方案').trim() || '自定义方案'
  const presetNames = new Set(presets.map(preset => preset.name))

  if (!presetNames.has(normalizedBaseName)) {
    return normalizedBaseName
  }

  let suffix = 2
  let candidate = `${normalizedBaseName} ${suffix}`

  while (presetNames.has(candidate)) {
    suffix += 1
    candidate = `${normalizedBaseName} ${suffix}`
  }

  return candidate
}

function getStoredCustomThemePresets() {
  try {
    const stored = localStorage.getItem(CUSTOM_THEME_PRESETS_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed.map(preset => ({
      ...normalizeThemePreset(preset),
      isCustom: true
    }))
  } catch (e) {
    console.error('读取自定义主题预设失败:', e)
    return []
  }
}

export function getBuiltInThemePresets() {
  return themePresets.map(preset => normalizeThemePreset(preset))
}

export function getCustomThemePresets() {
  return getStoredCustomThemePresets()
}

export function getThemePresets() {
  return [
    ...getBuiltInThemePresets(),
    ...getCustomThemePresets()
  ]
}

export function addThemePreset(preset) {
  try {
    const existingPresets = getThemePresets()
    const normalizedPreset = normalizeThemePreset(preset)
    const targetSignature = getThemePresetSignature(normalizedPreset)
    const duplicatedPreset = existingPresets.find(existing => getThemePresetSignature(existing) === targetSignature)

    if (duplicatedPreset) {
      return {
        ok: false,
        reason: 'duplicate',
        preset: duplicatedPreset
      }
    }

    const presetToSave = {
      ...normalizedPreset,
      name: createUniqueThemePresetName(normalizedPreset.name, existingPresets)
    }

    const customPresets = getStoredCustomThemePresets().map(({ isCustom, ...rest }) => rest)
    customPresets.push(presetToSave)
    localStorage.setItem(CUSTOM_THEME_PRESETS_KEY, JSON.stringify(customPresets))

    return {
      ok: true,
      preset: {
        ...presetToSave,
        isCustom: true
      }
    }
  } catch (e) {
    console.error('保存自定义主题预设失败:', e)
    return {
      ok: false,
      reason: 'error'
    }
  }
}

export function removeThemePreset(name) {
  try {
    const currentCustomPresets = getStoredCustomThemePresets().map(({ isCustom, ...rest }) => rest)
    const nextCustomPresets = currentCustomPresets.filter(preset => preset.name !== name)

    if (nextCustomPresets.length === currentCustomPresets.length) {
      return {
        ok: false,
        reason: 'not_found'
      }
    }

    localStorage.setItem(CUSTOM_THEME_PRESETS_KEY, JSON.stringify(nextCustomPresets))

    return {
      ok: true
    }
  } catch (e) {
    console.error('删除自定义主题预设失败:', e)
    return {
      ok: false,
      reason: 'error'
    }
  }
}
