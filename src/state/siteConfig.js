/**
 * 全局站点配置（响应式单例）
 *
 * 消费方：
 * - components/Navbar.vue：品牌 Logo 与站点名展示
 * - views/Login.vue：登录页品牌名
 * - views/AdminDashboard.vue：保存站点配置后调用 refreshSiteConfig()
 */
import { reactive } from 'vue'
import { getApiUrl, API_ENDPOINTS } from '../config/api.js'
import { applyPlatformTheme, clearPlatformTheme } from '../utils/personalization.js'

export const siteConfig = reactive({
  site_name: 'OpenBlog',
  site_logo_url: '',
  updated_at: null
})

// 防止并发重复拉取
let refreshing = null

// 后端响应可能是裸数据，也可能是 { code, message, data } 信封
const unwrap = (json) => {
  if (json && typeof json === 'object' && json.data && typeof json.data === 'object') {
    return json.data
  }
  return json
}

async function fetchConfig(url) {
  const response = await fetch(getApiUrl(url), {
    headers: { Accept: 'application/json' },
    credentials: 'include'
  })
  if (!response.ok) {
    throw new Error(`site config request failed: ${response.status}`)
  }
  return unwrap(await response.json())
}

/**
 * 从后端拉取站点配置并合并进响应式对象。
 * 失败时静默保留当前值（默认值或上次成功拉取的值）。
 */
export async function refreshSiteConfig() {
  if (refreshing) return refreshing

  refreshing = (async () => {
    // /site/home 为公开接口；/site/config 无公开路由，放在后面仅作兜底
    const candidates = ['/site/home', API_ENDPOINTS.SITE_CONFIG]
    for (const url of candidates) {
      try {
        const data = await fetchConfig(url)
        if (data && typeof data === 'object') {
          if (typeof data.site_name === 'string' && data.site_name) {
            siteConfig.site_name = data.site_name
          }
          if (typeof data.site_logo_url === 'string') {
            siteConfig.site_logo_url = data.site_logo_url
          }
          if (data.updated_at) {
            siteConfig.updated_at = data.updated_at
          }
          // 平台主题：存在则应用为全站基准主题；之前应用过而现在缺失则清除
          if (data.platform_theme && typeof data.platform_theme === 'object') {
            applyPlatformTheme(data.platform_theme)
          } else {
            clearPlatformTheme()
          }
          return siteConfig
        }
      } catch (err) {
        // 尝试下一个候选端点
      }
    }
    return siteConfig
  })().finally(() => {
    refreshing = null
  })

  return refreshing
}

// 模块加载时自动拉取一次
refreshSiteConfig()
