import { getApiUrl, getAssetUrl, getAuthHeaders, DEFAULT_HEADERS, WITH_CREDENTIALS } from '@/config/api.js'

// 简单的事件总线
class EventBus {
  constructor() {
    this.events = {}
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event, callback) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  emit(event, ...args) {
    if (!this.events[event]) return
    this.events[event].forEach(callback => callback(...args))
  }
}

export const eventBus = new EventBus()

// Toast 辅助函数
export function showToast(message, type = 'info') {
  eventBus.emit('show-toast', { message, type })
}

/**
 * API 请求函数
 * 
 * 当前为纯前端版本，直接调用相对路径
 * 接入后端时，请在 config/api.js 中配置 BASE_URL
 * 
 * @param {string} url - API 路径（如 '/api/gallery'）
 * @param {object} options - fetch 配置选项
 * @returns {Promise} 返回 JSON 数据
 */
export async function apiRequest(url, options = {}) {
  // 框架级选项（不传给 fetch）：
  // - showError: 失败时是否自动 toast（默认 true）
  // - unwrap: 响应为 envelope { code, message, data } 时是否自动拆包返回 data（默认 true）
  // - auth: 保留给调用方语义标注（公开接口传 false），会随 fetch 配置透传（无害），当前凭证由 cookie 携带
  const { showError = true, unwrap = true, ...fetchOptions } = options

  const defaultOptions = {
    headers: { ...DEFAULT_HEADERS },
    credentials: WITH_CREDENTIALS ? 'include' : 'same-origin'
  }

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    defaultOptions.headers['Content-Type'] = 'application/json'
  }

  // 转换 URL，添加基础地址（如果配置了）
  const fullUrl = getApiUrl(url)

  let response
  let json = null
  try {
    response = await fetch(fullUrl, { ...defaultOptions, ...fetchOptions })
    json = await response.json().catch(() => null)
  } catch (error) {
    if (showError) showToast(error.message || '网络请求失败', 'error')
    throw error
  }

  if (!response.ok) {
    // 后端错误统一取 envelope 的 message（兼容旧的 error 字段）
    const message = json?.message || json?.error || '请求失败'
    const error = new Error(message)
    error.displayMessage = message
    error.status = response.status
    if (showError) showToast(message, 'error')
    throw error
  }

  // envelope 拆包：{ code, message, data } -> data
  if (unwrap && json && typeof json === 'object' && 'code' in json && 'data' in json) {
    return json.data
  }
  return json
}

/**
 * 下载受保护/静态文件
 * @param {string} path - 文件路径或完整 URL
 * @param {string} filename - 保存文件名
 */
export async function downloadFile(path, filename = 'download') {
  try {
    const response = await fetch(getAssetUrl(path), {
      headers: { ...getAuthHeaders() },
      credentials: WITH_CREDENTIALS ? 'include' : 'same-origin'
    })
    if (!response.ok) {
      throw new Error('文件下载失败')
    }
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    showToast(error.message, 'error')
    throw error
  }
}
