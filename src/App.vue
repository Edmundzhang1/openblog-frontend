<template>
  <div id="app">
    <Navbar />
    <!--
      不包 <transition>：空间布局等含嵌套 router-view/条件分支的组件会让
      out-in 过渡的离场阶段无法正常完成，导致目标页空白。
      页面级淡入由各视图的 .fade-in 类承担。
    -->
    <router-view />
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
/* 路由切换：缓慢淡入（600ms，遵循极简设计规范） */
.fade-enter-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-leave-to {
  opacity: 0;
}
</style>
