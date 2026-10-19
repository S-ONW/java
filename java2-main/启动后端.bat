@echo off
chcp 936 >nul
rem ============================================
rem  启动 Spring Boot 后端（端口 8081）
rem  不需要 target 文件夹，mvnw 会自动重新编译
rem ============================================
cd /d "%~dp0springBootTest"

rem 屏蔽环境里残留的 SERVER__PORT / SERVER__HOST，
rem 否则 Spring Boot 会把它当成 server.port，去抢一个被占用的随机端口导致启动失败
set SERVER__PORT=
set SERVER__HOST=

echo 正在启动后端 http://localhost:8081 ...
call mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
pause
