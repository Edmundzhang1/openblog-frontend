import { API_ENDPOINTS, DEFAULT_HEADERS, getApiUrl, WITH_CREDENTIALS } from '../config/api.js'

const STORAGE_KEYS = {
  TOKEN: 'furest-token',
  REFRESH_TOKEN: 'furest-refresh-token',
  USER: 'furest-user'
}

export const AUTH_CHANGED_EVENT = 'furest-auth-changed'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (error) {
    console.warn(`读取本地认证数据失败: ${key}`, error)
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safeUser } = user
  return safeUser
}

function emitAuthChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: getCurrentUser() }))
}

export function saveSession(data) {
  // 兼容两种入参：本地用户对象，或后端登录响应 { user, tokens, is_new_user }
  const user = data?.user && typeof data.user === 'object' ? data.user : data
  const tokens = data?.tokens
  const accessToken = tokens?.access_token || `furest-${user.role}-${Date.now()}`
  localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken)
  if (tokens?.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token)
  }
  const safeUser = sanitizeUser(user)
  writeJSON(STORAGE_KEYS.USER, safeUser)
  emitAuthChanged()
  return safeUser
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN) || ''
}

export function getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || ''
}

export function updateTokens(tokens) {
  if (!tokens || typeof tokens !== 'object' || !tokens.access_token) return false
  localStorage.setItem(STORAGE_KEYS.TOKEN, tokens.access_token)
  if (tokens.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token)
  }
  emitAuthChanged()
  return true
}

// ==================== 滑动续期（refresh token 轮换） ====================
// 模块级单飞 Promise：并发触发刷新时共享同一次请求，保证全局最多一个 refresh
// 请求在途。后端 refresh token 为一次性（jti 经 Redis SetNX 消费），并发刷新会互相失效。
let refreshingPromise = null

async function doRefreshSession() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('登录已过期，请重新登录')
  }
  // 必须绕开 apiRequest 直接使用 fetch，否则会递归进 401 刷新重试逻辑
  let json = null
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH_REFRESH), {
      method: 'POST',
      headers: { ...DEFAULT_HEADERS },
      credentials: WITH_CREDENTIALS ? 'include' : 'same-origin',
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    json = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(json?.message || json?.error || '登录状态刷新失败')
    }
    if (!json || json.code !== 0 || !updateTokens(json.data?.tokens)) {
      throw new Error(json?.message || '登录状态刷新失败')
    }
  } catch (error) {
    // 任何失败（网络错误 / 非 200 / envelope code != 0）都视为会话失效，清空本地会话
    clearSession()
    throw error
  }
  return json.data.tokens
}

export function refreshSession() {
  if (!refreshingPromise) {
    refreshingPromise = doRefreshSession().finally(() => {
      refreshingPromise = null
    })
  }
  return refreshingPromise
}

export function getCurrentUser() {
  return sanitizeUser(readJSON(STORAGE_KEYS.USER, null))
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN) && getCurrentUser())
}

export function isAdmin(user = getCurrentUser()) {
  return String(user?.role || '').toUpperCase() === 'ADMIN'
}

export function isArtist(user = getCurrentUser()) {
  return String(user?.role || '').toUpperCase() === 'ARTIST'
}

export function updateStoredUser(updates) {
  const current = getCurrentUser()
  if (!current || !updates || typeof updates !== 'object') return current
  const merged = sanitizeUser({ ...current, ...updates })
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged))
  emitAuthChanged()
  return merged
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  emitAuthChanged()
}

export function getPostLoginRoute(user, fallback = '/') {
  if (isAdmin(user)) return '/admin'
  // 登录后默认进入自己的空间主页（slug 默认等于 UID）
  if (user?.uid) return `/@${user.slug || user.uid}`
  return fallback
}
