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
  return true
}

export function getCurrentUser() {
  return sanitizeUser(readJSON(STORAGE_KEYS.USER, null))
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN) && getCurrentUser())
}

export function isAdmin(user = getCurrentUser()) {
  return user?.role === 'admin'
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

export function getPostLoginRoute(user, fallback = '/todo') {
  return isAdmin(user) ? '/admin' : fallback
}
