import { apiRequest } from '@/utils/eventBus.js'

/**
 * 排单/工作量相关 API
 * 基于本地 apiRequest 封装，返回完整响应 envelope（{ code, message, data }），
 * 调用方通过 res.data 读取数据
 */
const request = (url, options = {}) =>
  apiRequest(url, { unwrap: false, showError: false, ...options })

// ==================== 工作量配置 ====================
export async function getWorkloadAPI() {
  return await request('/api/v1/todo/workload')
}

export async function updateWorkloadAPI(maxWorkload, extraConfig = {}) {
  return await request('/api/v1/todo/workload', {
    method: 'PUT',
    body: {
      max_workload: maxWorkload,
      ...extraConfig
    }
  })
}

// ==================== 画风类型 ====================
export async function getArtStylesAPI() {
  return await request('/api/v1/todo/styles')
}

export async function createArtStyleAPI(data) {
  return await request('/api/v1/todo/styles', { method: 'POST', body: data })
}

export async function updateArtStyleAPI(id, data) {
  return await request(`/api/v1/todo/styles/${id}`, { method: 'PUT', body: data })
}

export async function deleteArtStyleAPI(id) {
  return await request(`/api/v1/todo/styles/${id}`, { method: 'DELETE' })
}

// ==================== 每日留言 ====================
export async function getDailyNoteAPI(date) {
  return await request(`/api/v1/todo/notes?date=${encodeURIComponent(date)}`)
}

export async function saveDailyNoteAPI(date, content) {
  return await request('/api/v1/todo/notes', { method: 'PUT', body: { date, content } })
}

// ==================== 公开API（访客可见）====================
export async function getPublicWorkloadAPI(slug) {
  return await request(`/api/v1/space/${slug}/workload`)
}

export async function getPublicArtStylesAPI(slug) {
  return await request(`/api/v1/space/${slug}/styles`)
}

export async function getPublicMonthNotesAPI(slug, year, month) {
  return await request(`/api/v1/space/${slug}/notes?year=${year}&month=${month}`)
}

export async function getPublicDailyNoteAPI(artistId, date) {
  return await request(`/api/v1/public/notes?artist_id=${encodeURIComponent(artistId)}&date=${encodeURIComponent(date)}`)
}
