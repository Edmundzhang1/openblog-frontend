<template>
  <div
    v-if="isOpen"
    class="lightbox active"
    role="dialog"
    aria-modal="true"
    :aria-label="altText"
    @click="close"
  >
    <button class="lightbox-close" type="button" :aria-label="closeLabel" @click.stop="close">&times;</button>
    <img v-if="imageSrc" :src="imageSrc" :alt="altText" @click.stop>
  </div>
</template>

<script>
import { inject } from 'vue'
import { eventBus } from '../utils/eventBus'

export default {
  name: 'Lightbox',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      isOpen: false,
      imageSrc: '',
      previousBodyOverflow: ''
    }
  },
  mounted() {
    eventBus.on('open-lightbox', this.open)
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount() {
    eventBus.off('open-lightbox', this.open)
    window.removeEventListener('keydown', this.handleKeydown)
    this.restoreBodyScroll()
  },
  methods: {
    open(src) {
      if (typeof src !== 'string' || !src.trim()) return
      if (!this.isOpen) this.previousBodyOverflow = document.body.style.overflow
      this.imageSrc = src
      this.isOpen = true
      document.body.style.overflow = 'hidden'
    },
    close() {
      this.isOpen = false
      this.imageSrc = ''
      this.restoreBodyScroll()
    },
    restoreBodyScroll() {
      document.body.style.overflow = this.previousBodyOverflow
      this.previousBodyOverflow = ''
    },
    handleKeydown(event) {
      if (event.key === 'Escape' && this.isOpen) this.close()
    }
  },
  computed: {
    altText() {
      return this.i18n.getLocale() === 'zh' ? '大图预览' : 'Image Preview'
    },
    closeLabel() {
      return this.i18n.getLocale() === 'zh' ? '关闭预览' : 'Close preview'
    }
  }
}
</script>

<style scoped>
.lightbox {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  z-index: 3000;
  align-items: center;
  justify-content: center;
}

.lightbox.active {
  display: flex;
  animation: fade-in 0.6s ease both;
}

.lightbox img {
  max-width: 90%;
  max-height: 90%;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 30px;
  color: var(--text-dark);
  font-size: 2.5rem;
  line-height: 1;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: var(--transition);
}

.lightbox-close:hover {
  color: var(--accent-color);
}
</style>
