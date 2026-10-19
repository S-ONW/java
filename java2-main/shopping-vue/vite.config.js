import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync } from 'node:fs'

// 使用相对路径 base，便于直接双击打开构建产物（file://）或通过任意子路径部署
export default defineConfig({
  plugins: [
    vue(),
    // 构建时把独立注册页 register.html 复制进 dist，保证部署后 /register.html 可访问
    {
      name: 'copy-register-html',
      apply: 'build',
      closeBundle() {
        copyFileSync('register.html', 'dist/register.html')
      },
    },
  ],
  base: './',
  server: {
    open: true,
    port: 5173
  }
})
