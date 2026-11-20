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

## 用户权限约定（2026-11-06 起）

- `user` 表新增 `permission` 字段：`1` = 默认权限（注册用户），`0` = 管理员权限。
- **密码明文存储、明文比对**，没有任何 MD5 / 加密；注册接口不接受客户端传的 permission，一律写 1。
- 首页「⚙️ 后台管理」按钮只对 `permission = 0` 的登录用户可见（AppHeader 用 `isAdminUser`）。
- 后台登录 `/api/admin/login` 不再读 `application-dev.properties` 的 admin 账号，改为查 `user` 表：
  密码正确且 `permission = 0` 才发 token；权限 1 返回 403。`AdminService.check()` 每次还会重读库复核权限。
- 内置管理员：`admin@shop.local` / 昵称 `admin` / 明文密码 `admin123` / permission 0（`sql/shop.sql`）。
  演示普通用户：`demo@qq.com` / 昵称 演示用户 / 明文密码 `123456` / permission 1。
- 老账号的 MD5('123456') 在 `db/schema.sql` 里自动还原成明文 `123456`；其他自定义密码需手动 UPDATE。
- 前端 store.js 用 `store.user.permission`（登录接口返回）判断权限；**旧 localStorage 登录态没有该字段，
  表现为看不到后台按钮，重新登录一次即可**。
- 改动前端后依旧必须 `npm run build` 并把 dist 同步到 `src/main/resources/static` 与 `target/classes/static` 两处。

## 优惠券约定（2026-11-11 起，2026-11-18 改版）

- 优惠券池已**从「前端写死」改为「数据库 coupon 表」**：`coupon` 表存券池
  （code / title / descp / type / val / min_amount / **source**），
  `user_coupon` 表仍只存「谁领了哪张券」（user_email + coupon_code，唯一约束防重复领取）。
- **2026-11-18 起领券中心没有「一键领取」的券了**，券只能靠扫雷小游戏发：
  | 券码 | 条件 | 面值 | 说明 |
  |---|---|---|---|
  | `MINE2` | 连续 2 次安全点击都没踩雷 | ¥3 无门槛 | 小额 |
  | `MINE5` | 连续 5 次安全点击都没踩雷 | ¥8 无门槛 | 稍大额 |
  | `MINEWIN` | 通关（翻开全部安全格） | ¥20 无门槛 | 大额 |
  档位配置在 `src/data.js` 的 `MINE_TIERS`，游戏 `MineGame.vue` 与领券中心 `CouponView.vue` 都读它，改档位只改一处。
  **次数只算用户亲手点下去的格子**：插旗不算、点已翻开的格不算、踩雷那一下不计、空白格自动扩散翻开的也不计
  （一次点击最多 +1，哪怕扩散开了几十格）。
- **扫雷专属券不能直接领取**：`coupon.source` = `mine` 表示只能扫雷发奖（`claim` = 页面可直接领，默认值）。
  - 后端 `POST /api/coupon/claim` 多了 `source` 字段：券是 `mine` 且请求来源不是 `mine` / `admin` 时直接 409 拒绝，
    所以绕过界面直接调接口也领不到；`admin/grant`（后台发放）走 `admin` 来源，可以补发给指定用户。
  - 前端 `claimCoupon(code, source)` 同样会拦（券池 `source` + 本地 `MINE_TIERS` 双保险，后端老版本不返回 source 也拦得住）。
  - 后台「优惠券管理」表格多一列「获取方式」，表单里可切换「页面可直接领取 / 仅扫雷闯关发放」。
- **新人专享大额券 `NEWBIE50`（¥50 无门槛，`coupon.source = newbie`）**：
  - 「是不是新人」看 `user.newbie` 字段（`1` = 新注册还没领新人礼，`0` = 老用户 / 已领）。
    注册接口落 1；老库建列时默认 0，所以升级不会把老用户误判成新人。
  - 登录成功后 `App.vue` 监听登录态，延迟 600ms 调 `offerNewbieCoupon()`：
    券池里有 `newbie` 券 + `user.newbie = 1` + 没领过 + 这个账号没看过弹窗（本地标记
    `shopNewbieShown_<email>`）→ 弹 `NewbieCouponModal.vue`。
  - 点「立即领取」→ `claimCoupon(code, 'newbie')`；后端 `POST /api/coupon/claim` 会校验
    `user.newbie = 1`，不满足直接 409；领成功后把 `user.newbie` 置 0，之后登录不再弹。
  - 点「暂不需要」只记本地标记，**不消耗资格**：领券中心 `CouponView.vue` 顶部仍会显示这张券
    和「立即领取」按钮（`store.newbieState()` 判断）。老用户（`newbie = 0` 且未领）看不到这张卡，
    避免出现点不动的死按钮。
  - 后台「获取方式」新增「新人专享（仅新注册账号可领）」选项；管理员发放走 `admin` 来源，不受新人限制。
- 旧券 `SAVE20 / WELCOME10 / VIP30 / SAVE50 / FREE5 / PCT30` 已下线：
  `db/data.sql` 里用 `DELETE` 清掉券池行**和**对应的 `user_coupon` 领取记录（`user_coupon` 表可能不存在，
  所以用 information_schema + `PREPARE/EXECUTE` 守卫）；`sql/shop.sql` 的 dump 已同步成只留三张新券。
  `data.js` 的 `COUPONS`（SAVE20 等旧码兜底）已删除，`couponInfo()` 现在只认券池。
- 建表 + 种子数据在 `db/schema.sql`（`CREATE TABLE IF NOT EXISTS coupon`、`user.newbie` 的幂等 ALTER）与
  `db/data.sql`（`INSERT IGNORE` 四张券：三张扫雷券 + 一张新人券），应用启动自动执行；
  另外 `sql/shop.sql` 里也有完整的 DROP/CREATE/INSERT dump。
  `db/schema.sql` 空库/已有库都能直接跑：券池建表放在 user 升级段之前，user 相关的 UPDATE/INSERT 都用
  `PREPARE/EXECUTE` + `@user_tbl_exists` 守卫，空库不会中途报错中断。
- `type = pct` 时 **val 是「减免比例」**：`0.2` = 减 20% = **8 折**（结算按 `小计 × val` 抵扣）；
  `type = fix` 时 val 是立减金额。`min_amount` = 使用门槛（订单小计 ≥ 该值才可用，0 = 无门槛）。
  前端 `amount`（如「8 折」「¥30」）与 `cond`（如「满 199 可用」）都是按 type/val/min 推导出来的展示文案，不入库。
- 接口：`GET /api/coupon/pool`（公开，券池）、`POST /api/coupon/claim`、`GET /api/coupon/list?email=`；
  后台 `POST /api/coupon/admin/save`、`DELETE /api/coupon/admin/delete?code=`、`GET /api/coupon/admin/stats`（每张券领取人数）、
  `POST /api/coupon/admin/grant`、`DELETE /api/coupon/admin/remove?email=&code=`（后台接口都要 `X-Admin-Token`）。
- 前端：`store.couponPool` 是唯一数据源（领券中心 / 结算抵扣 / 后台优惠券管理共用），
  启动时 `loadCouponPool()` 从 `/api/coupon/pool` 同步；后端不可用时回退 `data.js` 的 `COUPON_POOL`
  与 localStorage（离线模式仍可增删改券，但只存在浏览器本地）。
- 发券统一走 `claimCoupon(code, source)`（前端已经先判 `myCoupons` 是否含该码，不会重复调接口刷提示）；
  未登录时游戏不调接口，只提示「登录后自动补发」，登录后由 `MineGame` 的 `watch(store.user)` 把已达成的档位补发一次。
- 兑换/抵扣逻辑不变：`couponDisc(小计, code)`，门槛不满足返回 0。

## 品牌名（2026-11-11 起：逸如反掌商城）

- 品牌名唯一数据源是 `src/brand.js`：`BRAND = '逸如反掌'`，`SHOP_NAME = BRAND + '商城'`。
  头部 alt、页脚标题与版权、登录页 / 注册页 / 注册弹窗、后台登录页与后台标题全部读这两个常量，**改名只改这一行**。
- 例外（静态 HTML，不经过 Vue，需手动同步）：`index.html` 与 `register.html` 的 `<title>`，
  以及 `register.html` 里 `.brand` 的 `<span class="logo">`。
  改完必须 `vite build` 再同步 dist 到 `springBootTest/{src/main/resources,target/classes}/static`，
  否则页面上是新的、浏览器标签页还是旧的。
- 历史名：云购商城 → 萧逸商城 → 逸如反掌商城（旧的「云购 / ShopCloud」只出现在历史记忆与 git 历史里，代码已无残留）。
- Logo 是 `src/assets/logo.png` 图片（卡通头像，不含文字），改名不需要动它。
  原图 `logo.jpg` 是纯白底，直接放进深色头图里会露出一个白方块；现已抠成透明 PNG（沿用 mascot 的贴纸风格），
  `style.css` 里 `.logo .logo-img` 用 `drop-shadow` 出投影，暗色主题再叠一层淡蓝冷光晕，和 `.mascot` 的处理保持一致。
  `logo.jpg` 只作为原图留档，代码不再引用。

## 吉祥物表情包（2026-11-11 起）

来源是一张 5 连拍小头像图（522×138，白底），已按比例切成 5 张透明 PNG，放在
`src/assets/mascot/`，画布统一 158×158（79×79 的 2 倍，给高分屏），字符底部对齐：

| 文件 | 表情 | 用在哪 |
|---|---|---|
| `calm.png` | 平静 / 等待 | 购物车空、订单抽屉空、订单页空、结算页空车 |
| `dizzy.png` | 圈圈眼 / 找不到 | 首页搜索/筛选无结果 |
| `happy.png` | 闭眼微笑 | 收藏夹空、登录页侧栏 |
| `wow.png` | 睁大眼惊讶 | 注册页侧栏 |
| `laugh.png` | 眯眼大笑 | 下单成功弹窗（替代原来的 ✅） |

- 全局样式在 `src/style.css` 的 `.mascot`：默认 88px、`.sm` 68px（抽屉里用）、`.lg` 108px（弹窗/侧栏用）。
- 暗色主题下深色头发贴深色卡片会糊，`[data-theme="dark"] .mascot` 加了一层很淡的冷光晕 + 外发光，
  这是有意为之，别当冗余样式删掉。
- 换素材时**必须保留透明通道和统一画布**，否则一排小人在不同页面大小/基线会不一致。
  抠图不能按「离白色多远」算 alpha（浅色皮肤会被当成半透明，放到深色底上整张脸发黑）：
  正确做法是从四边洪水填充出外部背景，只在边界一圈做去白反解。

## 已知小毛病（不影响启动）

- `application.properties` 引用的 `test`、`book.bookid` 配置不存在，仅影响 `/user/test` 演示接口显示 null
