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
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import Lightbox from './components/Lightbox.vue'
import Toast from './components/Toast.vue'

export default {
  name: 'App',
  components: {
    Navbar,
    Footer,
    Lightbox,
    Toast
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
</style>
