@echo off
chcp 936 >nul
rem ============================================
rem  启动 Vue 前端（默认 5173，被占用自动换 5174）
rem  node_modules 被删除时会先自动 npm install
rem ============================================
cd /d "%~dp0"

if not exist node_modules (
  echo 未检测到 node_modules，正在安装前端依赖，请稍候...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络后重试
    pause
    exit /b 1
  )
)

echo 正在启动前端 http://localhost:5173 ...
npm run dev
pause
