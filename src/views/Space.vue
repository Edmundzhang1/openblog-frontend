<template>
  <!-- 
    Space.vue - 极简透明壳
    只负责：1) 获取画师数据  2) 向子组件注入数据  3) 渲染子路由
    不渲染任何 UI，保持原有页面画风
  -->
  
  <!-- 错误状态：该用户未开通画师空间 -->
  <div v-if="error" class="space-error">
    <div class="error-content fade-in">
      <h2>🔍 空间未找到</h2>
      <p>{{ error }}</p>
      <router-link to="/" class="btn btn-primary">返回首页</router-link>
    </div>
  </div>

  <router-view v-else-if="!loading" />

  <!-- 加载状态（仅首次加载时显示，不影响整体布局） -->
  <div v-else class="space-loading fade-in">
    <span>加载中...</span>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, provide } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest, eventBus } from '../utils/eventBus.js'
import { getCurrentUser, isAuthenticated } from '../utils/auth.js'
import { setViewingPersonalization, configFromBackend } from '../utils/personalization.js'

export default {
  name: 'Space',
  props: {
    slug: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    
    // ==================== 状态 ====================
    const loading = ref(true)
    const error = ref('')
    
    // 画师数据（默认空结构）
    const artistData = ref({
      uid: 0,
      slug: '',
      role: '',
      nickname: '',
      avatar_url: '',
      bio: '',
      artist_tags: [],
      artist_verified: false,
      commission_open: false,
      commission_rules: '',
      price_range_min: 0,
      price_range_max: 0,
      page_config: {},
      contact_info: {}
    })
    
    // ==================== 默认兜底数据（当后端返回不完整时使用）====================
    const DEFAULT_ARTIST_DATA = {
      uid: 0,
      slug: props.slug,
      role: '',
      nickname: '画师空间',
      avatar_url: '',
      bio: '',
      artist_tags: [],
      artist_verified: false,
      commission_open: false,
      commission_rules: '',
      price_range_min: 0,
      price_range_max: 0,
      created_at: '',
      page_config: {
        primary_color: '#667eea',
        background_color: '#f8f9fa',
        text_color: '#333333',
        background_image: '',
        background_style: 'cover',
        show_gallery: true,
        show_commission: true,
        show_price_table: true,
        show_contact: true,
        layout_type: 'default',
        avatar_style: 'circle',
        custom_css: '',
        custom_header: '',
        custom_footer: ''
      },
      contact_info: {}
    }

    // Mock 测试数据（/@demo|test|mock 专用）
    const MOCK_ARTIST_DATA = {
      ...DEFAULT_ARTIST_DATA,
      uid: 0,
      role: 'ARTIST',
      nickname: 'Demo 画师',
      bio: '这是一个前端 Mock 空间，用于无后端环境下预览主页效果。',
      artist_verified: true,
      commission_open: true
    }

    // 将后端空间数据归一化为向后兼容的 artistInfo 结构（缺字段补默认值）
    const normalizeSpaceData = (data) => {
      const safe = data && typeof data === 'object' ? data : {}
      return {
        ...DEFAULT_ARTIST_DATA,
        ...safe,
        slug: safe.slug || props.slug,
        artist_tags: Array.isArray(safe.artist_tags) ? safe.artist_tags : [],
        page_config: { ...DEFAULT_ARTIST_DATA.page_config, ...(safe.page_config || {}) },
        contact_info: safe.contact_info || {}
      }
    }
    
    // ==================== 计算属性 ====================

    // 判断当前用户是否是空间主人（增强版，支持 slug/uid 绑定）
    const isOwner = computed(() => {
      const currentUser = getCurrentUser()
      const loggedIn = isAuthenticated()
      console.log('[Space Debug] ====== isOwner 判断 ======')
      console.log('[Space Debug] isAuthenticated:', loggedIn)
      console.log('[Space Debug] currentUser:', currentUser)
      console.log('[Space Debug] props.slug:', props.slug)

      if (!loggedIn || !currentUser) {
        console.log('[Space Debug] 结果: false (未登录)')
        return false
      }

      const propSlug = props.slug?.toString()?.trim()
      const userSlug = (currentUser.slug || currentUser.Slug || '').toString().trim()
      const userUid = (currentUser.uid || currentUser.id || '').toString().trim()

      console.log('[Space Debug] 比对:', { propSlug, userSlug, userUid })

      // 方式1：slug 匹配
      if (userSlug && userSlug.toLowerCase() === propSlug?.toLowerCase()) {
        console.log('[Space Debug] 结果: true (slug 匹配)')
        return true
      }

      // 方式2：uid 匹配（slug 未设置时使用 uid 作为 slug）
      if (userUid && userUid === propSlug) {
        console.log('[Space Debug] 结果: true (uid 匹配)')
        return true
      }

      // 兜底：用 uid 匹配 artistData
      const uidMatch = String(currentUser.uid) === String(artistData.value.uid)
      console.log('[Space Debug] 兜底 uid 匹配结果:', uidMatch)
      return uidMatch
    })
    
    // ==================== 方法 ====================
    
    // 拉取空间 DIY 配置并写入运行时（静默失败，空配置忽略）
    const fetchPageConfig = async () => {
      try {
        const raw = await apiRequest(`/api/v1/space/${props.slug}/page-config`, { showError: false })
        // 成功且返回非空对象时才应用（configFromBackend 对空/异常结构返回 null）
        const config = configFromBackend(raw)
        if (config) {
          setViewingPersonalization(config)
        }
      } catch (err) {
        // 失败/为空时静默忽略，不影响空间展示
      }
    }
    
    // 获取空间数据（支持 Mock 降级）
    const fetchSpaceData = async () => {
      loading.value = true
      
      // ==================== 魔法测试账号：Mock 模式 ====================
      // 纯前端开发时，访问 /@demo 自动使用 Mock 数据，无需启动后端
      if (props.slug === 'demo' || props.slug === 'test' || props.slug === 'mock') {
        console.log('[Space] 🎨 Mock 模式已激活，使用测试数据')
        // 模拟网络延迟，让加载动画更真实
        await new Promise(resolve => setTimeout(resolve, 300))
        artistData.value = { ...MOCK_ARTIST_DATA, slug: props.slug }
        eventBus.emit('space-artist-loaded', { uid: 0, slug: props.slug, role: MOCK_ARTIST_DATA.role })
        loading.value = false
        return
      }
      
      try {
        const data = await apiRequest(`/api/v1/space/${props.slug}`, { showError: false })
        artistData.value = normalizeSpaceData(data)
        error.value = ''
        // 🔥 通知 Navbar 当前空间用户 UID/角色，避免私信按钮再次请求 API
        eventBus.emit('space-artist-loaded', { uid: artistData.value.uid || 0, slug: props.slug, role: artistData.value.role || '' })
        // 拉取该用户的主页 DIY 配置（访客查看态，静默处理）
        fetchPageConfig()
      } catch (err) {
        console.error('获取空间数据失败:', err)
        
        // 任何存在且活跃的用户都有主页（含 CLIENT）；只有 404 才代表空间不存在
        if (err?.status === 404) {
          error.value = '空间不存在或已被删除。'
        } else if (!import.meta.env.DEV) {
          error.value = '空间加载失败，请稍后重试。'
        }
        
        // ==================== 优雅降级：API 失败时使用 Mock ====================
        // 这样即使后端挂了，前端也能正常展示 UI 进行开发调试
        if (import.meta.env.DEV) {
          console.warn('[Space] ⚠️ API 请求失败，自动降级到 Mock 数据')
          artistData.value = { 
            ...MOCK_ARTIST_DATA, 
            slug: props.slug,
            nickname: `${props.slug} 的空间`,
            bio: `欢迎来到 ${props.slug} 的专属空间！\n（当前使用 Mock 数据，因为后端 API 暂时不可用）`
          }
          eventBus.emit('space-artist-loaded', { uid: artistData.value.uid, slug: props.slug, role: MOCK_ARTIST_DATA.role })
        }
      } finally {
        loading.value = false
      }
    }
    
    // ==================== Provide：向子组件下发画师数据 ====================
    provide('artistInfo', artistData)
    provide('isSpaceOwner', isOwner)
    
    // ==================== 生命周期 ====================
    
    onMounted(() => {
      fetchSpaceData()
    })
    
    // 监听 slug 变化（当访问不同画师空间时）
    watch(() => props.slug, (newSlug) => {
      if (newSlug) {
        fetchSpaceData()
      }
    })
    
    return {
      loading,
      error
    }
  }
}
</script>

<style scoped>
/* 错误状态 */
.space-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 64px 20px;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-content h2 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.error-content p {
  color: var(--text-light);
  margin-bottom: 32px;
  line-height: 1.6;
}

/* 极简加载状态，不影响页面布局 */
.space-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-muted);
}
</style>
