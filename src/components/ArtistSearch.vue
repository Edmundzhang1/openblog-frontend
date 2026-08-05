<template>
  <!-- 搜索画师模块：按昵称/标签搜索，点击卡片直达画师空间 -->
  <section class="artist-search">
    <h2 class="section-title">搜索画师</h2>
    <form class="search-bar" @submit.prevent="searchArtists">
      <input
        v-model.trim="searchKeyword"
        type="search"
        class="search-input"
        placeholder="按昵称或标签搜索，如：头像、日系、立绘"
        maxlength="50"
      >
      <button type="submit" class="btn btn-primary" :disabled="searching">
        {{ searching ? '搜索中...' : '搜索' }}
      </button>
    </form>
    <div v-if="searched" class="search-results">
      <p v-if="searchResults.length === 0" class="search-empty">没有找到匹配的画师，换个关键词试试</p>
      <div v-else class="artists-grid">
        <div
          v-for="artist in searchResults"
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
    </div>
  </section>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest } from '../utils/eventBus'
import { IMAGES } from '../config/assets.js'

export default {
  name: 'ArtistSearch',
  setup() {
    const router = useRouter()
    const searchKeyword = ref('')
    const searchResults = ref([])
    const searching = ref(false)
    const searched = ref(false)

    const searchArtists = async () => {
      const keyword = searchKeyword.value
      if (!keyword) {
        searched.value = false
        searchResults.value = []
        return
      }
      searching.value = true
      try {
        const res = await apiRequest(`/api/v1/artists?keyword=${encodeURIComponent(keyword)}&page_size=20`, { showError: false, unwrap: false })
        const list = res?.data?.list || []
        searchResults.value = list.map(artist => ({
          slug: artist.slug || String(artist.uid),
          name: artist.nickname,
          avatar: artist.avatar_url || IMAGES.defaultAvatarSmall,
          tags: Array.isArray(artist.tags) ? artist.tags.join(', ') : (artist.tags || artist.artist_tags || ''),
          priceMin: (artist.price_range_min || 0) / 100
        }))
        searched.value = true
      } catch (error) {
        console.error('搜索画师失败:', error)
        searchResults.value = []
        searched.value = true
      } finally {
        searching.value = false
      }
    }

    const visitArtist = (slug) => {
      router.push(`/@${slug}`)
    }

    return { searchKeyword, searchResults, searching, searched, searchArtists, visitArtist }
  }
}
</script>

<style scoped>
.artist-search {
  margin-bottom: 64px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: 32px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E5E5E5;
  border-radius: var(--radius);
  font-size: 1rem;
  font-family: inherit;
  transition: var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-empty {
  color: var(--text-light);
  text-align: center;
  padding: 32px 0;
}

.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.artist-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: var(--transition);
  text-align: center;
}

.artist-card:hover {
  box-shadow: var(--shadow-hover);
}

.artist-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
}

.artist-info h4 {
  font-size: 1rem;
  margin-bottom: 6px;
}

.artist-tags {
  color: var(--text-light);
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.price-range {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
