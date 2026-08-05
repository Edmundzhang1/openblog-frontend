/**
 * FUREST API 配置文件 (V1 版本)
 * 
 * 根据产品文档定义的新接口规范
 * 基础路径: /api/v1
 */

// API 基础地址配置
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// API 版本
export const API_VERSION = '/api/v1'

// 完整的 API 地址生成
export function getApiUrl(path) {
  if (path.startsWith('http')) {
    return path
  }
  // 如果路径不以 /api 开头，添加版本前缀
  if (!path.startsWith('/api')) {
    return `${BASE_URL}${API_VERSION}${path}`
  }
  return `${BASE_URL}${path}`
}

// 静态资源地址生成（上传文件、头像等，不添加 API 版本前缀）
export function getAssetUrl(path) {
  if (!path) return ''
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// ============================================
// API 端点列表 (根据产品文档 V1)
// ============================================

export const API_ENDPOINTS = {
  // ---------------- 游客委托相关 ----------------
  // POST - 游客提交委托（免注册）
  // Body: { client_name, contact_type, contact_value, style, description, budget, schedule_date, reference_files?, agreed_terms }
  GUEST_COMMISSION: '/guest/commissions',
  
  // ---------------- 认证相关 ----------------
  // POST - 发送邮箱验证码
  AUTH_SEND_CODE: '/auth/email/send-code',
  
  // POST - 验证码登录/注册一体
  AUTH_LOGIN_REGISTER: '/auth/register-or-login',

  // POST - 邮箱密码登录
  AUTH_PASSWORD_LOGIN: '/auth/login/password',
  
  // POST - 绑定QQ号
  AUTH_BIND_QQ: '/auth/bind-qq',
  
  // POST - 刷新Token
  AUTH_REFRESH: '/auth/refresh',
  
  // POST - 退出登录
  AUTH_LOGOUT: '/auth/logout',
  
  // ---------------- 用户相关 ----------------
  // GET - 获取当前用户信息
  ME: '/me',
  
  // PUT - 更新用户信息
  ME_UPDATE: '/me',

  // GET - 画师工作台主页资料（读走 /me；基本字段 PUT 走 ME_UPDATE）
  ME_ARTIST_PROFILE: '/me',

  // PUT - 画师主页资料（ARTIST/ADMIN）
  // Body 可含 artist_tags / price_range_min（分）/ price_range_max（分）/ commission_rules / commission_open，只更新传入字段
  ME_ARTIST_PROFILE_UPDATE: '/me/artist-profile',

  // POST - 设置/修改密码（Body: { password }，后端不校验旧密码）
  ME_PASSWORD: '/me/password',

  // DELETE - 注销（软删除）当前账号，无请求体
  ME_DELETE: '/me',
  
  // GET - 我的委托列表
  MY_ORDERS: '/me/orders',

  // ---------------- 用户主页（空间）相关 ----------------
  // GET - 任意用户的主页信息（公开，slug 默认=uid）
  SPACE_INFO: (slug) => `/space/${slug}`,

  // GET - 用户主页 DIY 配置（公开，JSON 对象，可能为 {}）
  SPACE_PAGE_CONFIG: (slug) => `/space/${slug}/page-config`,

  // ---------------- 画师名录相关 ----------------
  // GET - 画师列表（公开，分页 page/page_size）
  ARTISTS: '/artists',

  // GET - 画师详情（公开）
  ARTIST_DETAIL: (uid) => `/artists/${uid}`,

  // POST - 提交委托（登录用户）
  COMMISSIONS: '/commissions',
  
  // ---------------- 订单相关 ----------------
  // GET - 订单详情（游客和注册用户均可通过订单号查询）
  ORDER_DETAIL: (id) => `/orders/${id}`,
  
  // PATCH - 画师更新订单状态
  // Body: { status, remark? }
  ORDER_UPDATE_STATUS: (id) => `/orders/${id}/status`,
  
  // PATCH - 更新支付记录
  // Body: { pay_amount, payment_method?, transaction_id? }
  ORDER_UPDATE_PAYMENT: (id) => `/orders/${id}/payment`,

  // GET/POST - 订单交付物
  ORDER_DELIVERABLES: (id) => `/orders/${id}/deliverables`,

  // PATCH - 交付物确认/驳回
  // Body: { status }
  DELIVERABLE_STATUS: (id) => `/deliverables/${id}/status`,
  
  // ---------------- 聊天相关 ----------------
  // GET - 获取会话列表
  CHAT_THREADS: '/chat/threads',
  
  // POST - 创建会话线程
  // Body: { order_id?, participant_id }
  CHAT_CREATE_THREAD: '/chat/threads',
  
  // GET - 获取会话消息（按 thread_id 查询参数过滤）
  CHAT_MESSAGES: '/chat/messages',
  
  // POST - 发送消息
  // Body: { thread_id, content, type, attachments? }
  CHAT_SEND_MESSAGE: '/chat/messages',

  // POST - 标记会话已读
  CHAT_READ: '/chat/read',
  
  // WebSocket 连接地址
  WS_URL: '/ws',
  WS: '/ws',
  
  // ---------------- 上传相关 ----------------
  // POST - 上传文件（FormData，字段名 file）
  UPLOAD: '/upload',

  // ---------------- 站点配置相关 ----------------
  // GET - 读取站点首页配置（公开）
  // Response: { site_name, logo, banner_images, theme_color, sections, social_links, commission_types }
  SITE_HOME: '/site/home',
  
  // GET - 获取当前站点配置
  SITE_CONFIG: '/site/config',

  // GET - 公开作品画廊（分页 page/page_size，可按 category 过滤）
  GALLERY: '/gallery',

  // GET - 平台主题预设（公开，仅启用中的）
  THEME_PRESETS: '/theme-presets',
  
  // ---------------- 画师后台相关 ----------------
  // PATCH - 更新DIY配置（需画师权限）
  ARTIST_UPDATE_CONFIG: '/artist/site-config',
  
  // GET - 获取排期
  ARTIST_SCHEDULE: '/artist/schedule',
  
  // POST - 更新排期
  ARTIST_UPDATE_SCHEDULE: '/artist/schedule',
  
  // ---------------- 作品展示相关 ----------------
  // GET - 获取作品列表
  PORTFOLIO: '/portfolio',
  
  // POST - 添加作品
  PORTFOLIO_CREATE: '/portfolio',
  
  // DELETE - 删除作品
  PORTFOLIO_DELETE: (id) => `/portfolio/${id}`,
  
  // ---------------- 博客/动态相关 ----------------
  // GET - 获取文章列表
  BLOG_POSTS: '/blog/posts',
  
  // GET - 获取单篇文章
  BLOG_POST: (id) => `/blog/posts/${id}`,
  
  // POST - 创建文章（需画师权限）
  BLOG_CREATE: '/blog/posts',
  
  // PUT - 更新文章
  BLOG_UPDATE: (id) => `/blog/posts/${id}`,
  
  // DELETE - 删除文章
  BLOG_DELETE: (id) => `/blog/posts/${id}`,
  
  // ---------------- 通知相关 ----------------
  // GET - 获取通知列表
  NOTIFICATIONS: '/me/notifications',

  // GET - 未读通知数
  NOTIFICATIONS_UNREAD: '/me/notifications/unread-count',
  
  // PATCH - 标记通知已读
  NOTIFICATION_READ: (id) => `/me/notifications/${id}/read`,
  
  // PATCH - 标记所有已读
  NOTIFICATION_READ_ALL: '/me/notifications/read-all',
  
  // ---------------- 管理后台接口 ----------------
  // 平台总览指标
  ADMIN_STATS: '/admin/stats',

  // 站点配置（管理员视角，GET/PATCH）
  ADMIN_SITE_CONFIG: '/admin/site-config',

  // 用户管理（GET 分页+搜索 keyword）
  ADMIN_USERS: '/admin/users',
  ADMIN_USER: (id) => `/admin/users/${id}`,

  // PATCH - 修改用户角色
  // Body: { role }
  ADMIN_USER_ROLE: (uid) => `/admin/users/${uid}/role`,

  // PATCH - 修改用户主页路径 slug
  // Body: { slug }，格式 ^[a-z0-9_-]{2,50}$
  ADMIN_USER_SLUG: (uid) => `/admin/users/${uid}/slug`,

  // PATCH - 设置画师是否在名录中展示
  // Body: { directory_visible }
  ADMIN_USER_DIRECTORY: (uid) => `/admin/users/${uid}/directory`,

  // GET - 平台作品库（分页 page/page_size）
  // POST - 新增平台作品 Body: { image_url, intro, sort_order? }
  ADMIN_WORKS: '/admin/works',

  // DELETE - 删除平台作品
  ADMIN_WORK: (id) => `/admin/works/${id}`,

  // 主题预设管理（GET 全部含停用 / POST 新建）
  // Body: { name, primary_color, primary_dark, secondary_color, accent_color, bg_light, is_active, sort_order }
  ADMIN_THEME_PRESETS: '/admin/theme-presets',

  // PUT/DELETE - 单个主题预设
  ADMIN_THEME_PRESET: (id) => `/admin/theme-presets/${id}`,

  // 黑名单管理
  ADMIN_BLACKLIST: '/admin/blacklist',
  ADMIN_BLACKLIST_ITEM: (id) => `/admin/blacklist/${id}`,

  // 画师入驻审批
  ADMIN_ARTIST_APPLICATIONS: '/admin/artist-applications',
  ADMIN_ARTIST_APPLICATION: (uid) => `/admin/artist-applications/${uid}`,
  
  // 订单管理
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER: (id) => `/admin/orders/${id}`,
  
  // 内容管理
  ADMIN_CONTENT: '/admin/content',
  
  // 风控审计
  ADMIN_RISK: '/admin/risk',
  ADMIN_AUDIT_LOGS: '/admin/events'
}

// ============================================
// 枚举类型定义 (根据产品文档)
// ============================================

export const UserRole = {
  CLIENT: 'CLIENT',      // 委托人
  ARTIST: 'ARTIST',      // 画师/装师
  ADMIN: 'ADMIN'         // 平台管理员
}

export const ArtistType = {
  ILLUSTRATOR: 'ILLUSTRATOR',  // 画师
  DESIGNER: 'DESIGNER'         // 装师
}

export const OrderStatus = {
  SUBMITTED: 'SUBMITTED',           // 已提交
  QUOTED: 'QUOTED',                 // 已报价
  CONFIRMED: 'CONFIRMED',           // 已确认
  IN_PROGRESS: 'IN_PROGRESS',       // 绘制中
  DRAFT_DELIVERED: 'DRAFT_DELIVERED',   // 草稿已交付
  FINAL_DELIVERED: 'FINAL_DELIVERED',   // 成稿已交付
  COMPLETED: 'COMPLETED',           // 已完成
  CANCELLED: 'CANCELLED'            // 已取消
}

export const PaymentMode = {
  PREPAID: 'PREPAID',     // 先付
  POSTPAID: 'POSTPAID',   // 后付
  STAGED: 'STAGED'        // 分期
}

export const PaymentStatus = {
  UNPAID: 'UNPAID',       // 未支付
  PARTIAL: 'PARTIAL',     // 部分支付
  PAID: 'PAID'            // 已付清
}

export const MessageType = {
  TEXT: 'TEXT',           // 文本
  FILE: 'FILE',           // 文件
  IMAGE: 'IMAGE',         // 图片
  SYSTEM: 'SYSTEM'        // 系统消息
}

// ============================================
// 请求配置
// ============================================

export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

// 获取带认证的请求头（无 token 时不附带空 Authorization）
export function getAuthHeaders() {
  const token = localStorage.getItem('furest-token')
  const headers = { ...DEFAULT_HEADERS }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// 是否需要携带凭证（cookie）
export const WITH_CREDENTIALS = true
