<template>
  <div class="lightbox" :class="{ active: isOpen }" @click="close">
    <span class="lightbox-close">&times;</span>
    <img :src="imageSrc" :alt="altText" @click.stop>
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
      imageSrc: ''
    }
  },
  mounted() {
    eventBus.on('open-lightbox', this.open)
  },
  beforeUnmount() {
    eventBus.off('open-lightbox', this.open)
  },
  methods: {
    open(src) {
      this.imageSrc = src
      this.isOpen = true
      document.body.style.overflow = 'hidden'
    },
    close() {
      this.isOpen = false
      document.body.style.overflow = ''
    }
  },
  computed: {
    altText() {
      return this.i18n.getLocale() === 'zh' ? '大图预览' : 'Image Preview'
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
  background: rgba(0,0,0,0.9);
  z-index: 3000;
  align-items: center;
  justify-content: center;
}

.lightbox.active {
  display: flex;
}

.lightbox img {
  max-width: 90%;
  max-height: 90%;
  border-radius: var(--radius);
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 30px;
  color: var(--white);
  font-size: 2.5rem;
  cursor: pointer;
  transition: var(--transition);
}

.lightbox-close:hover {
  transform: scale(1.1);
}
</style>
