const STORAGE_KEYS = {
  TOKEN: 'furest-token',
  USER: 'furest-user',
  USERS: 'furest-users'
}

export const AUTH_CHANGED_EVENT = 'furest-auth-changed'

const DEMO_USERS = [
  {
    id: 'demo-user',
    username: 'user',
    password: 'user123',
    email: 'user@furest.local',
    role: 'user',
    createdAt: '2026-03-16T10:00:00.000Z'
  },
  {
    id: 'demo-admin',
    username: 'admin',
    password: 'furest123',
    email: 'admin@furest.local',
    role: 'admin',
    createdAt: '2026-03-16T10:05:00.000Z'
  }
]

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

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeUsername(value) {
  return normalizeText(value).toLowerCase()
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

function persistUsers(users) {
  writeJSON(STORAGE_KEYS.USERS, users)
}

function ensureDemoUsers() {
  const storedUsers = readJSON(STORAGE_KEYS.USERS, [])
  const mergedUsers = Array.isArray(storedUsers) ? [...storedUsers] : []
  let updated = false

  DEMO_USERS.forEach((demoUser) => {
    const existingIndex = mergedUsers.findIndex(
      (user) => normalizeUsername(user.username) === normalizeUsername(demoUser.username)
    )

    if (existingIndex === -1) {
      mergedUsers.push(demoUser)
      updated = true
      return
    }

    const existingUser = mergedUsers[existingIndex]
    const shouldReplace =
      existingUser.password !== demoUser.password ||
      existingUser.role !== demoUser.role ||
      existingUser.email !== demoUser.email

    if (shouldReplace) {
      mergedUsers.splice(existingIndex, 1, {
        ...existingUser,
        ...demoUser,
        createdAt: existingUser.createdAt || demoUser.createdAt
      })
      updated = true
    }
  })

  if (updated || !Array.isArray(storedUsers)) {
    persistUsers(mergedUsers)
  }

  return mergedUsers
}

function saveSession(user) {
  const safeUser = sanitizeUser(user)
  localStorage.setItem(STORAGE_KEYS.TOKEN, `furest-${user.role}-${Date.now()}`)
  writeJSON(STORAGE_KEYS.USER, safeUser)
  emitAuthChanged()
  return safeUser
}

export function getAllUsers() {
  return ensureDemoUsers()
    .map(sanitizeUser)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
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

export function loginLocal({ username, password }) {
  const normalizedUsername = normalizeUsername(username)
  const normalizedPassword = String(password || '')
  const matchedUser = ensureDemoUsers().find(
    (user) =>
      normalizeUsername(user.username) === normalizedUsername &&
      String(user.password || '') === normalizedPassword
  )

  if (!matchedUser) {
    return { ok: false, error: 'INVALID_CREDENTIALS' }
  }

  return { ok: true, user: saveSession(matchedUser) }
}

export function registerLocalUser({ username, password, email }) {
  const normalizedUsername = normalizeUsername(username)
  const normalizedEmail = normalizeText(email).toLowerCase()
  const users = ensureDemoUsers()

  const exists = users.some((user) => {
    const sameUsername = normalizeUsername(user.username) === normalizedUsername
    const sameEmail = normalizedEmail && String(user.email || '').toLowerCase() === normalizedEmail
    return sameUsername || sameEmail
  })

  if (exists) {
    return { ok: false, error: 'ACCOUNT_EXISTS' }
  }

  const newUser = {
    id: `user-${Date.now()}`,
    username: normalizeText(username),
    password: String(password || ''),
    email: normalizeText(email),
    role: 'user',
    createdAt: new Date().toISOString()
  }

  persistUsers([...users, newUser])
  return { ok: true, user: sanitizeUser(newUser) }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  emitAuthChanged()
}

export function getPostLoginRoute(user, fallback = '/todo') {
  return isAdmin(user) ? '/admin' : fallback
}
