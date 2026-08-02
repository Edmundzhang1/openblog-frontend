/**
 * 静态资源占位图配置
 *
 * 极简主义设计系统迁移后，所有占位图统一使用内联 SVG data URI 生成，
 * 配色使用中性灰（#E5E7EB 底、#9CA3AF 字），不再依赖外部占位图服务。
 */

const PLACEHOLDER_BG = '#E5E7EB'
const PLACEHOLDER_FG = '#9CA3AF'

/**
 * 生成内联 SVG 占位图 data URI
 * @param {number} width 宽度
 * @param {number} height 高度
 * @param {string} text 居中文字
 * @param {string} bgColor 背景色（可选，默认中性灰）
 * @param {string} fgColor 文字颜色（可选）
 * @returns {string} data:image/svg+xml URI
 */
export function svgPlaceholder(width, height, text = '', bgColor = PLACEHOLDER_BG, fgColor = PLACEHOLDER_FG) {
  const safeText = String(text ?? '').slice(0, 40)
  const fontSize = Math.max(12, Math.round(Math.min(width, height) / 10))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${bgColor}"/>` +
    (safeText
      ? `<text x="50%" y="50%" fill="${fgColor}" font-family="Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${safeText}</text>`
      : '') +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// ==================== 通用图片 ====================

export const IMAGES = {
  // 默认头像（大）
  defaultAvatar: svgPlaceholder(200, 200, 'Avatar'),
  // 默认头像（小）
  defaultAvatarSmall: svgPlaceholder(80, 80, 'A'),
  // 图片加载失败占位
  imageLoadError: svgPlaceholder(400, 300, 'Image Load Failed'),
  // 图片加载失败占位（大）
  imageLoadErrorLarge: svgPlaceholder(1200, 800, 'Image Load Failed')
}

// ==================== 首页图片 ====================

const ARTWORK_SEED = {
  zh: [
    { id: 'art-zh-1', title: '头像示例 · 其一', category: 'avatar', desc: '头像' },
    { id: 'art-zh-2', title: '头像示例 · 其二', category: 'avatar', desc: '头像' },
    { id: 'art-zh-3', title: '立绘示例 · 其一', category: 'character', desc: '立绘' },
    { id: 'art-zh-4', title: '立绘示例 · 其二', category: 'character', desc: '立绘' },
    { id: 'art-zh-5', title: '插图示例 · 其一', category: 'illustration', desc: '插图' },
    { id: 'art-zh-6', title: '插图示例 · 其二', category: 'illustration', desc: '插图' },
    { id: 'art-zh-7', title: '设定图示例 · 其一', category: 'concept', desc: '设定图' },
    { id: 'art-zh-8', title: '设定图示例 · 其二', category: 'concept', desc: '设定图' }
  ],
  en: [
    { id: 'art-en-1', title: 'Avatar Sample I', category: 'avatar', desc: 'Avatar' },
    { id: 'art-en-2', title: 'Avatar Sample II', category: 'avatar', desc: 'Avatar' },
    { id: 'art-en-3', title: 'Character Sample I', category: 'character', desc: 'Character' },
    { id: 'art-en-4', title: 'Character Sample II', category: 'character', desc: 'Character' },
    { id: 'art-en-5', title: 'Illustration Sample I', category: 'illustration', desc: 'Illustration' },
    { id: 'art-en-6', title: 'Illustration Sample II', category: 'illustration', desc: 'Illustration' },
    { id: 'art-en-7', title: 'Concept Sample I', category: 'concept', desc: 'Concept' },
    { id: 'art-en-8', title: 'Concept Sample II', category: 'concept', desc: 'Concept' }
  ]
}

const buildArtworks = (locale) =>
  ARTWORK_SEED[locale].map((item, index) => ({
    ...item,
    image: svgPlaceholder(600, index % 2 === 0 ? 750 : 600, item.desc)
  }))

export const HOME_IMAGES = {
  // 首页轮播展示图（中英各 3 张）
  showcases: {
    zh: [
      svgPlaceholder(1600, 900, '专业插画约稿服务'),
      svgPlaceholder(1600, 900, '多样化画风选择'),
      svgPlaceholder(1600, 900, '高效沟通 · 品质保证')
    ],
    en: [
      svgPlaceholder(1600, 900, 'Professional Commissions'),
      svgPlaceholder(1600, 900, 'Flexible Style Options'),
      svgPlaceholder(1600, 900, 'Clear Communication')
    ]
  },
  // 首页画廊示例作品
  artworks: {
    zh: buildArtworks('zh'),
    en: buildArtworks('en')
  }
}

// ==================== 约稿页图片 ====================

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export const COMMISSION_IMAGES = {
  /**
   * 画风占位图
   * @param {string} label 画风名称
   * @param {string} color 主题色（非法值自动回退到中性灰）
   */
  stylePlaceholder(label, color) {
    const bg = HEX_COLOR_RE.test(String(color || '')) ? color : PLACEHOLDER_BG
    return svgPlaceholder(600, 400, label || 'Style', bg, '#FFFFFF')
  },
  // 图片加载失败占位
  loadError: svgPlaceholder(600, 400, 'Image Load Failed')
}

// ==================== 个性化装修图片 ====================

export const PERSONALIZATION_IMAGES = {
  // 通用加载失败兜底
  fallback: svgPlaceholder(600, 400, 'Image Load Failed'),
  // 默认轮播图
  defaultHero: svgPlaceholder(1600, 900, 'Hero Image'),
  // 默认作品卡片
  defaultCard: svgPlaceholder(600, 750, 'Artwork')
}
