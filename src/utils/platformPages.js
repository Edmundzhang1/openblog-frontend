/**
 * 平台页面内容（动态/关于/联系）公开读取工具
 *
 * 数据来自 GET /site/home 的 platform_pages 字段：
 * { platform_blog?, platform_about?, platform_contact? }（未配置时对应键缺省）
 *
 * - 缓存首次请求的 Promise，多个页面组件共享同一次请求
 * - 静默失败返回 null，调用方回退到内置硬编码内容
 */
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from './eventBus'

let platformPagesPromise = null

/**
 * 获取平台页面内容
 * @returns {Promise<object|null>} platform_pages 对象或 null
 */
export function fetchPlatformPages() {
  if (!platformPagesPromise) {
    platformPagesPromise = apiRequest(API_ENDPOINTS.SITE_HOME, { auth: false, showError: false })
      .then((data) => (data && typeof data.platform_pages === 'object' ? data.platform_pages : null))
      .catch(() => null)
  }
  return platformPagesPromise
}
