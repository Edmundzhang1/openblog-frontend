<template>
  <nav class="navbar" :class="{ 'space-mode': isSpaceMode }">
    <div class="container">
      <!-- ==================== 左侧区域 ==================== -->
      <div class="nav-left">
        <!-- 空间态：返回主站按钮（仅访客态显示，主人态隐藏）-->
        <button 
          v-if="isSpaceMode && currentSlug && !isSpaceOwner" 
          class="btn-exit-space"
          @click="exitSpace"
          title="返回主站"
        >
          返回
        </button>
        
        <!-- Logo（站点配置驱动：logo 图 + 站点名，本地功能线） -->
        <router-link to="/" class="logo" :aria-label="brandAriaLabel">
          <span class="brand-mark">
            <img v-if="showBrandLogo" :src="siteConfig.site_logo_url" alt="" @error="logoFailed = true">
            <span v-else class="logo-text">{{ brandInitial }}</span>
          </span>
          <span class="logo-text brand-name">{{ siteConfig.site_name || logoText }}</span>
          <!-- 空间态：显示当前空间名称 -->
          <template v-if="isSpaceMode && currentSlug">
            <span class="logo-divider">|</span>
            <span class="logo-sub">{{ spaceSubTitle }}</span>
          </template>
          <!-- 画师全局态：显示画师标识 -->
          <template v-else-if="isArtist && artistSlug">
            <span class="logo-divider">|</span>
            <span class="logo-sub">画师模式</span>
          </template>
        </router-link>

        <!-- 空间模式：业务菜单（左侧） -->
        <div v-if="isSpaceMode && spaceMenuItems.length > 0" class="space-menu">
          <router-link 
            v-for="item in spaceMenuItems" 
            :key="item.path"
            :to="item.path"
            :class="{ active: isActiveRoute(item.name) }"
          >
            {{ item.label }}
          </router-link>
          <a
            v-if="isLoggedIn && !isSpaceOwner && currentSlug"
            href="#"
            @click.prevent="goToChatWithArtist"
            :class="{ active: isActiveRoute('Chat') }"
          >
            私信
          </a>
        </div>
      </div>
      
      <!-- ==================== 中间区域（平台模式） ==================== -->
      <div class="nav-center" v-if="!isSpaceMode && platformMenuItems.length > 0">
        <router-link 
          v-for="item in platformMenuItems" 
          :key="item.path"
          :to="item.path"
          :class="{ active: isActiveRoute(item.name) }"
        >
          {{ item.label }}
        </router-link>
      </div>

      <!-- ==================== 右侧功能按钮 ==================== -->
      <div class="nav-right">
        <!-- 1. 个性化按钮（仅空间主人可见，绿色） -->
        <router-link 
          v-if="isSpaceOwner" 
          :to="`/@${currentSlug}/personalization`"
          class="btn-feature btn-personalization"
          :class="{ active: isActiveRoute('SpacePersonalization') }"
        >
          个性化
        </router-link>

        <!-- 2. 语言切换（灰色按钮） -->
        <div class="dropdown lang-dropdown" 
             @mouseenter="showLangDropdown = true" 
             @mouseleave="showLangDropdown = false">
          <button class="btn-feature btn-lang">
            {{ currentLang }}
          </button>
          <transition name="fade">
            <div class="dropdown-menu lang-menu" v-show="showLangDropdown">
              <button @click="changeLocale('zh')">{{ $t('common.languageZh') }}</button>
              <button @click="changeLocale('en')">{{ $t('common.languageEn') }}</button>
            </div>
          </transition>
        </div>

        <!-- 3. 通知入口（未读角标，本地功能线） -->
        <router-link
          v-if="isLoggedIn"
          to="/notifications"
          class="notification-link"
          :title="notificationLabel"
          :aria-label="notificationLabel"
        >
          <Bell :size="19" aria-hidden="true" />
          <span v-if="unreadCount" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </router-link>

        <!-- 4. 登录/用户菜单（绿色按钮） -->
        <template v-if="!isLoggedIn">
          <router-link to="/login" class="btn-feature btn-login">
            {{ $t('nav.login') || '登录' }}
          </router-link>
        </template>
        
        <div v-else 
             class="dropdown user-dropdown" 
             @mouseenter="showUserDropdown = true" 
             @mouseleave="showUserDropdown = false">
          <button class="btn-feature btn-user">
            <img v-if="userAvatar" :src="userAvatar" alt="avatar" class="user-avatar">
            <span v-else class="user-avatar-placeholder"></span>
            <span class="user-name">{{ displayUserName }}</span>
            <span class="dropdown-arrow"></span>
          </button>
          <transition name="fade">
            <div class="dropdown-menu user-menu" v-show="showUserDropdown">
              <router-link v-if="primaryMenuTarget" :to="primaryMenuTarget">{{ primaryMenuLabel || '菜单' }}</router-link>
              <!-- 画师：排期管理入口（v2） -->
              <router-link v-if="isArtist || isAdmin" to="/todo">排期管理</router-link>
              <!-- 普通用户：显示申请成为画师入口 -->
              <router-link v-if="!isArtist && !isAdmin" to="/apply-artist">申请成为画师</router-link>
              <router-link to="/orders">{{ $t('nav.orders') || '订单' }}</router-link>
              <router-link to="/chat">{{ $t('nav.chat') || '消息' }}</router-link>
              <router-link to="/notifications">{{ notificationLabel }}</router-link>
              <!-- 画师：显示"我的空间"快速入口 -->
              <router-link v-if="isArtist && artistSlug && !isSpaceOwner" :to="`/@${artistSlug}`">我的空间</router-link>
              <!-- 空间主人：显示装修入口 -->
              <router-link v-if="isSpaceOwner" :to="`/@${currentSlug}/personalization`">装修空间</router-link>
              <button @click="handleLogout" class="logout-btn">{{ $t('nav.logout') || '退出登录' }}</button>
            </div>
          </transition>
        </div>
      </div>

      <!-- ==================== 移动端菜单按钮 ==================== -->
      <button class="mobile-menu-btn" @click="showMobileMenu = !showMobileMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- ==================== 移动端菜单 ==================== -->
    <transition name="slide">
      <div v-if="showMobileMenu" class="mobile-menu">
        <!-- 返回主站 -->
        <button v-if="isSpaceMode && currentSlug" class="mobile-exit-btn" @click="exitSpace">
          返回主站
        </button>
        
        <!-- 业务菜单 -->
        <router-link 
          v-for="item in (isSpaceMode ? spaceMenuItems : platformMenuItems)" 
          :key="item.path"
          :to="item.path"
          @click="showMobileMenu = false"
        >
          {{ item.label }}
        </router-link>
        <a
          v-if="isLoggedIn && !isSpaceOwner && currentSlug && isSpaceMode"
          href="#"
          @click.prevent="goToChatWithArtist(); showMobileMenu = false"
          :class="{ active: isActiveRoute('Chat') }"
        >
          私信
        </a>
        
        <!-- 全局私有路由（登录用户） -->
        <template v-if="isLoggedIn">
          <hr class="mobile-divider">
          <router-link v-if="!isArtist && !isAdmin" to="/apply-artist" @click="showMobileMenu = false">申请成为画师</router-link>
          <router-link v-if="isArtist" to="/studio" @click="showMobileMenu = false">画师工作台</router-link>
          <router-link to="/orders" @click="showMobileMenu = false">订单</router-link>
          <router-link to="/chat" @click="showMobileMenu = false">消息</router-link>
          <router-link to="/notifications" @click="showMobileMenu = false">{{ notificationLabel }}</router-link>
          <router-link v-if="isArtist || isAdmin" to="/todo" @click="showMobileMenu = false">排期</router-link>
        </template>
        
        <!-- 个性化按钮 -->
        <router-link 
          v-if="isSpaceOwner" 
          :to="`/@${currentSlug}/personalization`" 
          class="mobile-personalization"
          @click="showMobileMenu = false"
        >
          个性化
        </router-link>
        
        <div class="mobile-lang">
          <button @click="changeLocale('zh')" :class="{ active: currentLocale === 'zh' }">中文</button>
          <button @click="changeLocale('en')" :class="{ active: currentLocale === 'en' }">English</button>
        </div>
        
        <router-link v-if="!isLoggedIn" to="/login" class="mobile-login" @click="showMobileMenu = false">
          登录
        </router-link>
        <button v-else @click="handleLogout; showMobileMenu = false" class="mobile-logout">
          退出登录
        </button>
      </div>
    </transition>
  </nav>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell } from '@lucide/vue'
import { showToast, eventBus, apiRequest } from '../utils/eventBus'
import { API_ENDPOINTS } from '../config/api'
import { AUTH_CHANGED_EVENT, clearSession, getCurrentUser, isAuthenticated } from '../utils/auth'
import { siteConfig } from '../state/siteConfig'

// ==================== 路由相关 ====================
const route = useRoute()
const router = useRouter()
const i18n = inject('i18n', { 
  getLocale: () => 'zh', 
  t: (key) => key,
  setLocale: () => {}
})

// ==================== UI 状态 ====================
const showLangDropdown = ref(false)
const showUserDropdown = ref(false)
const showMobileMenu = ref(false)
const spaceArtistUid = ref(0)
const unreadCount = ref(0)
const logoFailed = ref(false)

watch(() => siteConfig.site_logo_url, () => {
  logoFailed.value = false
})

// 未读通知数（本地功能线，基于 utils/eventBus 的 apiRequest）
const loadUnreadCount = async () => {
  if (!isLoggedIn.value) {
    unreadCount.value = 0
    return
  }
  try {
    const data = await apiRequest(API_ENDPOINTS.NOTIFICATIONS_UNREAD, { showError: false })
    unreadCount.value = Math.max(0, Number(data?.unread_count || 0))
  } catch {
    unreadCount.value = 0
  }
}

// 本地认证系统（utils/auth）变化时，刷新当前用户并刷新未读数
const syncAuthFromLocal = () => {
  currentUser.value = getCurrentUser()
  loadUnreadCount()
}

onMounted(() => {
  syncAuthFromLocal()
  window.addEventListener(AUTH_CHANGED_EVENT, syncAuthFromLocal)
  eventBus.on('notifications-updated', loadUnreadCount)
})
onUnmounted(() => {
  window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthFromLocal)
  eventBus.off('notifications-updated', loadUnreadCount)
})

// ==================== 认证状态（utils/auth）====================
// currentUser 由 AUTH_CHANGED_EVENT 驱动刷新（saveSession/clearSession/updateStoredUser 均会触发）
const currentUser = ref(getCurrentUser())
const isLoggedIn = computed(() => Boolean(currentUser.value) && isAuthenticated())
const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

// 判断用户是否是画师（全局状态，不依赖当前路由）
const isArtist = computed(() => {
  const role = currentUser.value?.role?.toUpperCase?.() || currentUser.value?.role
  return role === 'ARTIST' || role === 'artist'
})

// 获取画师 slug（用于全局状态显示）
const artistSlug = computed(() => {
  return currentUser.value?.slug || currentUser.value?.uid || ''
})

// ==================== 核心：双态判断 ====================
const isSpaceMode = computed(() => {
  try {
    const slug = route?.params?.slug
    return !!slug && typeof slug === 'string' && slug.length > 0
  } catch (e) {
    console.warn('[NavBar] isSpaceMode 判断出错:', e)
    return false
  }
})

const currentSlug = computed(() => {
  try {
    const slug = route?.params?.slug
    if (slug && typeof slug === 'string') {
      return slug.trim()
    }
    return ''
  } catch (e) {
    console.warn('[NavBar] currentSlug 读取出错:', e)
    return ''
  }
})

// 空间主人判断（增强版，支持 slug/uid 绑定）
const isSpaceOwner = computed(() => {
  try {
    console.log('[NavBar Debug] ====== isSpaceOwner 判断 ======')
    console.log('[NavBar Debug] route:', route)
    console.log('[NavBar Debug] route.params:', route?.params)
    console.log('[NavBar Debug] route.params.slug:', route?.params?.slug)
    console.log('[NavBar Debug] isSpaceMode:', isSpaceMode.value)
    console.log('[NavBar Debug] currentSlug:', currentSlug.value)
    console.log('[NavBar Debug] currentUser:', currentUser.value)
    
    // 条件1：必须在空间模式 && 有 slug
    if (!isSpaceMode.value || !currentSlug.value) {
      console.log('[NavBar Debug] 结果: false (不在空间模式或无slug)')
      return false
    }
    
    // 条件2：用户必须已登录
    if (!isLoggedIn.value || !currentUser.value) {
      console.log('[NavBar Debug] 结果: false (未登录)')
      return false
    }
    
    const routeSlug = currentSlug.value?.toString()?.trim()
    const userSlug = (currentUser.value.slug || currentUser.value.Slug || '').toString().trim()
    const userUid = (currentUser.value.uid || currentUser.value.id || '').toString().trim()
    
    console.log('[NavBar Debug] 比对:', { 
      routeSlug, 
      userSlug, 
      userUid,
      matchSlug: userSlug && userSlug.toLowerCase() === routeSlug.toLowerCase(),
      matchUid: userUid && userUid === routeSlug
    })
    
    // 条件3：匹配 slug 或 uid（支持 slug 和 uid 绑定）
    const isOwner = (
      // 方式1：slug 匹配
      (userSlug && userSlug.toLowerCase() === routeSlug.toLowerCase()) ||
      // 方式2：uid 匹配（slug 未设置时使用 uid）
      (userUid && userUid === routeSlug)
    )
    
    console.log('[NavBar Debug] 结果:', isOwner)
    return isOwner
  } catch (e) {
    console.warn('[NavBar] isSpaceOwner 判断出错:', e)
    return false
  }
})

// ==================== 菜单配置 ====================
// 空间模式业务菜单（左侧）- 只包含空间专属路由
const spaceMenuItems = computed(() => {
  try {
    if (!currentSlug.value) return []
    const slug = encodeURIComponent(currentSlug.value)
    const items = [
      { name: 'SpaceHome', path: `/@${slug}/home`, label: '首页' },      // 空间首页（Space.vue 子路由）
      { name: 'SpaceCommission', path: `/@${slug}/commission`, label: '约稿' },
      { name: 'SpaceGallery', path: `/@${slug}/gallery`, label: '作品展示' },
      { name: 'SpaceBlog', path: `/@${slug}/blog`, label: '动态' },
      { name: 'SpaceAbout', path: `/@${slug}/about`, label: '关于' },
      { name: 'SpaceContact', path: `/@${slug}/contact`, label: '联系' }
      // 注意：订单、消息、日程是【全局私有路由】，不在空间菜单中
    ]
    
    // 🔥 普通用户登录后在"联系"旁边显示网站私信入口
    if (isLoggedIn.value && !isSpaceOwner.value) {
      items.push({ name: 'Chat', path: '/chat', label: '私信' })
    }
    
    return items
  } catch (e) {
    console.error('[NavBar] spaceMenuItems 计算出错:', e)
    return []
  }
})

// 平台模式菜单（中间）- 本地功能线的完整 i18n 菜单
const platformMenuItems = computed(() => {
  try {
    return [
      { name: 'Home', path: '/', label: i18n?.t('nav.home') || '首页' },
      { name: 'Artists', path: '/artists', label: i18n?.t('nav.artists') || '画师' },
      { name: 'Commission', path: '/commission', label: i18n?.t('nav.commission') || '约稿' },
      { name: 'Gallery', path: '/gallery', label: i18n?.t('nav.gallery') || '作品' },
      { name: 'OrderTracking', path: '/orders', label: i18n?.t('nav.orders') || '订单' },
      { name: 'Blog', path: '/blog', label: i18n?.t('nav.blog') || '动态' },
      { name: 'About', path: '/about', label: i18n?.t('nav.about') || '关于' },
      { name: 'Contact', path: '/contact', label: i18n?.t('nav.contact') || '联系' }
    ]
  } catch (e) {
    console.error('[NavBar] platformMenuItems 计算出错:', e)
    return [
      { name: 'Home', path: '/', label: '首页' },
      { name: 'Login', path: '/login', label: '登录' }
    ]
  }
})

// ==================== Logo 相关 ====================
// 默认品牌名（站点配置未加载时的兜底）
const logoText = computed(() => 'FUREST')

// 本地功能线：品牌展示由站点配置驱动
const brandAriaLabel = computed(() => {
  const name = siteConfig.site_name || logoText.value
  return currentLocale.value === 'zh' ? `${name} 首页` : `${name} home`
})
const brandInitial = computed(() => (siteConfig.site_name || logoText.value).trim().charAt(0).toUpperCase() || 'F')
const showBrandLogo = computed(() => Boolean(siteConfig.site_logo_url) && !logoFailed.value)

const spaceSubTitle = computed(() => {
  try {
    if (!isSpaceMode.value || !currentSlug.value) return ''
    const slug = currentSlug.value
    return slug === 'demo' ? '画师专属空间' : `${slug} 的空间`
  } catch (e) {
    return '画师空间'
  }
})

// ==================== 用户相关 ====================
const currentLang = computed(() => {
  try {
    return i18n?.getLocale?.() === 'zh' 
      ? (i18n?.t('common.languageZh') || '中文') 
      : (i18n?.t('common.languageEn') || 'English')
  } catch (e) {
    return '中文'
  }
})

const currentLocale = computed(() => {
  try {
    return i18n?.getLocale?.() || 'zh'
  } catch (e) {
    return 'zh'
  }
})

const displayUserName = computed(() => {
  try {
    const user = currentUser.value
    if (!user || typeof user !== 'object') {
      return i18n?.t('nav.defaultUser') || '用户'
    }
    return user.username || user.nickname || user.email || i18n?.t('nav.defaultUser') || '用户'
  } catch (e) {
    console.warn('[NavBar] displayUserName 计算出错:', e)
    return '用户'
  }
})

const primaryMenuTarget = computed(() => {
  try {
    if (isAdmin.value) return '/admin'
    if (isArtist.value) return '/studio'
    return null
  } catch (e) {
    return null
  }
})

const primaryMenuLabel = computed(() => {
  try {
    if (isAdmin.value) {
      return i18n?.getLocale?.() === 'zh' ? '管理后台' : 'Admin Dashboard'
    }
    if (isArtist.value) {
      return i18n?.t('nav.studio') || '画师工作台'
    }
    return null
  } catch (e) {
    return null
  }
})

// 通知入口文案（本地功能线）
const notificationLabel = computed(() => currentLocale.value === 'zh' ? '通知' : 'Notifications')

const userAvatar = computed(() => {
  try {
    const user = currentUser.value
    if (!user) return ''
    return user.avatar || user.avatar_url || ''
  } catch (e) {
    return ''
  }
})

// ==================== 方法 ====================
const isActiveRoute = (routeName) => {
  try {
    return route?.name === routeName
  } catch (e) {
    return false
  }
}

// 监听 Space.vue 广播的画师信息
eventBus.on('space-artist-loaded', ({ uid }) => {
  spaceArtistUid.value = uid || 0
})

const changeLocale = (locale) => {
  try {
    if (i18n?.setLocale) {
      i18n.setLocale(locale)
    }
    showLangDropdown.value = false
    showMobileMenu.value = false
    showToast(locale === 'zh' ? '已切换到中文' : 'Switched to English', 'success')
  } catch (e) {
    console.error('[NavBar] changeLocale 出错:', e)
  }
}

const handleLogout = async () => {
  showUserDropdown.value = false
  showMobileMenu.value = false

  try {
    // 清理本地认证系统（utils/auth）的会话
    try {
      clearSession()
    } catch (clearError) {
      console.warn('[NavBar] clearSession 调用出错:', clearError)
    }

    try {
      showToast(i18n?.t('nav.logoutSuccess') || '退出成功', 'success')
    } catch (toastError) {}

    try {
      await router.push('/')
    } catch (routerError) {
      console.error('[NavBar] 路由跳转失败:', routerError)
      window.location.href = '/'
    }
  } catch (e) {
    console.error('[NavBar] handleLogout 严重错误:', e)
    window.location.href = '/'
  }
}

const goToChatWithArtist = async () => {
  try {
    // 优先使用 Space.vue 广播过来的画师 UID，避免额外 API 请求
    if (spaceArtistUid.value) {
      await router.push(`/chat?artist_id=${spaceArtistUid.value}`)
      return
    }
    // Fallback：自行请求 API 获取 UID
    const res = await fetch(`/api/v1/space/${currentSlug.value}`)
    const data = await res.json()
    if (res.ok && data.code === 0) {
      const artistId = data.data?.uid
      if (artistId) {
        await router.push(`/chat?artist_id=${artistId}`)
      }
    }
  } catch (e) {
    console.error('[NavBar] 跳转私信失败:', e)
  }
}

const exitSpace = async () => {
  showMobileMenu.value = false
  showUserDropdown.value = false
  
  try {
    await router.push('/')
  } catch (e) {
    console.error('[NavBar] exitSpace 路由跳转失败:', e)
    window.location.href = '/'
  }
}
</script>

<style scoped>
.navbar {
  background: var(--white);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* 空间态：轻微不同的背景色 */
.navbar.space-mode {
  background: linear-gradient(90deg, var(--white) 0%, #f8f9ff 100%);
  border-bottom: 2px solid var(--primary-color);
}

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

/* ==================== 左侧区域 ==================== */
.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

/* 退出空间按钮 */
.btn-exit-space {
  width: 36px;
  height: 36px;
  background: var(--bg-light);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-exit-space:hover {
  background: var(--primary-color);
  color: white;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  text-decoration: none;
  white-space: nowrap;
}

.logo-text {
  font-weight: 800;
}

.logo-divider {
  color: #ccc;
  font-weight: 300;
}

.logo-sub {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-light);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空间模式业务菜单 */
.space-menu {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 20px;
  padding-left: 20px;
  border-left: 1px solid #e0e0e0;
}

.space-menu a {
  color: var(--text-dark);
  font-weight: 500;
  font-size: 0.95rem;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.space-menu a:hover {
  background: var(--bg-light);
  color: var(--primary-color);
}

.space-menu a.active {
  background: var(--primary-color);
  color: white;
}

/* ==================== 中间区域（平台模式） ==================== */
.nav-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-center a {
  color: var(--text-dark);
  font-weight: 500;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-center a:hover {
  background: var(--bg-light);
  color: var(--primary-color);
}

.nav-center a.active {
  background: var(--primary-color);
  color: white;
}

/* ==================== 右侧功能按钮 ==================== */
.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 功能按钮基础样式 */
.btn-feature {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  border: none;
  white-space: nowrap;
}

/* 绿色按钮（个性化、登录） */
.btn-personalization,
.btn-login {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  color: white !important;
}

.btn-personalization:hover,
.btn-login:hover {
  background: linear-gradient(135deg, #059669 0%, #10B981 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-personalization.active {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
}

/* 灰色按钮（语言切换） */
.btn-lang {
  background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%);
  color: white !important;
}

.btn-lang:hover {
  background: linear-gradient(135deg, #4B5563 0%, #6B7280 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

/* 用户按钮 */
.btn-user {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  color: white;
  padding: 6px 14px 6px 6px;
}

.btn-user:hover {
  background: linear-gradient(135deg, #059669 0%, #10B981 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.user-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 下拉箭头（CSS 绘制） */
.dropdown-arrow {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid currentColor;
  margin-left: 4px;
}

/* 下拉菜单 */
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--white);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border-radius: 12px;
  padding: 8px 0;
  min-width: 160px;
  z-index: 1001;
}

.dropdown-menu a,
.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 10px 16px;
  color: var(--text-dark);
  font-size: 0.95rem;
  transition: all 0.2s;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}

.dropdown-menu a:hover,
.dropdown-menu button:hover {
  background: var(--bg-light);
  color: var(--primary-color);
}

.dropdown-menu hr {
  margin: 8px 0;
  border: none;
  border-top: 1px solid var(--bg-light);
}

.logout-btn {
  color: #e74c3c !important;
}

.lang-menu {
  min-width: 120px;
}

.user-menu {
  min-width: 180px;
}

/* ==================== 移动端菜单按钮 ==================== */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.mobile-menu-btn span {
  display: block;
  width: 25px;
  height: 3px;
  background: var(--text-dark);
  border-radius: 3px;
  transition: var(--transition);
}

/* ==================== 移动端菜单 ==================== */
.mobile-menu {
  display: none;
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  background: var(--white);
  box-shadow: var(--shadow);
  padding: 20px;
  flex-direction: column;
  gap: 12px;
  z-index: 999;
}

.mobile-menu a,
.mobile-menu button {
  color: var(--text-dark);
  padding: 12px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 1rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.mobile-menu a:hover {
  background: var(--bg-light);
}

.mobile-exit-btn {
  background: var(--primary-color) !important;
  color: white !important;
}

.mobile-personalization {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%) !important;
  color: white !important;
  text-align: center !important;
  font-weight: 600;
}

.mobile-lang {
  display: flex;
  gap: 10px;
  padding: 10px 0;
}

.mobile-lang button {
  flex: 1;
  padding: 10px;
  border: 2px solid #ddd;
  background: var(--white);
  border-radius: 8px;
}

.mobile-lang button.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.mobile-login {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%) !important;
  color: white !important;
  text-align: center !important;
  font-weight: 600;
}

.mobile-logout {
  background: #fee2e2 !important;
  color: #dc2626 !important;
  text-align: center !important;
}

/* ==================== 动画 ==================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* ==================== 响应式 ==================== */
@media (max-width: 1200px) {
  .space-menu {
    gap: 2px;
  }
  
  .space-menu a {
    padding: 6px 8px;
    font-size: 0.9rem;
  }
  
  .btn-feature {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}

@media (max-width: 1024px) {
  .nav-left .space-menu,
  .nav-center,
  .nav-right {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .mobile-menu {
    display: flex;
  }
  
  .logo-sub {
    display: none;
  }
}

@media (max-width: 640px) {
  .btn-exit-space {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
  
  .logo {
    font-size: 1.2rem;
  }
}

/* ==================== 本地功能线：品牌 Logo 与通知角标 ==================== */
.brand-mark {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  overflow: hidden;
  background: var(--text-dark);
  color: var(--white);
  border-radius: 8px;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.brand-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-link {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid #E5E5E5;
  border-radius: 50%;
  color: var(--text-dark);
  background: #fff;
  transition: var(--transition);
}

.notification-link:hover,
.notification-link.router-link-active {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -7px;
  display: grid;
  place-items: center;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border: 2px solid #fff;
  border-radius: 10px;
  background: #EF4444;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
}
</style>
