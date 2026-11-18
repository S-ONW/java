<template>
  <section class="mg">
    <!-- 标题区 -->
    <header class="mg-head">
      <div class="mg-title">
        <p class="mg-kicker">Mini Game · 扫雷赢券</p>
        <h2>扫雷闯关</h2>
        <p class="mg-sub">
          点格子排雷，把 {{ grid.rows * grid.cols - grid.mines }} 个安全格全部翻开即通关。
          连点 2 次、连点 5 次、通关，各解锁一张无门槛券，达成即刻发到「我的优惠券」。
        </p>
      </div>
      <div class="mg-levels">
        <button
          v-for="(g, key) in GRIDS"
          :key="key"
          class="mg-lv"
          :class="{ on: level === key }"
          @click="setLevel(key)"
        >{{ g.name }}</button>
      </div>
    </header>

    <div class="mg-main">
      <!-- 左：棋盘 -->
      <div class="mg-left">
        <div class="mg-bar">
          <div class="mg-stat"><span class="mg-ico">💣</span><b>{{ minesLeft }}</b><small>剩余雷数</small></div>
          <div class="mg-stat"><span class="mg-ico">⏱</span><b>{{ timeText }}</b><small>用时</small></div>
          <div class="mg-stat"><span class="mg-ico">🚩</span><b>{{ flagCount }}</b><small>已标记</small></div>
        </div>

        <div class="mg-board-wrap">
          <div class="mg-stage">
            <div class="mg-board" :style="{ '--cols': grid.cols }" @contextmenu.prevent>
              <button
                v-for="(c, i) in cells"
                :key="i"
                type="button"
                class="mg-cell"
                :class="cellClass(c)"
                :disabled="over || c.open"
                :aria-label="'第 ' + (i + 1) + ' 格'"
                @click="onCell(i)"
                @contextmenu.prevent="onFlag(i)"
              >
                <template v-if="c.open">
                  <span v-if="c.mine">{{ c.boom ? '💥' : '💣' }}</span>
                  <span v-else-if="c.adj">{{ c.adj }}</span>
                </template>
                <span v-else-if="c.flag">🚩</span>
              </button>
            </div>

            <!-- 开局提示：点一下就开始 -->
            <div v-if="!started && !over" class="mg-mask soft">
              <div class="mg-hint">
                <p>点第一格开始 · 首点必安全</p>
                <small>电脑上右键插旗<br />手机上先开「标记模式」</small>
              </div>
            </div>

            <!-- 结算 -->
            <div v-if="over" class="mg-mask">
              <div class="mg-result">
                <p class="mg-r-emoji">{{ win ? '🎉' : '💥' }}</p>
                <h3>{{ win ? '通关！' : '踩到雷了' }}</h3>
                <p class="mg-r-tip">{{ rewardText || (win ? '正在发放奖励…' : '再来一局，这次记一下数字哦') }}</p>
                <p class="mg-r-meta">{{ grid.name }} · {{ timeText }} · 翻开 {{ openedCount }}/{{ grid.rows * grid.cols - grid.mines }}</p>
                <div class="mg-r-ops">
                  <button v-if="needLogin" class="mg-btn primary" @click="loginNow">去登录领奖</button>
                  <button class="mg-btn primary" @click="reset">{{ win ? '再来一局' : '重新挑战' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mg-ops">
          <button class="mg-btn" :class="{ on: flagMode }" @click="flagMode = !flagMode">
            {{ flagMode ? '🚩 标记中' : '🚩 标记模式' }}
          </button>
          <button class="mg-btn primary" @click="reset">↻ 重新开始</button>
        </div>
      </div>

      <!-- 右：奖励与玩法 -->
      <aside class="mg-side">
        <div class="mg-prize">
          <p class="mg-side-k">闯关奖励 · 全部无门槛</p>
          <ul class="mg-tier-list">
            <li
              v-for="t in tiers"
              :key="t.code"
              class="mg-tier"
              :class="{ got: owned(t.code), reached: t.need && clicks >= t.need && !owned(t.code) }"
            >
              <span class="mg-tier-amt">{{ t.coupon ? t.coupon.amount : '—' }}</span>
              <span class="mg-tier-bd">
                <b>{{ t.coupon ? t.coupon.title : '券池待补' }}</b>
                <small>{{ t.label }}{{ t.coupon ? ' · ' + t.coupon.cond : '' }}</small>
              </span>
              <span class="mg-tier-st">{{ tierState(t) }}</span>
            </li>
          </ul>

          <p v-if="notice" class="mg-unlock">🎉 {{ notice }}</p>
          <p v-if="!over" class="mg-progress">
            本局已安全点击 <b>{{ clicks }}</b> 次<template v-if="nextNeed"> · 再点 {{ nextNeed }} 次还有券</template>
          </p>
          <p v-if="!store.user" class="mg-login-tip">
            还没登录，奖励先记着 ——
            <button class="mg-link" @click="loginNow">登录后自动补发</button>
          </p>
          <p class="mg-prize-tip">{{ sideTip }}</p>
        </div>

        <div class="mg-rules">
          <p class="mg-side-k">怎么玩</p>
          <ol>
            <li>第一次点开的格子一定安全，雷在首点之后才埋。</li>
            <li>数字表示它周围八格里埋了几颗雷。</li>
            <li>右键（或开「标记模式」后点击）插旗，标记你认定的雷。</li>
            <li>连点 2 次不踩雷得小额券，连点 5 次得中额券，通关再得大额券。</li>
            <li>只算你自己点下去的格子，空白格自动扩散翻开的那些不计入次数。</li>
            <li>踩雷本局结束，点击次数清零，重新开局再来一次。</li>
          </ol>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { store, claimCoupon, openAuth } from '../store.js'
import { MINE_TIERS } from '../data.js'

// ---------- 难度：格子太大不好玩，太大又放不下，就这两档 ----------
const GRIDS = {
  easy: { name: '初级', rows: 9, cols: 9, mines: 10 },
  hard: { name: '进阶', rows: 12, cols: 12, mines: 24 },
}
const level = ref('easy')
const grid = computed(() => GRIDS[level.value])

// ---------- 棋盘状态 ----------
const cells = ref([])        // { mine, adj, open, flag, boom }
const started = ref(false)   // 是否已点开第一格（雷在首点之后才埋）
const over = ref(false)
const win = ref(false)
const time = ref(0)
const flagMode = ref(false)  // 手机上没有右键，用一个开关切换「点=插旗」
const rewardText = ref('')
const needLogin = ref(false)
const clicks = ref(0)        // 本局「安全点击」次数：只算亲手点的格子，扩散翻开的不算，插旗 / 踩雷也不计
const notice = ref('')       // 局中解锁提示（连点 2 次 / 5 次时弹一行）
let timer = null

const flagCount = computed(() => cells.value.filter((c) => c.flag).length)
const minesLeft = computed(() => Math.max(0, grid.value.mines - flagCount.value))
const openedCount = computed(() => cells.value.filter((c) => c.open && !c.mine).length)
const timeText = computed(() => {
  const m = Math.floor(time.value / 60)
  const s = time.value % 60
  return m ? m + ':' + String(s).padStart(2, '0') : s + 's'
})

function build() {
  const n = grid.value.rows * grid.value.cols
  cells.value = Array.from({ length: n }, () => ({ mine: false, adj: 0, open: false, flag: false, boom: false }))
}

function reset() {
  stopTimer()
  started.value = false
  over.value = false
  win.value = false
  time.value = 0
  flagMode.value = false
  rewardText.value = ''
  needLogin.value = false
  clicks.value = 0
  notice.value = ''
  build()
}

function setLevel(k) {
  if (level.value === k) return
  level.value = k
  reset()
}

// ---------- 相邻格 ----------
function eachAdj(i, fn) {
  const { rows, cols } = grid.value
  const r = Math.floor(i / cols)
  const c = i % cols
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      fn(nr * cols + nc)
    }
  }
}

// 首点之后再埋雷，并且把首点及其周围八格排除掉，保证第一下不会直接炸
function placeMines(safe) {
  const total = grid.value.rows * grid.value.cols
  const banned = new Set([safe])
  eachAdj(safe, (j) => banned.add(j))
  let pool = []
  for (let i = 0; i < total; i++) if (!banned.has(i)) pool.push(i)
  // 极端情况（可用格比雷还少）时退回只排除首点格
  if (pool.length < grid.value.mines) {
    pool = []
    for (let i = 0; i < total; i++) if (i !== safe) pool.push(i)
  }
  for (let n = 0; n < grid.value.mines && pool.length; n++) {
    const k = Math.floor(Math.random() * pool.length)
    cells.value[pool[k]].mine = true
    pool.splice(k, 1)
  }
  cells.value.forEach((cell, i) => {
    let n = 0
    eachAdj(i, (j) => { if (cells.value[j].mine) n++ })
    cell.adj = n
  })
}

// ---------- 交互 ----------
function onCell(i) {
  if (over.value) return
  if (flagMode.value) { onFlag(i); return }
  reveal(i)
}

function onFlag(i) {
  if (over.value) return
  const c = cells.value[i]
  if (!c || c.open) return
  c.flag = !c.flag
}

function reveal(i) {
  const cell = cells.value[i]
  if (!cell || cell.open || cell.flag) return
  if (!started.value) {
    placeMines(i)
    started.value = true
    startTimer()
  }
  if (cell.mine) { boom(i); return }
  // 只有用户亲手点的这一下才算一次「安全点击」：踩雷那一下本局就结束，不计数；
  // 下面空白格自动扩散翻开的格子也不计数（一次点击最多 +1）。
  clicks.value++
  // 空白格自动向外扩散，遇到数字格停下
  const stack = [i]
  while (stack.length) {
    const k = stack.pop()
    const c = cells.value[k]
    if (c.open || c.flag) continue
    c.open = true
    if (c.adj === 0) {
      eachAdj(k, (j) => {
        const nb = cells.value[j]
        if (!nb.open && !nb.flag && !nb.mine) stack.push(j)
      })
    }
  }
  grantReached()
  checkWin()
}

function boom(i) {
  over.value = true
  win.value = false
  stopTimer()
  // 踩雷即失败：本局一次奖励都不再发，进度条也不再往前
  notice.value = ''
  cells.value[i].boom = true
  cells.value.forEach((c) => {
    if (c.mine) { c.open = true; c.flag = false }
  })
}

async function checkWin() {
  const safeTotal = grid.value.rows * grid.value.cols - grid.value.mines
  if (openedCount.value < safeTotal) return
  over.value = true
  win.value = true
  stopTimer()
  const t = winTier.value
  const c = t && t.coupon
  if (!c) { rewardText.value = '通关！不过券池暂时是空的，等补券了再来一局～'; return }
  if (!store.user) {
    rewardText.value = `通关！登录后就能领「${c.title}」${c.amount}`
    needLogin.value = true
    return
  }
  if (owned(c.code)) {
    rewardText.value = '通关！这张通关券你之前已经领过了，本次只记成绩'
    return
  }
  const ok = await claimCoupon(c.code, 'mine')
  rewardText.value = ok === true
    ? `通关！「${c.title}」${c.amount} 已放入我的优惠券`
    : '通关！奖励发放失败，稍后重新开局再试一次'
}

// ---------- 计时 ----------
function startTimer() {
  stopTimer()
  timer = setInterval(() => { time.value++ }, 1000)
}
function stopTimer() {
  if (timer) { clearInterval(timer); timer = null }
}
onUnmounted(stopTimer)

// ---------- 扫雷 × 优惠券：连续 2 次 / 5 次安全点击 / 通关，各发一张无门槛券 ----------
// 次数只统计用户亲手点的格子，空白格自动扩散翻开的不计入。
// 档位配置在 data.js 的 MINE_TIERS，券面信息来自券池（数据库 coupon 表）。
const tiers = computed(() =>
  MINE_TIERS.map((t) => ({
    ...t,
    coupon: (store.couponPool || []).find((c) => c.code === t.code) || null,
  }))
)
const winTier = computed(() => tiers.value.find((t) => t.code === 'MINEWIN') || null)
const owned = (code) => store.myCoupons.includes(code)

// 距离下一档还差几次（没有可解锁的档位就是 0）
const nextNeed = computed(() => {
  const t = tiers.value
    .filter((x) => x.need && !owned(x.code) && x.need > clicks.value)
    .sort((a, b) => a.need - b.need)[0]
  return t ? t.need - clicks.value : 0
})

const sideTip = computed(() => {
  if (!store.user) return '登录后奖励自动发放，每人每张限领一次。'
  if (tiers.value.length && tiers.value.every((t) => owned(t.code))) {
    return '三张扫雷券你都收齐了，重复闯关只记成绩。'
  }
  return '达成条件即刻发券，自动放进「我的优惠券」，每人每张限领一次。'
})

function tierState(t) {
  if (owned(t.code)) return '已领取'
  if (t.need === 0) return '通关可得'
  if (clicks.value >= t.need) return store.user ? '已达成' : '待登录'
  return `还差 ${t.need - clicks.value} 次`
}

// 发一张：已领过、没登录都不打扰用户（没登录的等登录后由 watch 补发）
// 第二个参数 'mine' 是来源标记：后端只允许扫雷游戏领这类券，页面直接领取会被拒绝
async function grantTier(t) {
  if (!t || !t.coupon || owned(t.code) || !store.user) return false
  const ok = await claimCoupon(t.coupon.code, 'mine')
  if (ok === true) notice.value = `解锁「${t.coupon.title}」${t.coupon.amount}，已放入我的优惠券`
  return ok === true
}

// 每点一次都检查：命中 2 次 / 5 次就当场发券
function grantReached() {
  tiers.value.filter((t) => t.need && clicks.value >= t.need).forEach((t) => grantTier(t))
}

// 中途没登录、玩到一半才登录的情况：登录后把已达成的档位补发一次
watch(
  () => store.user,
  (u) => {
    if (!u) return
    if (over.value) { if (win.value) grantTier(winTier.value); return }
    grantReached()
  }
)

function loginNow() { openAuth('login') }

// ---------- 样式类 ----------
function cellClass(c) {
  return [
    { open: c.open, flag: c.flag, mine: c.open && c.mine, boom: c.boom },
    c.open && !c.mine && c.adj ? 'n' + c.adj : '',
  ]
}

reset()
</script>

<style scoped>
.mg {
  background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow);
  padding: 24px 24px 22px; margin-bottom: 20px;
}

/* ---------- 标题 ---------- */
.mg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
.mg-kicker {
  font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
  color: var(--primary); font-weight: 600; margin-bottom: 8px;
}
.mg-title h2 { font-size: 21px; letter-spacing: .06em; }
.mg-sub { margin-top: 8px; font-size: 12.5px; color: var(--muted); line-height: 1.7; max-width: 520px; }
.mg-levels { display: flex; gap: 8px; }
.mg-lv {
  border: 1px solid var(--line); background: transparent; color: var(--muted);
  border-radius: 999px; padding: 6px 16px; font-size: 12.5px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: .18s;
}
.mg-lv:hover { border-color: var(--primary); color: var(--primary); }
.mg-lv.on { background: var(--primary); border-color: var(--primary); color: #fff; }

/* ---------- 两栏：棋盘 + 奖励说明 ---------- */
.mg-main { display: grid; grid-template-columns: minmax(0, 460px) minmax(0, 1fr); gap: 30px; align-items: start; }
.mg-left { display: flex; flex-direction: column; gap: 12px; }

/* 状态栏 */
.mg-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  border: 1px solid var(--hairline); border-radius: 12px; padding: 9px 14px;
}
.mg-stat { display: flex; align-items: baseline; gap: 5px; }
.mg-stat .mg-ico { font-size: 12px; }
.mg-stat b { font-size: 15px; font-variant-numeric: tabular-nums; }
.mg-stat small { font-size: 11px; color: var(--muted); }

.mg-ops { display: flex; gap: 8px; }
.mg-btn {
  border: 1px solid var(--line); background: var(--card); color: var(--text);
  border-radius: 999px; padding: 7px 16px; font-size: 12.5px; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: .18s;
}
.mg-btn:hover { border-color: var(--primary); color: var(--primary); }
.mg-btn.on { background: rgba(74, 144, 217, .12); border-color: var(--primary); color: var(--primary); }
.mg-btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.mg-btn.primary:hover { background: var(--primary-dark); color: #fff; }
.mg-ops .mg-btn { flex: 1; }

/* ---------- 棋盘 ---------- */
.mg-board-wrap { display: flex; justify-content: center; }
.mg-stage { position: relative; width: 100%; }
.mg-board {
  display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 4px;
  padding: 10px; border-radius: 12px; border: 1px solid var(--hairline);
  background: linear-gradient(160deg, #d9e7f7, #c9dbee);
}
[data-theme="dark"] .mg-board { background: linear-gradient(160deg, #101a27, #16222f); }

.mg-cell {
  aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; border: 1px solid #a9c6e4; background: linear-gradient(160deg, #ffffff, #e4effb);
  box-shadow: 0 1px 2px rgba(30, 60, 110, .12);
  color: #22303f; font-size: 15px; font-weight: 700;
  font-family: inherit; cursor: pointer; padding: 0; line-height: 1;
  transition: transform .1s, background .15s, border-color .15s;
}
.mg-cell:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--primary); }
.mg-cell:disabled { cursor: default; }
.mg-cell.flag { background: linear-gradient(160deg, #fff7e8, #ffeccd); border-color: #e8c98b; }
.mg-cell.open {
  background: #e8f1fb; border-color: #d2e2f3; box-shadow: none;
  cursor: default; transform: none;
}
.mg-cell.mine { background: #fdeaea; border-color: #f0bcbc; }
.mg-cell.boom { background: #f9d5d5; border-color: #e79a9a; }

/* 数字配色：一到八拉开色相但不刺眼 */
.mg-cell.n1 { color: #2b6cb8; }
.mg-cell.n2 { color: #2f855a; }
.mg-cell.n3 { color: #c05621; }
.mg-cell.n4 { color: #6b46c1; }
.mg-cell.n5 { color: #9b2c2c; }
.mg-cell.n6 { color: #0e7490; }
.mg-cell.n7 { color: #334155; }
.mg-cell.n8 { color: #7c8aa0; }

[data-theme="dark"] .mg-cell {
  background: linear-gradient(160deg, #26364a, #1d2a39);
  border-color: #33475d; color: #dbe6f2;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .35);
}
[data-theme="dark"] .mg-cell.open { background: #131f2c; border-color: #223143; box-shadow: none; }
[data-theme="dark"] .mg-cell.flag { background: #3a3020; border-color: #6b5733; }
[data-theme="dark"] .mg-cell.mine { background: #3a2020; border-color: #6b3a3a; }
[data-theme="dark"] .mg-cell.boom { background: #4a2323; border-color: #8a4444; }
/* 暗色下数字要提亮一档，不然压在深底上看不清 */
[data-theme="dark"] .mg-cell.n1 { color: #7fb3e8; }
[data-theme="dark"] .mg-cell.n2 { color: #68d391; }
[data-theme="dark"] .mg-cell.n3 { color: #f0a868; }
[data-theme="dark"] .mg-cell.n4 { color: #b794f4; }
[data-theme="dark"] .mg-cell.n5 { color: #fc8181; }
[data-theme="dark"] .mg-cell.n6 { color: #4fd1c5; }
[data-theme="dark"] .mg-cell.n7 { color: #cbd5e0; }
[data-theme="dark"] .mg-cell.n8 { color: #a0aec0; }

/* ---------- 遮罩层 ---------- */
.mg-mask {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  border-radius: 12px; background: rgba(9, 24, 44, .34); backdrop-filter: blur(2px);
  animation: mgIn .22s ease;
}
.mg-mask.soft { background: transparent; backdrop-filter: none; pointer-events: none; }
@keyframes mgIn { from { opacity: 0; } to { opacity: 1; } }

.mg-hint {
  background: var(--card); border-radius: 12px; padding: 12px 20px; text-align: center;
  box-shadow: 0 10px 30px rgba(16, 34, 60, .2); max-width: 82%;
}
.mg-hint p { font-size: 13px; font-weight: 600; color: var(--text); }
.mg-hint small { display: block; margin-top: 5px; font-size: 11.5px; color: var(--muted); line-height: 1.7; }

.mg-result {
  background: var(--card); border-radius: 14px; padding: 20px 26px; text-align: center;
  box-shadow: 0 14px 40px rgba(16, 34, 60, .24); max-width: 84%;
}
.mg-r-emoji { font-size: 30px; line-height: 1; }
.mg-result h3 { font-size: 18px; margin: 8px 0 6px; }
.mg-r-tip { font-size: 12.5px; color: var(--text); line-height: 1.6; }
.mg-r-meta { margin-top: 8px; font-size: 11.5px; color: var(--muted); }
.mg-r-ops { display: flex; gap: 8px; justify-content: center; margin-top: 14px; }

/* ---------- 右栏：奖励 + 玩法 ---------- */
.mg-side { display: flex; flex-direction: column; gap: 18px; padding-top: 2px; max-width: 520px; }
.mg-side-k {
  font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
  color: var(--muted); font-weight: 600; margin-bottom: 10px;
}
/* 三档奖励：面值块 + 名称 + 状态，已领取整行压暗，刚达成的一行描边高亮 */
.mg-tier-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.mg-tier {
  display: flex; align-items: center; gap: 12px;
  border: 1px solid var(--hairline); border-radius: 12px; background: var(--card);
  padding: 10px 12px; transition: border-color .18s, box-shadow .18s, opacity .18s;
}
.mg-tier-amt {
  flex-shrink: 0; min-width: 60px; text-align: center;
  font-size: 17px; font-weight: 800; color: var(--primary);
  background: rgba(74, 144, 217, .1); border-radius: 8px; padding: 6px 8px;
}
.mg-tier-bd { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mg-tier-bd b { font-size: 13.5px; font-weight: 600; }
.mg-tier-bd small { font-size: 11.5px; color: var(--muted); }
.mg-tier-st {
  flex-shrink: 0; font-size: 11.5px; font-weight: 600; color: var(--muted);
  border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; white-space: nowrap;
}
/* 本局刚达成、还没发下去（没登录）的那一档 */
.mg-tier.reached { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 108, 184, .1); }
.mg-tier.reached .mg-tier-st { color: var(--primary); border-color: var(--primary); }
.mg-tier.got { opacity: .72; }
.mg-tier.got .mg-tier-amt { color: var(--muted); background: var(--bg); }
.mg-tier.got .mg-tier-st { color: #2f855a; border-color: rgba(47, 133, 90, .35); background: rgba(47, 133, 90, .08); }
[data-theme="dark"] .mg-tier.got .mg-tier-st { color: #68d391; border-color: rgba(104, 211, 145, .35); background: rgba(104, 211, 145, .1); }

.mg-unlock {
  margin-top: 10px; font-size: 12px; font-weight: 600; color: var(--primary);
  background: rgba(74, 144, 217, .1); border: 1px dashed rgba(74, 144, 217, .42);
  border-radius: 10px; padding: 7px 11px; animation: mgIn .2s ease;
}
.mg-progress { margin-top: 10px; font-size: 12px; color: var(--text); }
.mg-progress b { color: var(--primary); font-size: 14px; }
.mg-login-tip { margin-top: 8px; font-size: 11.5px; color: var(--muted); }
.mg-link {
  background: none; border: none; padding: 0; font-family: inherit; font-size: inherit;
  color: var(--primary); font-weight: 600; text-decoration: underline; cursor: pointer;
}
.mg-prize-tip { margin-top: 8px; font-size: 11.5px; color: var(--muted); line-height: 1.7; }

.mg-rules ol { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 7px; }
.mg-rules li { font-size: 12.5px; color: var(--text); line-height: 1.7; }
.mg-rules li::marker { color: var(--primary); font-weight: 700; }

/* ---------- 窄屏 ---------- */
@media (max-width: 860px) {
  .mg-main { grid-template-columns: 1fr; gap: 20px; }
  .mg-side { flex-direction: row; flex-wrap: wrap; gap: 16px; }
  .mg-side > div { flex: 1 1 240px; }
}
@media (max-width: 640px) {
  .mg { padding: 18px 14px 16px; }
  .mg-board { gap: 3px; padding: 7px; }
  .mg-cell { border-radius: 5px; font-size: 13px; }
  .mg-bar { padding: 8px 10px; gap: 6px; }
  .mg-stat small { display: none; }
  .mg-result { padding: 16px 18px; }
  .mg-side { flex-direction: column; }
  /* 窄屏回到单列，别继承上行 flex-basis，否则奖励与玩法之间会空一大截 */
  .mg-side > div { flex: 0 0 auto; }
}
</style>
