<template>
  <div id="app">
    <Navbar />
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <Footer />
    <Lightbox />
    <Toast />
    <transition name="preview-dock">
      <div v-if="isPreviewMode && route.path !== '/'" class="preview-exit-dock">
        <div class="preview-exit-panel">
          <span class="preview-exit-label">预览模式</span>
          <button class="btn btn-primary preview-exit-btn" @click="exitPreview">
            退出预览
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import Lightbox from './components/Lightbox.vue'
import Toast from './components/Toast.vue'
import { useRoute, useRouter } from 'vue-router'
import { exitPreviewMode, isPreviewModeActive } from './utils/personalization.js'
import { showToast } from './utils/eventBus.js'

export default {
  name: 'App',
  components: {
    Navbar,
    Footer,
    Lightbox,
    Toast
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const isPreviewMode = ref(isPreviewModeActive())
    const syncPreviewMode = () => {
      isPreviewMode.value = isPreviewModeActive()
    }

    const handlePreviewModeChange = (event) => {
      isPreviewMode.value = Boolean(event.detail?.active)
    }

    const exitPreview = async () => {
      const onPersonalizationPage = router.currentRoute.value.path === '/personalization'

      exitPreviewMode({
        emitChange: !onPersonalizationPage
      })

      if (!onPersonalizationPage) {
        await router.push({
          path: '/personalization',
          query: { from: 'preview' }
        })
      }

      showToast('已退出预览模式', 'success')
    }

    onMounted(() => {
      syncPreviewMode()
      window.addEventListener('personalization-preview-changed', handlePreviewModeChange)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('personalization-preview-changed', handlePreviewModeChange)
    })

    watch(
      () => route.fullPath,
      () => {
        syncPreviewMode()
      }
    )

    return {
      isPreviewMode,
      route,
      exitPreview
    }
  }
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.preview-dock-enter-active,
.preview-dock-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.preview-dock-enter-from,
.preview-dock-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

.preview-exit-dock {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 5000;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.preview-exit-panel {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.94), rgba(31, 41, 55, 0.92));
  color: #fff;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.preview-exit-label {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.preview-exit-btn {
  min-width: 168px;
  box-shadow: none;
}

@media (max-width: 768px) {
  .preview-exit-dock {
    left: 16px;
    right: 16px;
    bottom: 16px;
    transform: none;
  }

  .preview-exit-panel {
    width: 100%;
    justify-content: space-between;
    border-radius: 20px;
  }

  .preview-exit-btn {
    min-width: 0;
  }
}
</style>
