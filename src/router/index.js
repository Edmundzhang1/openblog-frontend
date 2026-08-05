import { createRouter, createWebHistory } from 'vue-router'
// 首屏关键页面保持静态导入，其余路由级代码分包（动态 import）
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import { getCurrentUser, getPostLoginRoute, isAdmin, isArtist, isAuthenticated } from '../utils/auth'
import { applyRouteTheme } from '../utils/personalization.js'

// ==================== 布局组件（v2） ====================
import SpaceLayout from '../views/Space.vue'  // 画师空间布局壳子（/@slug 的壳，保持静态）

// ==================== 路由配置 ====================
const routes = [
  // ============================================================
  // 【全局态】平台级路由 - 无 slug，独立布局
  // ============================================================

  // 平台首页（本地功能线）
  {
    path: '/',
    name: 'Home',
    component: Home
  },

  // 认证相关
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true, hideNavBar: true }
  },

  {
    // 约稿功能收拢到画师主页使用，旧链接重定向到画师名录
    path: '/commission',
    redirect: '/artists'
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('../views/Gallery.vue')
  },
  {
    path: '/artists',
    name: 'Artists',
    component: () => import('../views/Artists.vue')
  },
  {
    path: '/artists/:uid',
    name: 'ArtistHome',
    // 旧链接兼容：已迁移到 /@slug 全用户主页，路由级重定向
    redirect: to => '/@' + to.params.uid
  },
  {
    path: '/studio',
    name: 'ArtistStudio',
    component: () => import('../views/ArtistStudio.vue'),
    meta: { requiresAuth: true, requiresArtist: true }
  },
  {
    path: '/apply-artist',
    name: 'ArtistApply',
    component: () => import('../views/ArtistApply.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('../views/Blog.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Contact.vue')
  },

  // ----------------------------------------------------------
  // 【全局私有资产】用户个人中心相关 - 顶级路由，不在 SpaceLayout 内
  // ----------------------------------------------------------
  {
    path: '/orders',           // 订单查询（游客可凭订单号查询，登录用户额外展示我的订单列表）
    name: 'OrderTracking',
    component: () => import('../views/OrderTracking.vue')
  },
  {
    path: '/chat',             // 消息中心
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/todo',             // 排期/日程管理（画师专属，与后端权限一致）
    name: 'TodoList',
    component: () => import('../views/TodoList.vue'),
    meta: { requiresAuth: true, requiresArtist: true }
  },
  {
    path: '/admin/space',      // 空间管理后台
    name: 'SpaceAdmin',
    component: () => import('../views/SpaceAdmin.vue'),
    meta: { requiresAuth: true, role: 'ARTIST' }
  },
  {
    path: '/profile',          // 个人资料
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/Notifications.vue'),
    meta: { requiresAuth: true }
  },

  // 管理后台
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // ============================================================
  // 【空间态】画师个人空间 - 嵌套路由，必须使用 SpaceLayout（v2）
  // ============================================================
  {
    path: '/@:slug',
    component: SpaceLayout,   // 空间布局壳子（只渲染router-view）
    props: true,
    children: [
      // 默认重定向到空间首页
      {
        path: '',
        redirect: to => ({ path: `/@${to.params.slug}/home` })
      },
      // 空间首页（画师Home）- 必须在Space children内！
      {
        path: 'home',
        name: 'SpaceHome',
        component: () => import('../views/space/SpaceHome.vue'),
        meta: { requiresAuth: false }
      },
      // 约稿页面
      {
        path: 'commission',
        name: 'SpaceCommission',
        component: () => import('../views/space/SpaceCommission.vue'),
        meta: { requiresAuth: false, actionRequiresAuth: true }
      },
      // 作品画廊
      {
        path: 'gallery',
        name: 'SpaceGallery',
        component: () => import('../views/space/SpaceGallery.vue'),
        meta: { requiresAuth: false }
      },
      // 画师博客
      {
        path: 'blog',
        name: 'SpaceBlog',
        component: () => import('../views/space/SpaceBlog.vue'),
        meta: { requiresAuth: false }
      },
      // 关于画师
      {
        path: 'about',
        name: 'SpaceAbout',
        component: () => import('../views/space/SpaceAbout.vue'),
        meta: { requiresAuth: false }
      },
      // 联系画师
      {
        path: 'contact',
        name: 'SpaceContact',
        component: () => import('../views/space/SpaceContact.vue'),
        meta: { requiresAuth: false }
      },
      // 画师名录（空间内浏览，路由带 slug，navbar 保持空间模式不跳变）
      {
        path: 'artists',
        name: 'SpaceArtists',
        component: () => import('../views/Artists.vue'),
        meta: { requiresAuth: false }
      },
      // 个性化装修 - 仅空间主人可访问
      {
        path: 'personalization',
        name: 'SpacePersonalization',
        component: () => import('../views/Personalization.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: '<div style="text-align:center; padding: 50px; font-size: 20px;">🚨 404：你访问的页面不存在或者路径拼错啦！</div>'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// ==================== 全局路由守卫 ====================
router.beforeEach((to, from, next) => {
  const currentUser = getCurrentUser()
  const loggedIn = isAuthenticated()

  // 0. 画师空间公开页面直接放行（如 /@slug/home、/@slug/gallery 等）
  if (to.path.startsWith('/@') && !to.meta.requiresAuth) {
    next()
    return
  }

  // 1. 登录页且已登录 -> 重定向
  if (to.name === 'Login' && loggedIn) {
    next(getPostLoginRoute(currentUser, '/orders'))
    return
  }

  // 2. 仅限游客访问的页面，已登录用户重定向
  if (to.meta.guestOnly && loggedIn) {
    next(getPostLoginRoute(currentUser, '/orders'))
    return
  }

  // 3. 需要登录的页面
  if (to.meta.requiresAuth && !loggedIn) {
    next('/login?redirect=' + encodeURIComponent(to.fullPath))
    return
  }

  // 4. 需要管理员权限
  if (to.meta.requiresAdmin && !isAdmin(currentUser)) {
    next(getPostLoginRoute(currentUser, '/orders'))
    return
  }

  // 5. 需要画师权限（管理员代为维护时放行）
  if (to.meta.requiresArtist && !isArtist(currentUser) && !isAdmin(currentUser)) {
    next('/orders')
    return
  }

  // 6. 角色专属页面检查
  if (to.meta.role && loggedIn) {
    const userRole = currentUser?.role?.toUpperCase?.()
    const requiredRole = to.meta.role.toUpperCase()
    if (userRole !== requiredRole && userRole !== 'ADMIN') {
      next(getPostLoginRoute(currentUser, '/orders'))
      return
    }
  }

  next()
})

// ==================== 路由级主题同步 ====================
// 导航确认后执行（afterEach 不会在重定向中途触发）：
// 离开空间路由时清除空间/装修预览残留的行内主题变量与 body 背景，恢复平台主题；
// 进入空间路由时为无操作（空间配色由 Space.vue 的查看态逻辑负责）。
// isSpaceRoute 判定与 Navbar 保持一致：params.slug 为非空字符串
router.afterEach((to) => {
  const isSpaceRoute = typeof to.params?.slug === 'string' && to.params.slug.length > 0
  applyRouteTheme(isSpaceRoute)
})

export default router
