import { getApiUrl, getAssetUrl, getAuthHeaders, DEFAULT_HEADERS, WITH_CREDENTIALS, API_ENDPOINTS } from '@/config/api.js'
import { getRefreshToken, refreshSession } from './auth.js'

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
  // - auth: 是否携带 Authorization 头（默认 true；公开接口传 false）
  const { showError = true, unwrap = true, auth = true, ...fetchOptions } = options

  const defaultOptions = {
    headers: auth ? { ...getAuthHeaders() } : { ...DEFAULT_HEADERS },
    credentials: WITH_CREDENTIALS ? 'include' : 'same-origin'
  }

  if (fetchOptions.body instanceof FormData) {
    // multipart 请求由浏览器自动生成带 boundary 的 Content-Type，不能沿用默认的 json 头
    delete defaultOptions.headers['Content-Type']
  } else if (fetchOptions.body) {
    defaultOptions.headers['Content-Type'] = 'application/json'
    // 允许调用方直接传对象/数组，这里统一序列化；已序列化的字符串原样透传
    if (typeof fetchOptions.body !== 'string') {
      fetchOptions.body = JSON.stringify(fetchOptions.body)
    }
  }

  // 转换 URL，添加基础地址（如果配置了）
  const fullUrl = getApiUrl(url)

  // 实际发起请求；抽成闭包以便 401 刷新成功后用新 token 重试一次
  const sendRequest = async () => {
    const response = await fetch(fullUrl, { ...defaultOptions, ...fetchOptions })
    const json = await response.json().catch(() => null)
    return { response, json }
  }

  let response
  let json = null
  try {
    ({ response, json } = await sendRequest())
  } catch (error) {
    if (showError) showToast(error.message || '网络请求失败', 'error')
    throw error
  }

  // 401 滑动续期：先静默刷新 token（不 toast），成功则用新 token 重试一次原请求。
  // 每个 apiRequest 调用最多重试一次（无递归，天然不会重复重试）；
  // 刷新接口自身、无 refresh token、或调用方显式 auth:false 时不进入此逻辑。
  if (response.status === 401 && auth && url !== API_ENDPOINTS.AUTH_REFRESH && getRefreshToken()) {
    try {
      await refreshSession()
    } catch (refreshError) {
      // 刷新失败意味着会话已被清空，跳转登录页并带上回跳地址（登录页本身不跳，避免循环）
      if (!window.location.pathname.startsWith('/login')) {
        const redirect = window.location.pathname + window.location.search + window.location.hash
        window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
      }
      const message = refreshError.message || '登录已过期，请重新登录'
      const error = new Error(message)
      error.displayMessage = message
      error.status = 401
      if (showError) showToast(message, 'error')
      throw error
    }
    // 换用新 token 的请求头重试；重试仍失败则落入下面统一的错误处理（此时才 toast）
    defaultOptions.headers = { ...getAuthHeaders() }
    if (fetchOptions.body instanceof FormData) {
      delete defaultOptions.headers['Content-Type']
    }
    try {
      ({ response, json } = await sendRequest())
    } catch (error) {
      if (showError) showToast(error.message || '网络请求失败', 'error')
      throw error
    }
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
