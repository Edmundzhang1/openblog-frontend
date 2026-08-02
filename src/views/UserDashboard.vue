<template>
  <div class="user-dashboard fade-in">
    <!-- 顶部导航 -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>👋 你好，{{ userName }}</h1>
        <p class="header-subtitle">欢迎来到你的个人中心</p>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="dashboard-main">
      <div class="container">
        <!-- 快捷入口 -->
        <section class="quick-actions">
          <h2 class="section-title">快速入口</h2>
          <div class="action-grid">
            <router-link to="/orders" class="action-card">
              <div class="action-icon">📋</div>
              <h3>我的订单</h3>
              <p>查看委托进度和历史订单</p>
            </router-link>
            
            <router-link to="/chat" class="action-card">
              <div class="action-icon">💬</div>
              <h3>消息中心</h3>
              <p>与画师沟通需求</p>
            </router-link>
            
            <router-link to="/profile" class="action-card">
              <div class="action-icon">👤</div>
              <h3>个人资料</h3>
              <p>修改头像、昵称等信息</p>
            </router-link>
            
            <div class="action-card" @click="browseArtists">
              <div class="action-icon">🎨</div>
              <h3>发现画师</h3>
              <p>浏览优质画师作品</p>
            </div>
          </div>
        </section>

        <!-- 进行中的订单 -->
        <section class="active-orders" v-if="activeOrders.length > 0">
          <h2 class="section-title">进行中的委托</h2>
          <div class="order-list">
            <div v-for="order in activeOrders" :key="order.id" class="order-card">
              <div class="order-info">
                <img :src="order.artistAvatar" :alt="order.artistName" class="artist-mini-avatar">
                <div class="order-details">
                  <h4>{{ order.title }}</h4>
                  <p class="artist-name">画师：{{ order.artistName }}</p>
                  <span class="order-status" :class="order.status">{{ order.statusText }}</span>
                </div>
              </div>
              <router-link :to="`/orders?order=${order.order_no || order.id}`" class="btn-view">查看详情</router-link>
            </div>
          </div>
        </section>

        <!-- 推荐画师 -->
        <section class="featured-artists">
          <div class="section-header">
            <h2 class="section-title">推荐画师</h2>
            <button class="btn-refresh" @click="refreshArtists">🔄 换一批</button>
          </div>
          <div class="artists-grid">
            <div 
              v-for="artist in featuredArtists" 
              :key="artist.slug" 
              class="artist-card"
              @click="visitArtist(artist.slug)"
            >
              <img :src="artist.avatar" :alt="artist.name" class="artist-avatar">
              <div class="artist-info">
                <h4>{{ artist.name }}</h4>
                <p class="artist-tags">{{ artist.tags }}</p>
                <div class="price-range" v-if="artist.priceMin">
                  ¥{{ artist.priceMin }} 起
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 空状态提示 -->
        <section class="empty-state" v-if="!activeOrders.length">
          <div class="empty-icon">🎨</div>
          <h3>还没有进行中的委托</h3>
          <p>去发现心仪的画师，开始你的第一次约稿吧！</p>
          <button class="btn btn-primary" @click="browseArtists">浏览画师</button>
        </section>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser } from '../utils/auth.js'
import { apiRequest, eventBus } from '../utils/eventBus'
import { IMAGES } from '../config/assets.js'

export default {
  name: 'UserDashboard',
  setup() {
    const router = useRouter()
    
    // 用户信息
    const userName = computed(() => {
      return getCurrentUser()?.nickname || '用户'
    })
    
    // 进行中的订单（占位数据）
    const activeOrders = ref([])
    
    // 推荐画师
    const featuredArtists = ref([])
    
    // 获取进行中的订单
    const fetchActiveOrders = async () => {
      try {
        // TODO: 接入真实 API
        // const data = await apiRequest('/api/v1/me/orders?status=active')
        // activeOrders.value = data.orders || []
        activeOrders.value = [] // 暂时为空
      } catch (error) {
        console.error('获取订单失败:', error)
      }
    }
    
    // 浏览画师（跳转到画师名录页）
    const browseArtists = () => {
      router.push('/artists')
    }
    
    // 访问画师空间
    const visitArtist = (slug) => {
      router.push(`/@${slug}`)
    }
    
    // 获取推荐画师
    const fetchFeaturedArtists = async () => {
      try {
        const data = await apiRequest('/api/v1/site/home', { showError: false })
        if (data?.featured_artists) {
          featuredArtists.value = data.featured_artists.map(artist => ({
            slug: artist.slug || String(artist.uid),
            name: artist.nickname,
            avatar: artist.avatar_url || IMAGES.defaultAvatarSmall,
            tags: Array.isArray(artist.tags) ? artist.tags.join(', ') : (artist.tags || ''),
            priceMin: artist.price_range_min || 0
          }))
        }
      } catch (error) {
        console.error('获取推荐画师失败:', error)
      }
    }

    // 刷新推荐画师
    const refreshArtists = () => {
      eventBus.emit('show-toast', { message: '正在加载更多画师...', type: 'info' })
      fetchFeaturedArtists()
    }
    
    onMounted(() => {
      fetchActiveOrders()
      fetchFeaturedArtists()
    })
    
    return {
      userName,
      activeOrders,
      featuredArtists,
      browseArtists,
      visitArtist,
      refreshArtists,
      fetchFeaturedArtists
    }
  }
}
</script>

<style scoped>
.user-dashboard {
  min-height: 100vh;
  background: var(--bg-light);
}

/* 顶部导航 */
.dashboard-header {
  background: var(--white);
  color: var(--text-dark);
  padding: 64px 40px;
  border-bottom: 1px solid #E5E7EB;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header h1 {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.header-subtitle {
  font-size: 1.1rem;
  color: var(--text-light);
}

/* 主内容区 */
.dashboard-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 20px;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 24px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.action-card {
  background: var(--white);
  border: 1px solid #E5E7EB;
  border-radius: var(--radius);
  padding: 30px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow);
  transition: var(--transition);
  cursor: pointer;
}

.action-card:hover {
  box-shadow: var(--shadow-hover);
}

.action-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.action-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-dark);
}

.action-card p {
  font-size: 0.9rem;
  color: var(--text-light);
}

/* 进行中的订单 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: var(--white);
  border: 1px solid #E5E7EB;
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow);
}

.order-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.artist-mini-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.order-details h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.order-details .artist-name {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-bottom: 8px;
}

.order-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius);
  font-size: 0.8rem;
  font-weight: 500;
}

.order-status.in_progress {
  background: #EFF6FF;
  color: #1D4ED8;
}

.btn-view {
  padding: 10px 20px;
  background: var(--white);
  color: var(--text-dark);
  border: 1px solid var(--text-dark);
  border-radius: var(--radius);
  text-decoration: none;
  transition: var(--transition);
}

.btn-view:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

/* 推荐画师 */
.featured-artists {
  background: var(--white);
  border: 1px solid #E5E7EB;
  border-radius: var(--radius);
  padding: 32px;
  box-shadow: var(--shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.btn-refresh {
  padding: 8px 16px;
  background: var(--white);
  color: var(--text-dark);
  border: 1px solid var(--text-dark);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--transition);
}

.btn-refresh:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.artists-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.artist-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: var(--transition);
}

.artist-card:hover {
  background: #FAFAFA;
}

.artist-card .artist-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.artist-card .artist-info h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.artist-card .artist-tags {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 4px;
}

.artist-card .price-range {
  font-size: 0.9rem;
  color: var(--accent-color);
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--white);
  border: 1px solid #E5E7EB;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-dark);
}

.empty-state p {
  color: var(--text-light);
  margin-bottom: 24px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .artists-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .dashboard-header {
    padding: 40px 20px;
  }
  
  .dashboard-header h1 {
    font-size: 1.8rem;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .artists-grid {
    grid-template-columns: 1fr;
  }
  
  .order-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .btn-view {
    width: 100%;
    text-align: center;
  }
}
</style>
