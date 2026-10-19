# AI 启动说明（给 WorkBuddy/AI 看的，别删）

> 这台电脑每次开机都会重置，node_modules 和 target 会被删除。
> 下次被要求"启动这个项目"时，直接按下面做，不要再重新分析。

## 项目结构

- 本目录（shopping-vue）= Vue 3 + Vite 前端，默认端口 **5173**（被占用自动换 5174）
- `springBootTest/` = Spring Boot 3.4.5 后端，dev 环境端口 **8081**（profile 在 application.properties 里写死 dev）

## 启动方式（二选一）

**首选：直接告诉用户双击脚本**（本目录下，GBK 编码，勿用 UTF-8 重写覆盖）
- `启动项目.bat` = 一键起前后端 | `停止项目.bat` = 停
- `启动后端.bat` / `启动前端.bat` = 单独起

**或者 AI 手动启动（后台任务）：**
```bash
# 后端（必须先 unset 两个环境变量，原因见下）
cd springBootTest && unset SERVER__PORT SERVER__HOST && \
  ./mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"

# 前端（node_modules 不在就先 npm install）
cd shopping-vue && [ -d node_modules ] || npm install
npm run dev
```

## 关键环境事实（已验证，勿再探测）

- 无全局 mvn；用项目自带 `mvnw.cmd`（only-script wrapper，自动用 ~/.m2/wrapper 里的 Maven 3.9.9，没有会自动下载）
- Java 21（Zulu）在 PATH；Node 22 + npm 10 在 PATH；~/.m2/settings.xml 已配阿里云镜像
- **坑**：shell 环境变量 `SERVER__PORT`/`SERVER__HOST` 会被 Spring Boot 当成 server.port/server.host，且对应端口被环境代理占用 → 必须 unset 或显式传 `--server.port=8081`
- 5173 常被上次开机的残留 vite 占用，前端落到 5174 是正常现象

## 已补齐的功能（2026-10-10）

- `ApiUserController.java`：Vue 前端的 REST 接口，已开 `@CrossOrigin`，用户存内存 Map（重启清空）
  - `POST /api/user/register`：register.html 在用；校验邮箱/昵称≥2/密码≥6，重复邮箱返回"该邮箱已注册"
  - `POST /api/user/login`：store.js 在用；已注册账号校验密码，未注册邮箱按演示模式放行（密码≥6 即可）
- `templates/user/main.html`：页面版登录（密码 123）成功后的主页
- 后端带 devtools，改完代码执行 `./mvnw.cmd compile` 即热重启，不用重跑
- **注意**：杀后台任务可能残留 java.exe 占用 8081，重启后端前先查 `netstat -ano | grep ":8081 "` 并 taskkill

## 已知小毛病（不影响启动）

- `application.properties` 引用的 `test`、`book.bookid` 配置不存在，仅影响 `/user/test` 演示接口显示 null
