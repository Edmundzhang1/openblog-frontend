import { getApiUrl, DEFAULT_HEADERS, WITH_CREDENTIALS } from '@/config/api.js'

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
  const defaultOptions = {
    headers: { ...DEFAULT_HEADERS },
    credentials: WITH_CREDENTIALS ? 'include' : 'same-origin'
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    defaultOptions.headers['Content-Type'] = 'application/json'
  }
  
  // 转换 URL，添加基础地址（如果配置了）
  const fullUrl = getApiUrl(url)
  
  try {
    const response = await fetch(fullUrl, { ...defaultOptions, ...options })
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || '请求失败')
    }
    
    return data
  } catch (error) {
    showToast(error.message, 'error')
    throw error
  }
}
