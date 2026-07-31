import { apiRequest } from '@/utils/eventBus.js'

/**
 * 日历排期相关 API
 * 基于本地 apiRequest 封装，返回完整响应 envelope（{ code, message, data }），
 * 调用方通过 res.data 读取数据
 */
const request = (url, options = {}) =>
  apiRequest(url, { unwrap: false, showError: false, ...options })

/**
 * 获取日历事件
 * GET /api/v1/calendar?year=2024&month=3
 */
export async function getSchedulesAPI(year, month) {
  return await request(`/api/v1/calendar?year=${year}&month=${month}`)
}

/**
 * 创建日历事件
 * POST /api/v1/calendar
 */
export async function createScheduleAPI(data) {
  return await request('/api/v1/calendar', { method: 'POST', body: data })
}

/**
 * 更新日历事件
 */
export async function updateScheduleAPI(id, data) {
  return await request(`/api/v1/calendar/${id}`, { method: 'PUT', body: data })
}

/**
 * 删除日历事件
 */
export async function deleteScheduleAPI(id) {
  return await request(`/api/v1/calendar/${id}`, { method: 'DELETE' })
}

/**
 * 获取画师公开日历排期
 * GET /api/v1/space/:slug/schedules?year=2024&month=3
 */
export async function getPublicSchedulesAPI(slug, year, month) {
  return await request(`/api/v1/space/${slug}/schedules?year=${year}&month=${month}`)
}
