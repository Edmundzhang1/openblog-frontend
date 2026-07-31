import { apiRequest } from '@/utils/eventBus.js'

/**
 * 画师空间相关 API
 * 基于本地 apiRequest 封装，返回完整响应 envelope（{ code, message, data }），
 * 调用方通过 res.data 读取数据
 */
const request = (url, options = {}) =>
  apiRequest(url, { unwrap: false, showError: false, ...options })

// ==================== 作品管理 API ====================

/**
 * 获取画师公开作品列表
 * @param {string} slug - 画师 slug
 */
export async function getPublicWorksAPI(slug) {
  return await request(`/api/v1/space/${slug}/works`)
}

/**
 * 获取当前画师的作品列表（需登录）
 */
export async function getMyWorksAPI() {
  return await request('/api/v1/user/works')
}

/**
 * 创建作品（需登录）
 * @param {Object} data - { title, image_url, category, sort_order }
 */
export async function createWorkAPI(data) {
  return await request('/api/v1/user/works', { method: 'POST', body: data })
}

/**
 * 更新作品（需登录）
 * @param {number} id - 作品ID
 * @param {Object} data - 更新数据
 */
export async function updateWorkAPI(id, data) {
  return await request(`/api/v1/user/works/${id}`, { method: 'PUT', body: data })
}

/**
 * 删除作品（需登录）
 * @param {number} id - 作品ID
 */
export async function deleteWorkAPI(id) {
  return await request(`/api/v1/user/works/${id}`, { method: 'DELETE' })
}

/**
 * 切换作品显示状态（需登录）
 * @param {number} id - 作品ID
 */
export async function toggleWorkStatusAPI(id) {
  return await request(`/api/v1/user/works/${id}/status`, { method: 'PATCH' })
}

// ==================== 关于页面 API ====================

/**
 * 获取画师公开关于页面
 * @param {string} slug - 画师 slug
 */
export async function getPublicAboutAPI(slug) {
  return await request(`/api/v1/space/${slug}/about`)
}

/**
 * 获取当前画师的关于页面（需登录）
 */
export async function getMyAboutAPI() {
  return await request('/api/v1/user/about')
}

/**
 * 更新关于页面（需登录）
 * @param {Object} data - { history[], philosophy[], team[], services[], process[] }
 */
export async function updateMyAboutAPI(data) {
  return await request('/api/v1/user/about', { method: 'PUT', body: data })
}

// ==================== 联系方式 API ====================

/**
 * 获取画师公开联系方式
 * @param {string} slug - 画师 slug
 */
export async function getPublicContactAPI(slug) {
  return await request(`/api/v1/space/${slug}/contact`)
}

/**
 * 获取当前画师的联系方式（需登录）
 */
export async function getMyContactAPI() {
  return await request('/api/v1/user/contact')
}

/**
 * 更新联系方式（需登录）
 * @param {Object} data - { qq, wechat, email, xiaohongshu, bilibili, twitter, weibo, website, faq[] }
 */
export async function updateMyContactAPI(data) {
  return await request('/api/v1/user/contact', { method: 'PUT', body: data })
}

// ==================== 动态 API ====================

/**
 * 获取画师公开动态列表
 * @param {string} slug - 画师 slug
 */
export async function getPublicMomentsAPI(slug) {
  return await request(`/api/v1/space/${slug}/moments`)
}

/**
 * 获取当前画师的动态列表（需登录）
 */
export async function getMyMomentsAPI() {
  return await request('/api/v1/user/moments')
}

/**
 * 创建动态（需登录）
 * @param {Object} data - { content, images[], visibility }
 */
export async function createMomentAPI(data) {
  return await request('/api/v1/user/moments', { method: 'POST', body: data })
}

/**
 * 更新动态（需登录）
 * @param {number} id - 动态ID
 * @param {Object} data - { content, images[], visibility }
 */
export async function updateMomentAPI(id, data) {
  return await request(`/api/v1/user/moments/${id}`, { method: 'PUT', body: data })
}

/**
 * 删除动态（需登录）
 * @param {number} id - 动态ID
 */
export async function deleteMomentAPI(id) {
  return await request(`/api/v1/user/moments/${id}`, { method: 'DELETE' })
}
