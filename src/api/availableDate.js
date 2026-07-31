import { apiRequest } from '@/utils/eventBus.js'

/**
 * 可预约日期相关 API
 * 基于本地 apiRequest 封装，返回完整响应 envelope（{ code, message, data }），
 * 调用方通过 res.data 读取数据
 */
const request = (url, options = {}) =>
  apiRequest(url, { unwrap: false, showError: false, ...options })

function buildQuery(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value)
    }
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

// ==================== 可预约日期管理 API（需要认证）====================

/**
 * 获取我的可预约日期列表
 * @param {number} year - 年份，可选
 * @param {number} month - 月份，可选
 */
export async function getMyAvailableDatesAPI(year, month) {
  return await request(`/api/v1/user/available-dates${buildQuery({ year, month })}`)
}

/**
 * 添加单个可预约日期
 * @param {string} date - 日期格式: 2025-04-01
 * @param {string} note - 备注，可选
 */
export async function addAvailableDateAPI(date, note = '') {
  return await request('/api/v1/user/available-dates', { method: 'POST', body: { date, note } })
}

/**
 * 批量添加可预约日期
 * @param {string[]} dates - 日期数组: ["2025-04-01", "2025-04-05"]
 * @param {string} note - 统一备注，可选
 */
export async function batchAddAvailableDatesAPI(dates, note = '') {
  return await request('/api/v1/user/available-dates/batch', { method: 'POST', body: { dates, note } })
}

/**
 * 更新可预约日期（标记已满/未满）
 * @param {string} date - 日期格式: 2025-04-01
 * @param {boolean} isFull - 是否已满
 * @param {string} note - 备注，可选
 */
export async function updateAvailableDateAPI(date, isFull, note) {
  const data = {}
  if (typeof isFull !== 'undefined') data.is_full = isFull
  if (typeof note !== 'undefined') data.note = note
  return await request(`/api/v1/user/available-dates/${date}`, { method: 'PUT', body: data })
}

/**
 * 删除可预约日期
 * @param {string} date - 日期格式: 2025-04-01
 */
export async function deleteAvailableDateAPI(date) {
  return await request(`/api/v1/user/available-dates/${date}`, { method: 'DELETE' })
}

// ==================== 公开 API（访客可见）====================

/**
 * 获取画师的可预约日期（公开）
 * @param {string} slug - 画师 slug
 * @param {number} year - 年份，可选
 * @param {number} month - 月份，可选
 */
export async function getPublicAvailableDatesAPI(slug, year, month) {
  return await request(`/api/v1/space/${slug}/available-dates${buildQuery({ year, month })}`)
}
