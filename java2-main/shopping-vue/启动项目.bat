@echo off
chcp 936 >nul
rem ============================================
rem  一键启动：后端(8081) + 前端(5173)
rem  各开一个独立窗口，关闭对应窗口即停止对应服务
rem ============================================
cd /d "%~dp0"

echo 启动后端...
start "SpringBoot后端-8081" "%~dp0启动后端.bat"

echo 启动前端...
start "Vue前端-5173" "%~dp0启动前端.bat"

echo.
echo 两个服务已在新窗口中启动：
echo   后端  http://localhost:8081
echo   前端  http://localhost:5173 （若被占用会自动换 5174）
echo.
pause
