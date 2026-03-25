import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './assets/css/style.css'
import { initPersonalization } from './utils/personalization.js'

// 初始化个性化设置
initPersonalization()

const app = createApp(App)

// 使用插件
app.use(router)
app.use(i18n)

app.mount('#app')
