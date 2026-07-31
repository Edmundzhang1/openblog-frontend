import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Commission from '../views/Commission.vue'
import Gallery from '../views/Gallery.vue'
import Artists from '../views/Artists.vue'
import ArtistHome from '../views/ArtistHome.vue'
import ArtistStudio from '../views/ArtistStudio.vue'
import ArtistApply from '../views/ArtistApply.vue'
import About from '../views/About.vue'
import Contact from '../views/Contact.vue'
import Login from '../views/Login.vue'
import OrderTracking from '../views/OrderTracking.vue'
import Blog from '../views/Blog.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import { getCurrentUser, getPostLoginRoute, isAdmin, isArtist, isAuthenticated } from '../utils/auth'

// ==================== 布局组件（v2） ====================
import SpaceLayout from '../views/Space.vue'  // 画师空间布局壳子

// ==================== 页面组件（v2） ====================
import UserDashboard from '../views/UserDashboard.vue' // 普通用户首页
import Profile from '../views/Profile.vue'
import Personalization from '../views/Personalization.vue' // 个性化装修

// ==================== 画师空间子页面（v2，空间态专属，挂载于 SpaceLayout 内）====================
import SpaceHome from '../views/space/SpaceHome.vue'         // 空间首页
import SpaceCommission from '../views/space/SpaceCommission.vue' // 空间约稿页
import SpaceGallery from '../views/space/SpaceGallery.vue'   // 空间作品画廊
import SpaceBlog from '../views/space/SpaceBlog.vue'         // 空间博客
import SpaceAbout from '../views/space/SpaceAbout.vue'       // 空间关于页
import SpaceContact from '../views/space/SpaceContact.vue'   // 空间联系页

// ==================== 全局私有资产页面（v2，用户登录后可见）====================
import Chat from '../views/Chat.vue'                     // 消息中心 - 全局私有
import TodoList from '../views/TodoList.vue'             // 排期管理 - 全局私有
import SpaceAdmin from '../views/SpaceAdmin.vue'         // 空间管理后台 - 全局私有

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

  // 普通用户首页（登录后，v2）
  {
    path: '/dashboard',
    name: 'UserDashboard',
    component: UserDashboard,
    meta: { requiresAuth: true, role: 'CLIENT' }
  },

  {
    path: '/commission',
    name: 'Commission',
    component: Commission,
    meta: { requiresAuth: true }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  },
  {
    path: '/artists',
    name: 'Artists',
    component: Artists
  },
  {
    path: '/artists/:uid',
    name: 'ArtistHome',
    component: ArtistHome
  },
  {
    path: '/studio',
    name: 'ArtistStudio',
    component: ArtistStudio,
    meta: { requiresAuth: true, requiresArtist: true }
  },
  {
    path: '/apply-artist',
    name: 'ArtistApply',
    component: ArtistApply,
    meta: { requiresAuth: true }
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact
  },

  // ----------------------------------------------------------
  // 【全局私有资产】用户个人中心相关 - 顶级路由，不在 SpaceLayout 内
  // ----------------------------------------------------------
  {
    path: '/orders',           // 订单管理
    name: 'OrderTracking',
    component: OrderTracking,
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',             // 消息中心
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true }
  },
  {
    path: '/todo',             // 排期/日程管理
    name: 'TodoList',
    component: TodoList,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/space',      // 空间管理后台
    name: 'SpaceAdmin',
    component: SpaceAdmin,
    meta: { requiresAuth: true, role: 'ARTIST' }
  },
  {
    path: '/profile',          // 个人资料
    name: 'Profile',
    component: Profile,
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
    component: AdminDashboard,
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
        component: SpaceHome,
        meta: { requiresAuth: false }
      },
      // 约稿页面
      {
        path: 'commission',
        name: 'SpaceCommission',
        component: SpaceCommission,
        meta: { requiresAuth: false, actionRequiresAuth: true }
      },
      // 作品画廊
      {
        path: 'gallery',
        name: 'SpaceGallery',
        component: SpaceGallery,
        meta: { requiresAuth: false }
      },
      // 画师博客
      {
        path: 'blog',
        name: 'SpaceBlog',
        component: SpaceBlog,
        meta: { requiresAuth: false }
      },
      // 关于画师
      {
        path: 'about',
        name: 'SpaceAbout',
        component: SpaceAbout,
        meta: { requiresAuth: false }
      },
      // 联系画师
      {
        path: 'contact',
        name: 'SpaceContact',
        component: SpaceContact,
        meta: { requiresAuth: false }
      },
      // 个性化装修 - 仅空间主人可访问
      {
        path: 'personalization',
        name: 'SpacePersonalization',
        component: Personalization,
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

  // 5. 需要画师权限
  if (to.meta.requiresArtist && !isArtist(currentUser)) {
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

export default router
