<template>
  <div class="toast" :class="[type, { show: visible }]">
    {{ message }}
  </div>
</template>

<script>
import { eventBus } from '../utils/eventBus'

export default {
  name: 'Toast',
  data() {
    return {
      visible: false,
      message: '',
      type: 'info',
      timer: null
    }
  },
  mounted() {
    eventBus.on('show-toast', this.show)
  },
  beforeUnmount() {
    eventBus.off('show-toast', this.show)
    clearTimeout(this.timer)
  },
  methods: {
    show({ message, type = 'info' }) {
      this.message = message
      this.type = type
      this.visible = true
      
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.visible = false
      }, 3000)
    }
  }
}
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--text-dark);
  color: var(--white);
  padding: 15px 30px;
  border-radius: var(--radius);
  z-index: 4000;
  opacity: 0;
  transition: all 0.3s ease;
}

.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.toast.success { background: #27ae60; }
.toast.error { background: #e74c3c; }
</style>
