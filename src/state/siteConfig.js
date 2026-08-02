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
    const candidates = [API_ENDPOINTS.SITE_CONFIG, '/site/home']
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
