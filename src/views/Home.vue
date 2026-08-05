<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero-section fade-in" :style="heroStyle">
      <div class="container">
        <div class="hero-content">
          <h1>{{ heroTitle }}</h1>
          <p>{{ heroSubtitle }}</p>
          <div class="hero-actions">
            <router-link :to="heroCta.link" class="btn btn-primary">{{ heroCta.text }}</router-link>
            <router-link to="/artists" class="btn btn-secondary">{{ content.ctaArtists }}</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 平台简介 -->
    <section class="intro-section">
      <div class="container">
        <div class="section-title">
          <h2>{{ content.introTitle }}</h2>
          <p>{{ siteDescription || content.introDesc }}</p>
        </div>
      </div>
    </section>

    <!-- 推荐画师 -->
    <section class="artists-section">
      <div class="container">
        <div class="section-title">
          <h2>{{ featuredArtistsTitle }}</h2>
          <p>{{ content.artistsDesc }}</p>
        </div>
        <div v-if="loading" class="inline-state">{{ content.loading }}</div>
        <div v-else-if="featuredArtists.length" class="artist-grid">
          <router-link
            v-for="artist in featuredArtists"
            :key="artist.uid"
            :to="`/artists/${artist.uid}`"
            class="artist-card"
          >
            <span class="artist-avatar" :style="avatarStyle(artist)">{{ artistInitial(artist) }}</span>
            <span class="artist-info">
              <strong>{{ artist.nickname }}</strong>
              <small>{{ artist.bio || content.artistFallbackBio }}</small>
              <span v-if="artist.tags?.length" class="tag-row">
                <span v-for="tag in artist.tags" :key="tag">{{ tag }}</span>
              </span>
            </span>
            <span class="artist-price">{{ formatPriceRange(artist) }}</span>
          </router-link>
        </div>
        <div v-else class="inline-state">{{ content.noArtists }}</div>
        <div class="section-more">
          <router-link to="/artists" class="more-link">{{ content.viewAllArtists }} →</router-link>
        </div>
      </div>
    </section>

    <!-- 约稿流程 -->
    <section class="process-section">
      <div class="container">
        <div class="section-title">
          <h2>{{ content.processTitle }}</h2>
          <p>{{ content.processDesc }}</p>
        </div>
        <div class="process-grid">
          <div v-for="(step, index) in content.processSteps" :key="index" class="process-card">
            <span class="process-number">{{ index + 1 }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="container">
        <h2>{{ content.ctaTitle }}</h2>
        <p>{{ content.ctaDesc }}</p>
        <div class="cta-actions">
          <router-link to="/artists" class="btn btn-primary">{{ content.ctaArtists }}</router-link>
          <router-link to="/commission" class="btn btn-secondary">{{ content.ctaCommission }}</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS, getAssetUrl } from '../config/api'
import { apiRequest } from '../utils/eventBus'

const HOME_CONTENT = {
  zh: {
    defaultHeroTitle: '找到心仪的画师',
    defaultHeroSubtitle: '专业、高效、安全的约稿体验',
    defaultCtaText: '发起委托',
    ctaArtists: '浏览画师',
    ctaCommission: '发起委托',
    introTitle: '关于平台',
    introDesc: '汇聚认证画师的插画委托平台，公开展示画师作品与档期，让每一次约稿都有迹可循。',
    artistsTitle: '推荐画师',
    artistsDesc: '平台认证画师，点击查看主页、作品与公开排期',
    artistFallbackBio: '已认证画师',
    loading: '加载中...',
    noArtists: '暂无推荐画师',
    viewAllArtists: '查看全部画师',
    processTitle: '约稿流程',
    processDesc: '从挑选画师到交付终稿，每一步都在订单中留痕',
    processSteps: [
      { title: '挑选画师', desc: '浏览画师名录，查看作品墙与公开排期，找到合适的风格与档期' },
      { title: '提交委托', desc: '填写需求、上传参考图，向心仪的画师发起委托申请' },
      { title: '确认与创作', desc: '画师确认需求并报价，双方确认后开始创作并同步进度' },
      { title: '交付完成', desc: '草稿沟通、终稿交付，订单状态全程可追踪' }
    ],
    ctaTitle: '准备好开始了吗？',
    ctaDesc: '浏览画师公开主页，或立即发起一份委托'
  },
  en: {
    defaultHeroTitle: 'Find your artist',
    defaultHeroSubtitle: 'A professional, efficient, and safe commission experience',
    defaultCtaText: 'Start a Commission',
    ctaArtists: 'Browse Artists',
    ctaCommission: 'Start a Commission',
    introTitle: 'About the Platform',
    introDesc: 'An illustration commission platform of verified artists, with public portfolios and schedules so every commission stays traceable.',
    artistsTitle: 'Featured Artists',
    artistsDesc: 'Verified artists — open a profile to see works and public availability',
    artistFallbackBio: 'Verified artist',
    loading: 'Loading...',
    noArtists: 'No featured artists yet',
    viewAllArtists: 'View all artists',
    processTitle: 'How It Works',
    processDesc: 'From picking an artist to final delivery, every step is recorded in the order',
    processSteps: [
      { title: 'Pick an Artist', desc: 'Browse the directory, check portfolios and public schedules, and find the right style and availability' },
      { title: 'Submit a Request', desc: 'Describe your needs, upload references, and send a commission request to your chosen artist' },
      { title: 'Confirm & Create', desc: 'The artist confirms requirements and quotes a price, then creation begins with progress updates' },
      { title: 'Delivery', desc: 'Review drafts, receive the final artwork, and track order status throughout' }
    ],
    ctaTitle: 'Ready to get started?',
    ctaDesc: 'Browse public artist profiles, or start a commission right away'
  }
}

export default {
  name: 'Home',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      loading: false,
      homepage: null,
      siteDescription: '',
      featuredArtists: []
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return HOME_CONTENT[this.locale]
    },
    heroSection() {
      return this.homepage?.hero_section || null
    },
    heroTitle() {
      return this.heroSection?.title || this.content.defaultHeroTitle
    },
    heroSubtitle() {
      return this.heroSection?.subtitle || this.content.defaultHeroSubtitle
    },
    heroCta() {
      const cta = this.heroSection?.cta_button
      return {
        text: cta?.text || this.content.defaultCtaText,
        link: cta?.link || '/artists'
      }
    },
    heroStyle() {
      const bg = getAssetUrl(this.heroSection?.bg_image)
      return bg
        ? { backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.86)), url("${bg.replace(/"/g, '%22')}")` }
        : {}
    },
    featuredArtistsTitle() {
      return this.homepage?.featured_artists?.title || this.content.artistsTitle
    }
  },
  mounted() {
    this.loadHome()
  },
  methods: {
    async loadHome() {
      this.loading = true
      try {
        const data = await apiRequest(API_ENDPOINTS.SITE_HOME, { auth: false, showError: false })
        this.homepage = data?.homepage || null
        this.siteDescription = data?.site_description || ''
        this.featuredArtists = Array.isArray(data?.featured_artists) ? data.featured_artists : []
      } catch {
        this.homepage = null
        this.featuredArtists = []
      } finally {
        this.loading = false
      }
    },
    avatarStyle(artist) {
      const url = getAssetUrl(artist.avatar_url)
      return url ? { backgroundImage: `url("${url.replace(/"/g, '%22')}")` } : {}
    },
    artistInitial(artist) {
      return String(artist.nickname || 'A').slice(0, 1).toUpperCase()
    },
    formatPriceRange(artist) {
      if (!artist.price_range_min && !artist.price_range_max) return this.locale === 'zh' ? '价格面议' : 'Ask for quote'
      const min = Math.round((artist.price_range_min || 0) / 100)
      const max = Math.round((artist.price_range_max || artist.price_range_min || 0) / 100)
      return `¥${min}-${max}`
    }
  }
}
</script>

<style scoped>
/* Hero */
.hero-section {
  padding: 120px 0;
  background: var(--white);
  background-size: cover;
  background-position: center;
  color: var(--text-dark);
}

.hero-content {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}

.hero-content h1 {
  font-size: 2.8rem;
  margin-bottom: 16px;
}

.hero-content p {
  font-size: 1.15rem;
  color: var(--text-light);
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.section-title {
  text-align: center;
  margin-bottom: 48px;
}

.section-title h2 {
  font-size: 2rem;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.section-title p {
  color: var(--text-light);
  max-width: 640px;
  margin: 0 auto;
}

.intro-section {
  padding: 64px 0;
}

/* 推荐画师 */
.artists-section {
  padding: 64px 0;
}

.inline-state {
  padding: 28px;
  text-align: center;
  color: var(--text-light);
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.artist-card {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 20px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  text-decoration: none;
  transition: var(--transition), box-shadow 0.3s ease;
}

.artist-card:hover {
  box-shadow: var(--shadow-hover);
}

.artist-avatar {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  background: #F5F5F5 center/cover no-repeat;
  color: var(--text-muted);
  font-size: 1.25rem;
  font-weight: 700;
  border-radius: 50%;
}

.artist-info {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.artist-info strong {
  color: var(--text-dark);
}

.artist-info small {
  color: var(--text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-price {
  grid-column: 2;
  color: var(--text-dark);
  font-weight: 600;
  font-size: 0.9rem;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-row span {
  padding: 2px 8px;
  background: #F5F5F5;
  color: var(--text-light);
  font-size: 0.75rem;
  border-radius: var(--radius);
}

.section-more {
  text-align: center;
  margin-top: 32px;
}

.more-link {
  color: var(--text-dark);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}

.more-link:hover {
  color: var(--accent-color);
}

/* 约稿流程 */
.process-section {
  padding: 64px 0;
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}

.process-card {
  padding: 28px 24px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.process-number {
  display: block;
  margin-bottom: 12px;
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-dark);
}

.process-card h3 {
  margin-bottom: 8px;
  color: var(--text-dark);
  font-size: 1.1rem;
}

.process-card p {
  color: var(--text-light);
  font-size: 0.92rem;
  line-height: 1.7;
}

/* CTA */
.cta-section {
  padding: 96px 0;
  text-align: center;
}

.cta-section h2 {
  font-size: 2rem;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.cta-section p {
  color: var(--text-light);
  margin-bottom: 32px;
}

.cta-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .hero-section { padding: 72px 0; }
  .hero-content h1 { font-size: 2rem; }
  .section-title h2 { font-size: 1.5rem; }
  .intro-section,
  .artists-section,
  .process-section { padding: 48px 0; }
  .artist-grid { grid-template-columns: 1fr; }
  .cta-section { padding: 64px 0; }
}
</style>
