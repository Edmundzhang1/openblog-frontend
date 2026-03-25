<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="logo">
        <img v-if="showLogo" :src="logoUrl" alt="logo" :style="logoImageStyle" @error="handleLogoError">
        <span>{{ personalization.site?.name || 'FUREST' }}</span>
      </router-link>
      
      <div class="nav-links">
        <router-link to="/">{{ $t('nav.home') }}</router-link>
        <router-link to="/commission">{{ $t('nav.commission') }}</router-link>
        <router-link to="/gallery">{{ $t('nav.gallery') }}</router-link>
        <router-link to="/orders">{{ $t('nav.orders') }}</router-link>
        <router-link to="/blog">{{ $t('nav.blog') }}</router-link>
        <router-link to="/about">{{ $t('nav.about') }}</router-link>
        <router-link to="/contact">{{ $t('nav.contact') }}</router-link>

        <!-- 个性化设置 -->
        <router-link to="/personalization" class="settings-btn" :title="$t('nav.personalization')">
          {{ $t('nav.personalization') }}
        </router-link>

        <!-- 语言切换 -->
        <div class="dropdown lang-dropdown" @mouseenter="showLangDropdown = true" @mouseleave="showLangDropdown = false">
          <button class="lang-btn">
            {{ currentLang }} 🌐
          </button>
          <transition name="fade">
            <div class="dropdown-menu lang-menu" v-show="showLangDropdown">
              <button @click="changeLocale('zh')">{{ $t('common.languageZh') }}</button>
              <button @click="changeLocale('en')">{{ $t('common.languageEn') }}</button>
            </div>
          </transition>
        </div>

        <!-- 用户菜单 / 登录按钮 -->
        <div v-if="isLoggedIn" class="dropdown user-dropdown" @mouseenter="showUserDropdown = true" @mouseleave="showUserDropdown = false">
          <button class="user-btn">
            <img :src="userAvatar" alt="avatar" class="user-avatar">
            <span>{{ displayUserName }}</span>
            <span>▼</span>
          </button>
          <transition name="fade">
            <div class="dropdown-menu user-menu" v-show="showUserDropdown">
              <router-link :to="primaryMenuTarget">{{ primaryMenuLabel }}</router-link>
              <router-link to="/orders">{{ $t('nav.orders') }}</router-link>
              <router-link to="/chat">{{ $t('nav.chat') }}</router-link>
              <hr>
              <button @click="logout" class="logout-btn">{{ $t('nav.logout') }}</button>
            </div>
          </transition>
        </div>
        
        <router-link v-else to="/login" class="btn-login-link">
          {{ $t('nav.login') }}
        </router-link>
      </div>

      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-btn" @click="showMobileMenu = !showMobileMenu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- 移动端菜单 -->
    <transition name="slide">
      <div v-if="showMobileMenu" class="mobile-menu">
        <router-link to="/" @click="showMobileMenu = false">{{ $t('nav.home') }}</router-link>
        <router-link to="/commission" @click="showMobileMenu = false">{{ $t('nav.commission') }}</router-link>
        <router-link to="/gallery" @click="showMobileMenu = false">{{ $t('nav.gallery') }}</router-link>
        <router-link to="/orders" @click="showMobileMenu = false">{{ $t('nav.orders') }}</router-link>
        <router-link to="/blog" @click="showMobileMenu = false">{{ $t('nav.blog') }}</router-link>
        <router-link to="/about" @click="showMobileMenu = false">{{ $t('nav.about') }}</router-link>
        <router-link to="/contact" @click="showMobileMenu = false">{{ $t('nav.contact') }}</router-link>
        <div class="mobile-lang">
          <button @click="changeLocale('zh')" :class="{ active: currentLocale === 'zh' }">{{ $t('common.languageZh') }}</button>
          <button @click="changeLocale('en')" :class="{ active: currentLocale === 'en' }">{{ $t('common.languageEn') }}</button>
        </div>
        <router-link v-if="!isLoggedIn" to="/login" class="btn btn-primary" @click="showMobileMenu = false">
          {{ $t('nav.login') }}
        </router-link>
      </div>
    </transition>
  </nav>
</template>

<script>
import { inject, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '../utils/eventBus'
import { AUTH_CHANGED_EVENT, clearSession, getCurrentUser, isAuthenticated } from '../utils/auth'
import { getPersonalization } from '../utils/personalization.js'

export default {
  name: 'Navbar',
  setup() {
    const router = useRouter()
    const i18n = inject('i18n')
    const personalization = ref(getPersonalization())
    
    const showLangDropdown = ref(false)
    const showUserDropdown = ref(false)
    const showMobileMenu = ref(false)
    const logoLoadFailed = ref(false)
    const logoUrl = computed(() => (personalization.value.site?.logo || '').trim())
    const logoSize = computed(() => {
      const numericSize = Number(personalization.value.site?.logoSize)
      if (!Number.isFinite(numericSize)) return 56
      return Math.min(Math.max(Math.round(numericSize), 28), 120)
    })
    const showLogo = computed(() => Boolean(logoUrl.value) && !logoLoadFailed.value)
    const logoImageStyle = computed(() => ({
      width: `${logoSize.value}px`,
      height: `${logoSize.value}px`
    }))
    const isLoggedIn = ref(false)
    const userName = ref('')
    const userRole = ref('guest')
    const userAvatar = computed(() => {
      // 优先使用个性化配置中的头像
      if (personalization.value.profile && personalization.value.profile.avatar) {
        return personalization.value.profile.avatar
      }
      return 'https://via.placeholder.com/40'
    })
    
    // 计算当前语言显示
    const currentLang = computed(() => {
      return i18n.getLocale() === 'zh' ? i18n.t('common.languageZh') : i18n.t('common.languageEn')
    })
    
    // 当前语言代码
    const currentLocale = computed(() => {
      return i18n.getLocale()
    })

    const displayUserName = computed(() => {
      return userName.value || i18n.t('nav.defaultUser')
    })

    const primaryMenuTarget = computed(() => {
      return userRole.value === 'admin' ? '/admin' : '/todo'
    })

    const primaryMenuLabel = computed(() => {
      if (userRole.value === 'admin') {
        return i18n.getLocale() === 'zh' ? '管理后台' : 'Admin Dashboard'
      }
      return i18n.t('nav.schedule')
    })
    
    // 切换语言
    const changeLocale = (locale) => {
      i18n.setLocale(locale)
      showLangDropdown.value = false
      showMobileMenu.value = false
      showToast(locale === 'zh' ? i18n.t('nav.switchedToZh') : i18n.t('nav.switchedToEn'), 'success')
    }
    
    // 检查登录状态
    const checkLoginStatus = () => {
      const currentUser = getCurrentUser()
      if (isAuthenticated() && currentUser) {
        isLoggedIn.value = true
        userRole.value = currentUser.role || 'user'
        userName.value = currentUser.username || ''
      } else {
        isLoggedIn.value = false
        userRole.value = 'guest'
        userName.value = ''
      }
    }
    
    // 退出登录
    const logout = () => {
      clearSession()
      isLoggedIn.value = false
      userRole.value = 'guest'
      userName.value = ''
      showUserDropdown.value = false
      showMobileMenu.value = false
      router.push('/')
      showToast(i18n.t('nav.logoutSuccess'), 'success')
    }

    const handleAuthChanged = () => {
      checkLoginStatus()
    }
    
    const handlePersonalizationChange = (e) => {
      personalization.value = e.detail
    }

    const handleLogoError = () => {
      logoLoadFailed.value = true
    }

    watch(logoUrl, () => {
      logoLoadFailed.value = false
    })
    
    onMounted(() => {
      checkLoginStatus()
      window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged)
      window.addEventListener('personalization-changed', handlePersonalizationChange)
    })

    onUnmounted(() => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged)
      window.removeEventListener('personalization-changed', handlePersonalizationChange)
    })
    
    return {
      showLangDropdown,
      showUserDropdown,
      showMobileMenu,
      showLogo,
      logoUrl,
      logoImageStyle,
      handleLogoError,
      isLoggedIn,
      userName,
      userRole,
      displayUserName,
      userAvatar,
      primaryMenuTarget,
      primaryMenuLabel,
      currentLang,
      currentLocale,
      changeLocale,
      logout,
      personalization
    }
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

.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 70px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  text-decoration: none;
}

.logo img {
  object-fit: contain;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: transform 0.2s ease;
  transform-origin: center;
}

.logo:hover img {
  transform: scale(1.06);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 25px;
}

.nav-links a {
  color: var(--text-dark);
  font-weight: 500;
  transition: var(--transition);
  position: relative;
  text-decoration: none;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--primary-color);
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: var(--transition);
}

.nav-links a:hover::after,
.nav-links a.router-link-active::after {
  width: 100%;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: var(--white);
  box-shadow: var(--shadow-hover);
  border-radius: var(--radius-sm);
  padding: 10px 0;
  min-width: 150px;
  transition: var(--transition);
}

.dropdown-menu a,
.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 10px 20px;
  color: var(--text-dark);
  transition: var(--transition);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.95rem;
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

/* 语言切换 */
.lang-btn {
  background: var(--bg-light);
  border: none;
  padding: 8px 15px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--transition);
}

.lang-btn:hover {
  background: var(--secondary-color);
}

.lang-menu {
  min-width: 100px;
}

/* 用户菜单 */
.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-light);
  border: none;
  padding: 6px 15px 6px 6px;
  border-radius: 25px;
  cursor: pointer;
  transition: var(--transition);
}

.user-btn:hover {
  background: var(--secondary-color);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-menu {
  min-width: 180px;
  right: 0;
  left: auto;
  transform: translateY(10px);
}

.logout-btn {
  color: #e74c3c !important;
}

/* 登录按钮 */
.btn-login-link {
  background: var(--primary-color) !important;
  color: var(--white) !important;
  padding: 8px 20px !important;
  border-radius: var(--radius-sm);
}

.btn-login-link:hover {
  background: var(--accent-color) !important;
}

.btn-login-link::after {
  display: none !important;
}

/* 个性化设置按钮 */
.settings-btn {
  font-size: 0.95rem;
  padding: 8px 15px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
  background: var(--primary-color);
  color: var(--white) !important;
  font-weight: 500;
}

.settings-btn:hover,
.settings-btn.router-link-active,
.settings-btn.router-link-exact-active {
  background: var(--primary-dark);
  color: var(--white) !important;
  transform: translateY(-2px);
}

.settings-btn::after {
  display: none !important;
}

/* 移动端个性化菜单链接 */
.mobile-settings-link {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: var(--white) !important;
  border-radius: var(--radius-sm);
  margin: 5px 0;
  text-align: center;
  font-weight: 500;
}

/* 移动端菜单按钮 */
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

/* 移动端菜单 */
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
  gap: 15px;
}

.mobile-menu a {
  color: var(--text-dark);
  padding: 10px 0;
  border-bottom: 1px solid var(--bg-light);
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
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.mobile-lang button.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: var(--white);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
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

/* 响应式 */
@media (max-width: 1024px) {
  .nav-links {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .mobile-menu {
    display: flex;
  }
}
</style>
