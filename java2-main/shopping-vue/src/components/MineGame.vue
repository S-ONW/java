<template>
  <section class="mg">
    <!-- 标题区 -->
    <header class="mg-head">
      <div class="mg-title">
        <p class="mg-kicker">Mini Game · 扫雷赢券</p>
        <h2>扫雷闯关</h2>
        <p class="mg-sub">
          点格子排雷，把 {{ grid.rows * grid.cols - grid.mines }} 个安全格全部翻开即通关，
          通关后自动送一张优惠券到「我的优惠券」。
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
          <p class="mg-side-k">通关奖励</p>
          <div class="mg-prize-card" v-if="rewardCoupon">
            <div class="mg-prize-amt">
              <b>{{ rewardCoupon.amount }}</b>
              <i>{{ rewardCoupon.type === 'pct' ? '折扣' : '立减' }}</i>
            </div>
            <div class="mg-prize-bd">
              <p class="mg-prize-title">{{ rewardCoupon.title }}</p>
              <small>{{ rewardCoupon.desc || '全场通用' }} · {{ rewardCoupon.cond }}</small>
            </div>
          </div>
          <p v-else class="mg-prize-empty">券池暂时空了，等补券后再来挑战～</p>
          <p class="mg-prize-tip">
            {{ wonBefore ? '这张奖励券你已经领过了，重复通关只记成绩。' : '通关后自动放进「我的优惠券」，每位用户限领一张。' }}
          </p>
        </div>

        <div class="mg-rules">
          <p class="mg-side-k">怎么玩</p>
          <ol>
            <li>第一次点开的格子一定安全，雷在首点之后才埋。</li>
            <li>数字表示它周围八格里埋了几颗雷。</li>
            <li>右键（或开「标记模式」后点击）插旗，标记你认定的雷。</li>
            <li>翻开全部安全格即通关；点中雷则本局结束。</li>
          </ol>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { store, claimCoupon, openAuth } from '../store.js'

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
  checkWin()
}

function boom(i) {
  over.value = true
  win.value = false
  stopTimer()
  cells.value[i].boom = true
  cells.value.forEach((c) => {
    if (c.mine) { c.open = true; c.flag = false }
  })
}

function checkWin() {
  const safeTotal = grid.value.rows * grid.value.cols - grid.value.mines
  if (openedCount.value < safeTotal) return
  over.value = true
  win.value = true
  stopTimer()
  grantReward()
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

// ---------- 通关奖励：自动领一张券 ----------
// 优先拿券池里的无门槛 5 元券（FREE5），没有就用券池第一张
const rewardCoupon = computed(() => {
  const pool = store.couponPool || []
  return pool.find((c) => c.code === 'FREE5') || pool[0] || null
})
const wonBefore = computed(() => !!(rewardCoupon.value && store.myCoupons.includes(rewardCoupon.value.code)))

async function grantReward() {
  const c = rewardCoupon.value
  needLogin.value = false
  if (!c) { rewardText.value = '通关！不过券池暂时是空的，等补券了再来一局～'; return }
  if (!store.user) {
    rewardText.value = `通关！登录后就能领「${c.title}」`
    needLogin.value = true
    return
  }
  if (store.myCoupons.includes(c.code)) {
    rewardText.value = '通关！这张奖励券你之前已经领过了，本次只记成绩'
    return
  }
  const ok = await claimCoupon(c.code)
  rewardText.value = ok === true
    ? `通关！「${c.title}」已放入我的优惠券`
    : '通关！奖励券领取失败，可在上方手动领取'
}

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
.mg-prize-card {
  display: flex; align-items: stretch; gap: 0; overflow: hidden;
  border: 1px solid var(--hairline); border-radius: 12px; background: var(--card);
}
.mg-prize-amt {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; padding: 14px 18px; min-width: 96px;
  background: linear-gradient(160deg, var(--primary), var(--primary-dark)); color: #fff;
}
.mg-prize-amt b { font-size: 19px; font-weight: 800; }
.mg-prize-amt i { font-size: 10.5px; font-style: normal; opacity: .85; }
.mg-prize-bd { padding: 12px 16px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.mg-prize-title { font-size: 14px; font-weight: 600; }
.mg-prize-bd small { font-size: 11.5px; color: var(--muted); }
.mg-prize-empty { font-size: 12.5px; color: var(--muted); }
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
