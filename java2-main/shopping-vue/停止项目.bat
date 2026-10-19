@echo off
chcp 936 >nul
rem ============================================
rem  停止项目：结束后端(8081)和前端(5173/5174)
rem ============================================
setlocal

for %%P in (8081 5173 5174) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr /C:":%%P " ^| findstr LISTENING') do (
    echo 正在停止占用 %%P 端口的进程 PID=%%a
    taskkill /F /PID %%a >nul 2>&1
  )
)

echo.
echo 已停止全部服务。
pause
