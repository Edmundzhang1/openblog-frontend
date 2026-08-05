import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8080'
  const configuredPort = Number.parseInt(env.VITE_DEV_PORT, 10)
  const devPort = Number.isInteger(configuredPort) ? configuredPort : 3000

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0',
      port: devPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // WebSocket 升级支持（/api/v1/ws 实时聊天）
          ws: true,
          // 透传原始 Host，后端 WebSocket 同源校验依赖 X-Forwarded-Host
          xfwd: true,
          // 路径重写：将 /api/xxx 重写成 /api/v1/xxx（如果前端请求不带 /v1）
          rewrite: (path) => {
            // 如果路径已经是 /api/v1/xxx，保持不变
            if (path.startsWith('/api/v1/')) return path
            // 否则添加 /v1 前缀
            return path.replace(/^\/api\//, '/api/v1/')
          }
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  }
})
