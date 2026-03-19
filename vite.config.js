import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// ============================================
// OpenBlog 前端配置文件
// ============================================

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = process.env
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
  const devPort = parseInt(env.VITE_DEV_PORT) || 3000

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: devPort,
      strictPort: true,
      // 代理配置
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true
        },
        '/uploads': {
          target: apiBaseUrl,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    define: {
      // 将 API 基础地址注入到应用中
      __API_BASE_URL__: JSON.stringify(apiBaseUrl)
    }
  }
})
