import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Commission from '../views/Commission.vue'
import Gallery from '../views/Gallery.vue'
import TodoList from '../views/TodoList.vue'
import About from '../views/About.vue'
import Contact from '../views/Contact.vue'
import Login from '../views/Login.vue'
import OrderTracking from '../views/OrderTracking.vue'
import Blog from '../views/Blog.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import Personalization from '../views/Personalization.vue'
import { getCurrentUser, getPostLoginRoute, isAdmin, isAuthenticated } from '../utils/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/commission',
    name: 'Commission',
    component: Commission
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  },
  {
    path: '/todo',
    name: 'TodoList',
    component: TodoList,
    meta: { requiresAuth: true }
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog
  },
  {
    path: '/orders',
    name: 'OrderTracking',
    component: OrderTracking
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
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/personalization',
    name: 'Personalization',
    component: Personalization
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const currentUser = getCurrentUser()
  const loggedIn = isAuthenticated()

  if (to.name === 'Login' && loggedIn) {
    next(getPostLoginRoute(currentUser, '/todo'))
    return
  }

  if (to.meta.requiresAuth && !loggedIn) {
    next('/login?redirect=' + encodeURIComponent(to.fullPath))
    return
  }

  if (to.meta.requiresAdmin && !isAdmin(currentUser)) {
    next(getPostLoginRoute(currentUser, '/todo'))
    return
  }

  next()
})

export default router
