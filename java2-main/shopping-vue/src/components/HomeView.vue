<template>
  <div class="wrap home">
    <!-- 氛围气泡：与注册页同一套漂浮装饰，只做背景不抢内容 -->
    <div class="atmos" aria-hidden="true">
      <span class="bubble b1"></span>
      <span class="bubble b2"></span>
      <span class="bubble b3"></span>
    </div>

    <!-- 首屏：左栏插画（与注册页同一个角色、同一排版，换成了街景那张），右栏精选企划轮播 -->
    <!-- 只在「全部商品」时出现；切到数码电子等具体分类就收起，直接进入商品列表 -->
    <Transition name="hero" appear>
      <section v-if="showHero" ref="heroEl" class="hero" @mouseenter="onHeroEnter" @mouseleave="onHeroLeave">
      <!-- 左栏插画：悬停 → 右栏原地预览宣传片；点击仍可直接去 B 站看完整版 -->
      <a
        class="hero-art"
        :href="PROMO_VIDEO"
        target="_blank"
        rel="noopener noreferrer"
        :style="{ backgroundImage: 'url(' + homeHero + ')' }"
        title="点击去 B 站看完整版"
        aria-label="宣传片入口：点击在新窗口打开 B 站视频"
        @mouseenter="onArtEnter"
      >
        <span class="art-play" aria-hidden="true">▶ 观看宣传片</span>
        <div class="art-copy">
          <span class="rule"></span>
          <ul>
            <li>千款好物，每日上新</li>
            <li>满 ¥99 包邮，闪电发货</li>
            <li>新人专享优惠券礼包</li>
            <li>七天无理由退换货</li>
          </ul>
        </div>
      </a>

      <div class="hero-main" :class="{ 'is-preview': preview }">
        <div class="stage">
          <div
            v-for="(b, i) in BANNERS"
            :key="i"
            class="scene"
            :class="{ active: i === current }"
            @click="onBanner(b)"
          >
            <p class="scene-kicker">{{ b.en }}</p>
            <h1>{{ b.h }}</h1>
            <p class="lede">{{ b.p }}</p>
            <span class="scene-tag">{{ b.t }}</span>
          </div>
        </div>

        <div class="hero-foot">
          <div class="actions">
            <button class="cta" @click="scrollToGrid">开始选购</button>
            <button class="cta ghost" @click="go('coupon')">领券中心</button>
          </div>
          <div class="pips">
            <button
              v-for="(b, i) in BANNERS"
              :key="i"
              class="pip"
              :class="{ on: i === current }"
              :aria-label="'切换到第 ' + (i + 1) + ' 屏'"
              @click="current = i"
            ></button>
          </div>
        </div>

        <!-- 悬停插画时原地浮出的预览层：盖住右栏企划，移开即收（组件卸载顺带掐掉声音） -->
        <Transition name="prev">
          <div v-if="preview" class="preview">
            <!-- 播放器起播要一两秒：这段时间铺视频封面（虚化）撑住画面，不留黑底 -->
            <div
              class="preview-poster"
              :class="{ 'is-gone': revealed }"
              :style="{ backgroundImage: `url(${promoCover})` }"
              aria-hidden="true"
            ></div>
            <iframe
              :key="previewNonce"
              :class="{ 'is-live': revealed }"
              :src="PROMO_EMBED"
              title="宣传片预览"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowfullscreen
              frameborder="0"
              scrolling="no"
              @load="onFrameLoad"
            ></iframe>
            <div v-if="!revealed" class="preview-skel">
              <span class="spin" aria-hidden="true"></span>
              <span class="skel-t">正在接入 B 站播放器…</span>
              <span class="skel-s">《光与夜之恋》萧逸生日活动 · 一盏朝夕</span>
              <span class="preview-progress" aria-hidden="true"></span>
            </div>
            <div class="preview-bar">
              <span>宣传片预览 · 移开鼠标即收起</span>
              <a :href="PROMO_VIDEO" target="_blank" rel="noopener noreferrer">去 B 站看完整版 ↗</a>
            </div>
          </div>
        </Transition>
      </div>
    </section>
    </Transition>

    <main ref="gridTop">
      <div class="toolbar">
        <div class="head">
          <p class="kicker">Collection · 精选陈列</p>
          <h2>
            {{ store.cat === 'all' ? '全部商品' : catLabel(store.cat) }}
            <small>{{ total }} 件</small>
          </h2>
        </div>
        <label class="sort-wrap">
          <span class="lab">排序</span>
          <select class="sort" :value="store.sort" @change="onSort">
            <option value="default">综合排序</option>
            <option value="priceAsc">价格从低到高</option>
            <option value="priceDesc">价格从高到低</option>
            <option value="hot">最热优先</option>
            <option value="rate">好评优先</option>
          </select>
        </label>
      </div>

      <div class="filters">
        <span class="lab">价格</span>
        <input ref="minP" type="number" placeholder="最低" :value="store.filters.min ?? ''" />
        <span class="dash">—</span>
        <input ref="maxP" type="number" placeholder="最高" :value="store.filters.max ?? ''" />
        <button class="btn ghost filter-btn" @click="onFilter">筛选</button>
        <span class="lab sep">评分</span>
        <span
          v-for="r in [0, 4.5, 4.7, 4.8]"
          :key="r"
          class="chip"
          :class="{ on: store.filters.rate === r }"
          @click="setRate(r)"
        >{{ r === 0 ? '全部评分' : r + ' 分以上' }}</span>
      </div>

      <div class="grid">
        <ProductCard v-for="p in shown" :key="p.id" :product="p" />
        <div v-if="!shown.length" class="empty">
          <img class="mascot" :src="mascotDizzy" alt="没有找到商品" />
          <p class="empty-t">没有找到符合条件的商品</p>
          <p class="empty-tip">换个关键词或筛选条件再试试～</p>
        </div>
      </div>

      <div class="pager" v-if="store.cat !== 'all' && total > store.perPage">
        <button :disabled="store.page === 1" @click="setPage(store.page - 1)">‹</button>
        <button
          v-for="i in pages"
          :key="i"
          :class="{ on: i === store.page }"
          @click="setPage(i)"
        >{{ i }}</button>
        <button :disabled="store.page === pages" @click="setPage(store.page + 1)">›</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { store, catLabel, setRate, setPage, applyFilter, go, setCat } from '../store.js'
import mascotDizzy from '../assets/mascot/dizzy.png'
import homeHero from '../assets/home-hero.webp'
// 宣传片封面（B 站官方 cover，拉不到播放器时就拿它撑住画面，避免一块黑底）
import promoCover from '../assets/promo-cover.webp'
import { BANNERS } from '../data.js'
import ProductCard from './ProductCard.vue'

const current = ref(0)
const minP = ref(null)
const maxP = ref(null)
const gridTop = ref(null)

// 首屏插画（街道那张）悬停即预览宣传片；点击仍去 B 站看完整版
const PROMO_BVID = 'BV1irWB6wEqF'
// 起播位置（秒）。5 = 从 0:05 开始：每次预览、每次点开 B 站都从这里起，不会被上次看到哪儿带偏
const PROMO_START = 5
const PROMO_VIDEO =
  `https://www.bilibili.com/video/${PROMO_BVID}` + (PROMO_START ? `?t=${PROMO_START}` : '')
// 官方外链播放器：autoplay 让它进来就开始播（浏览器没给自动播放权限时停在封面，点一下即可）
// t 必须显式给死——不给 t 时播放器会沿用上次的观看进度，预览就"接着上次"而不是从设定的起播点开始
const PROMO_EMBED =
  `https://player.bilibili.com/player.html?bvid=${PROMO_BVID}&page=1&t=${PROMO_START}` +
  '&autoplay=1&danmaku=0&high_quality=1&as_wide=1'

// ---------- 悬停插画 → 右栏原地预览宣传片 ----------
const heroEl = ref(null)
const preview = ref(false)      // 预览层是否显示
const revealed = ref(false)      // 播放器真的接管画面了没（此前铺封面 + 转圈）
// 每开一次预览就换一个 key：强制重建 iframe，不给浏览器复用旧文档、不让播放器续上上一次的进度
const previewNonce = ref(0)
// 触屏没有 hover，不启用预览，保持「点图去 B 站」
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
let enterTimer = null
let revealTimer = null

function cancelEnter() {
  if (enterTimer) { clearTimeout(enterTimer); enterTimer = null }
}
function cancelReveal() {
  if (revealTimer) { clearTimeout(revealTimer); revealTimer = null }
}
// iframe 的 load 只是播放器文档就绪，视频第一帧还要再等 0.5~0.8s；
// 所以再等 780ms 才把画面交给播放器，中间继续铺封面，视觉上不出现黑屏
function onFrameLoad() {
  cancelReveal()
  revealTimer = setTimeout(() => { revealed.value = true; revealTimer = null }, 780)
}
// 60ms 的轻缓冲：鼠标只是扫过不会闪出来，真正停住就立刻有反应
function onArtEnter() {
  if (!canHover || preview.value || enterTimer) return
  enterTimer = setTimeout(() => {
    enterTimer = null
    revealed.value = false
    cancelReveal()
    // 换 key → iframe 全新加载 → 每次悬停都从 PROMO_START 那一秒重新开始
    previewNonce.value += 1
    preview.value = true
  }, 60)
}
function closePreview() {
  cancelEnter()
  cancelReveal()
  if (preview.value) preview.value = false
}
function onHeroEnter() { pause() }
function onHeroLeave() { resume() }

// 指针真的离开整张卡片才收起。滑块滑进 iframe 时父文档收不到 mousemove，
// 所以只靠 .hero 的 mouseleave 会误判（一进播放器就收），改成按坐标判断
function onDocMove(e) {
  if (!preview.value || !heroEl.value) return
  const r = heroEl.value.getBoundingClientRect()
  const pad = 4
  if (e.clientX <= r.left - pad || e.clientX >= r.right + pad ||
      e.clientY <= r.top - pad || e.clientY >= r.bottom + pad) {
    closePreview()
  }
}

// 首屏轮播：右键悬停时暂停，离开后继续，避免用户正在读文案时被切走
let timer = null
function start() {
  if (timer) return
  timer = setInterval(() => { current.value = (current.value + 1) % BANNERS.length }, 5200)
}
function pause() {
  if (timer) { clearInterval(timer); timer = null }
}
function resume() { start() }

onMounted(() => {
  start()
  // 预览层的「移开就收」靠这两个全局监听兜底（含鼠标移出整个窗口）
  document.addEventListener('mousemove', onDocMove, { passive: true })
  document.documentElement.addEventListener('mouseleave', closePreview)
  // 一边预览一边滚走会留下孤零零的一块预览，滚动就直接收掉
  window.addEventListener('scroll', closePreview, { passive: true })
})
onUnmounted(() => {
  pause()
  cancelEnter()
  cancelReveal()
  document.removeEventListener('mousemove', onDocMove)
  document.documentElement.removeEventListener('mouseleave', closePreview)
  window.removeEventListener('scroll', closePreview)
})
// 手动点小圆点时，把计时重新起步（让刚选中的这一屏能完整停留）
watch(current, () => { pause(); start() })

// 横幅只在「全部商品」下展示；切到具体分类就收起，商品列表直接顶上来
const showHero = computed(() => store.cat === 'all')
watch(showHero, (on) => {
  if (on) {
    current.value = 0
    start()
  } else {
    closePreview()
    pause()
    // 横幅收起后页面会整体上移，如果当时已经往下滚了，顺手回到顶部，避免内容"跳一下"
    if (window.scrollY > 80) window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

const filtered = computed(() =>
  store.products.filter((p) => {
    const okCat = store.cat === 'all' || p.cat === store.cat
    const okKw =
      !store.keyword ||
      (p.name + p.desc + p.cat).toLowerCase().includes(store.keyword.toLowerCase())
    const okMin = store.filters.min == null || p.price >= store.filters.min
    const okMax = store.filters.max == null || p.price <= store.filters.max
    const okRate = p.rate >= store.filters.rate
    return okCat && okKw && okMin && okMax && okRate
  })
)
const sorted = computed(() => {
  const list = [...filtered.value]
  if (store.sort === 'priceAsc') list.sort((a, b) => a.price - b.price)
  if (store.sort === 'priceDesc') list.sort((a, b) => b.price - a.price)
  if (store.sort === 'hot') list.sort((a, b) => b.hot - a.hot)
  if (store.sort === 'rate') list.sort((a, b) => b.rate - a.rate)
  return list
})
const total = computed(() => sorted.value.length)
const pages = computed(() => Math.max(1, Math.ceil(total.value / store.perPage)))
const shown = computed(() =>
  store.cat === 'all'
    ? sorted.value
    : sorted.value.slice((store.page - 1) * store.perPage, store.page * store.perPage)
)

watch(pages, (p) => { if (store.page > p) store.page = p })

function onSort(e) { store.sort = e.target.value }
function onFilter() {
  const min = minP.value?.value
  const max = maxP.value?.value
  applyFilter(min, max)
}

// 「开始选购」：平滑滚到商品区，扣掉吸顶头部的高度
function scrollToGrid() {
  const el = gridTop.value
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 124
  window.scrollTo({ top: y, behavior: 'smooth' })
}

// 点击首屏文案：coupon → 领券中心；cat:xxx → 切到对应分类
function onBanner(b) {
  if (!b.link) return
  if (b.link === 'coupon') {
    go('coupon')
  } else if (b.link.startsWith('cat:')) {
    const cat = b.link.slice(4)
    setCat(cat)
    go('home')
  }
}
</script>

<style scoped>
/* ---------- 页面容器与背景氛围 ---------- */
.home { position: relative; padding-top: 22px; }
.home > * { position: relative; z-index: 1; }
.atmos { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.bubble {
  position: absolute; border-radius: 50%; filter: blur(3px); opacity: .5;
  animation: float 11s ease-in-out infinite;
}
.b1 { width: 220px; height: 220px; top: 6%; left: -100px; background: radial-gradient(circle, #dce8f8, #c2d6ec); }
.b2 { width: 320px; height: 320px; bottom: -140px; right: -120px; background: radial-gradient(circle, #e6eefa, #cedcee); animation-delay: -5s; }
.b3 { width: 130px; height: 130px; top: 46%; right: 5%; background: radial-gradient(circle, #e2eefb, #c8dcf0); animation-delay: -2.5s; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-22px); } }
[data-theme="dark"] .bubble { opacity: .16; }

/* ---------- 首屏：左街景 + 右企划 ---------- */
.hero {
  display: grid; grid-template-columns: 380px 1fr;
  background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow);
  overflow: hidden;
}
/* 出现 / 收起：切分类时横幅轻轻上收，下面的列表接上来 */
.hero-enter-active { transition: opacity .45s cubic-bezier(.2, .9, .3, 1.1), transform .45s cubic-bezier(.2, .9, .3, 1.1); }
.hero-leave-active { transition: opacity .2s ease, transform .2s ease; }
.hero-enter-from { opacity: 0; transform: translateY(14px); }
.hero-leave-to { opacity: 0; transform: translateY(-10px); }

.hero-art {
  position: relative; isolation: isolate;
  display: flex; flex-direction: column; justify-content: flex-end;
  min-height: 424px; padding: 26px 22px 24px; color: #fff;
  background-color: #3b4c5f; background-position: center 46%; background-size: cover; background-repeat: no-repeat;
  /* 街景这张图的用色：霓虹红字 + 冷蓝光，插画里的贴纸徽章也走这一套 */
  --street-red: #ff4a3d;
  --street-cyan: #7ad4ff;
}
/* 右缘渐隐成卡片底色，与企划区无缝衔接（与注册页同一手法） */
.hero-art::before {
  content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: linear-gradient(270deg, var(--card) 0%, transparent 30%);
}
/* 这张图上方是霓虹弧线、底部是亮白 T 恤，压暗要比一般的插画更实一点，白字才压得住 */
.hero-art::after {
  content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    linear-gradient(to top, rgba(15, 33, 55, .93) 0%, rgba(15, 33, 55, .82) 20%, rgba(15, 33, 55, .5) 48%, rgba(15, 33, 55, .16) 72%, rgba(15, 33, 55, 0) 90%),
    linear-gradient(90deg, rgba(15, 33, 55, .46) 0%, rgba(15, 33, 55, .16) 44%, rgba(15, 33, 55, 0) 68%);
}
.art-copy { position: relative; z-index: 1; }

/* 整块插画是一个链接：悬停时微微提亮，同时右栏换成宣传片预览 */
.hero-art { text-decoration: none; cursor: pointer; transition: filter .25s ease; }
.hero-art:hover { filter: saturate(1.08) brightness(1.06); }
.hero-art:focus-visible { outline: 2px solid var(--street-cyan); outline-offset: -4px; }
/* 有 hover 的设备上，预览层本身就是提示，这枚贴片反而多余；只在触屏上常驻，
   否则没人知道这张图能点（触屏点开的是 B 站完整版） */
.art-play {
  position: absolute; right: 16px; bottom: 16px; z-index: 2;
  display: none; align-items: center; gap: 7px;
  font-family: var(--display); font-weight: 700; font-size: 11.5px; letter-spacing: .1em;
  color: #fff; padding: 7px 13px; border-radius: 999px;
  background: rgba(8, 18, 33, .74); border: 1px solid rgba(255, 255, 255, .34);
  backdrop-filter: blur(6px); box-shadow: 0 6px 16px rgba(4, 12, 26, .45);
  pointer-events: none;
}
@media (hover: none) { .art-play { display: inline-flex; } }

/* 小标：按插画里的街牌做成贴纸标签——左边一道霓虹红、右角斜切、整块微微歪着 */
.eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--display); font-weight: 800; font-size: 11px; letter-spacing: .13em;
  color: #fff; padding: 6px 14px 6px 10px; margin: 0 0 14px;
  background: rgba(8, 18, 33, .78); border-left: 3px solid var(--street-red);
  clip-path: polygon(0 0, 100% 0, calc(100% - 9px) 100%, 0 100%);
  transform: rotate(-1.6deg); transform-origin: left bottom;
  /* clip-path 会把 box-shadow 一起裁掉，这里用 drop-shadow 才留得住外阴影 */
  filter: drop-shadow(0 6px 14px rgba(4, 12, 26, .5));
}
.eyebrow::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: var(--street-red); box-shadow: 0 0 9px rgba(255, 74, 61, .95);
}

/* 主标题：重字重 + 紧行高，跟霓虹招牌一样硬；第二行做成空心描边，呼应背景里那圈灯管字 */
.hero-art h3 {
  font-family: var(--display); font-weight: 900; font-size: 32px; line-height: 1.16;
  letter-spacing: .01em; margin: 0;
  /* 红字错位的硬阴影 = 印刷套色，比柔和投影更像街头招牌 */
  text-shadow: 3px 3px 0 rgba(255, 74, 61, .5), 0 12px 26px rgba(4, 14, 30, .75);
}
.hero-art h3 .stroke {
  display: inline-block; margin-top: 5px;
  font-style: normal; color: transparent; letter-spacing: .05em;
  -webkit-text-stroke: 2.2px rgba(255, 255, 255, .96);
  text-shadow: 0 0 24px rgba(122, 212, 255, .7);
}
/* 分隔线：斜切的喷漆条，红 / 白 / 冰蓝三段 */
.rule {
  display: block; width: 58px; height: 4px; margin: 14px 0 16px;
  background: linear-gradient(90deg, var(--street-red) 0 32%, rgba(255, 255, 255, .95) 32% 64%, var(--street-cyan) 64% 100%);
  transform: skewX(-22deg);
  box-shadow: 0 0 12px rgba(255, 74, 61, .4);
}
/* 卖点：做成夹克上的徽章贴片，一条一个角度，交错贴上去 */
.hero-art ul {
  list-style: none; display: flex; flex-direction: column; align-items: flex-start; gap: 7px;
  font-family: var(--display); font-weight: 700; font-size: 11.5px; letter-spacing: .03em;
  color: #fff;
}
.hero-art li {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 4px 11px 4px 9px; border-radius: 5px;
  background: rgba(8, 19, 34, .58); border: 1px solid rgba(255, 255, 255, .32);
  backdrop-filter: blur(5px); box-shadow: 0 4px 12px rgba(4, 12, 26, .38);
}
.hero-art li:nth-child(odd) { transform: rotate(-1.2deg); }
.hero-art li:nth-child(even) { transform: rotate(1.1deg); }
.hero-art li::before {
  content: ''; flex-shrink: 0; width: 5px; height: 5px; border-radius: 1px;
  background: var(--street-red); transform: rotate(45deg);
  box-shadow: 0 0 8px rgba(255, 74, 61, .9);
}

.hero-main {
  position: relative; display: flex; flex-direction: column;
  padding: 34px 40px 24px; min-height: 424px; min-width: 0;
}
.stage { position: relative; flex: 1; min-height: 214px; }
.scene {
  position: absolute; inset: 0; margin: 0; padding: 0;
  display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  color: inherit; opacity: 0; transform: translateY(10px); pointer-events: none;
  transition: opacity .55s ease, transform .55s ease; cursor: pointer;
}
.scene.active { opacity: 1; transform: none; pointer-events: auto; }
/* 首屏企划小标：跟着插画走，黑体 + 宽字距当装饰线 */
.scene-kicker {
  font-family: var(--display); font-weight: 600; font-size: 11px; letter-spacing: .22em;
  text-transform: uppercase; color: var(--primary); opacity: .85; margin-bottom: 11px;
}
/* 首屏以外的区块小标：换成稍粗的黑体，字号抬一点点 */
.kicker {
  font-family: var(--sans-strong); font-weight: 600; font-size: 11.5px; letter-spacing: .2em;
  text-transform: uppercase; color: var(--primary); opacity: .92; margin-bottom: 12px;
}
.scene h1 {
  font-family: var(--display); font-weight: 700; font-size: 32px; line-height: 1.4;
  letter-spacing: .015em; color: var(--text);
}
.scene .lede { margin-top: 12px; font-size: 13.5px; color: var(--muted); letter-spacing: .05em; }
.scene-tag {
  margin-top: 18px; font-family: var(--display); font-weight: 600; font-size: 12px;
  letter-spacing: .1em; color: var(--primary); padding: 6px 15px; border-radius: 999px;
  border: 1px solid var(--hairline); background: rgba(43, 108, 184, .05);
}

.hero-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding-top: 20px; margin-top: 16px; border-top: 1px solid var(--line);
}
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.cta {
  font-family: var(--display); font-weight: 600; font-size: 14px; letter-spacing: .12em; text-indent: .12em;
  padding: 12px 24px; border-radius: 12px; color: #fff;
  background: linear-gradient(135deg, var(--primary), #659edb);
  box-shadow: 0 6px 16px rgba(43, 108, 184, .26); transition: .2s;
}
.cta:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(43, 108, 184, .34); }
.cta:active { transform: translateY(0); }
.cta.ghost {
  background: transparent; color: var(--primary); border: 1px solid var(--hairline);
  box-shadow: none;
}
.cta.ghost:hover { background: rgba(43, 108, 184, .07); box-shadow: 0 8px 18px rgba(43, 108, 184, .12); }

.pips { display: flex; align-items: center; gap: 8px; }
.pip {
  width: 20px; height: 3px; padding: 0; border-radius: 999px;
  background: var(--line); transition: .25s;
}
.pip:hover { background: var(--muted); }
.pip.on { width: 34px; background: var(--primary); }

/* ---------- 悬停插画时的宣传片预览层 ---------- */
/* 企划文案先轻轻上收淡出，预览层再压上来，两层错开一点点才不显得「跳」 */
.stage, .hero-foot { transition: opacity .24s ease, transform .24s ease; }
.hero-main.is-preview .stage,
.hero-main.is-preview .hero-foot { opacity: 0; transform: translateY(-8px); transition: opacity .14s ease, transform .18s ease; }

.preview { position: absolute; inset: 0; z-index: 4; overflow: hidden; background: #0b1220; }
/* 加载期铺封面（略微虚化），起播后再慢慢淡出：千万不能留一块纯黑让人干等 */
.preview-poster {
  position: absolute; inset: 0 0 30px 0; z-index: 0;
  background-size: cover; background-position: center;
  transform: scale(1.08);
  filter: blur(9px) saturate(1.06) brightness(.9);
  transition: opacity .46s ease;
}
.preview-poster.is-gone { opacity: 0; }
/* 播放器只占 30px 那根说明条以上的区域，别和它自己的控制栏抢位置 */
.preview iframe {
  position: absolute; top: 0; left: 0; width: 100%; height: calc(100% - 30px); border: 0; display: block;
  z-index: 1; opacity: 0; transition: opacity .46s ease;
}
/* 播放器真正出画面后再淡入，接住封面淡出的那一拍 */
.preview iframe.is-live { opacity: 1; }
.preview-skel {
  position: absolute; inset: 0 0 30px 0; z-index: 2; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  font-family: var(--sans-strong); font-size: 12px; letter-spacing: .18em; text-indent: .18em;
  color: rgba(232, 242, 255, .9);
  text-shadow: 0 1px 10px rgba(4, 10, 22, .8);
}
.preview-skel .skel-s {
  font-family: var(--sans); font-size: 11px; letter-spacing: .08em; text-indent: .08em;
  color: rgba(226, 238, 252, .62);
}
/* 一条来回扫的细条：有动效，等待就不像卡死 */
.preview-progress {
  position: absolute; left: 0; bottom: 0; width: 34%; height: 3px; border-radius: 0 3px 3px 0;
  background: linear-gradient(90deg, transparent, rgba(122, 212, 255, .9), transparent);
  animation: prevslide 1.15s cubic-bezier(.45, .05, .4, .95) infinite;
}
@keyframes prevslide {
  0% { transform: translateX(-40%); opacity: .35; }
  50% { opacity: 1; }
  100% { transform: translateX(320%); opacity: .35; }
}
.spin {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid rgba(122, 212, 255, .3); border-top-color: #7ad4ff;
  animation: prevspin .7s linear infinite;
}
@keyframes prevspin { to { transform: rotate(360deg); } }
.preview-bar {
  position: absolute; left: 0; right: 0; bottom: 0; height: 30px; z-index: 3;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 0 14px; background: #0b1220;
  font-size: 11.5px; letter-spacing: .06em; color: rgba(226, 238, 252, .6);
}
.preview-bar a { color: #7ad4ff; font-weight: 600; }
.preview-bar a:hover { text-decoration: underline; }

/* 进出都短：鼠标停住的瞬间就出来，移开立刻收，不做花哨缓动 */
.prev-enter-active { transition: opacity .16s ease, transform .2s cubic-bezier(.2, .9, .3, 1); }
.prev-leave-active { transition: opacity .13s ease, transform .13s ease; }
.prev-enter-from { opacity: 0; transform: translateY(8px); }
.prev-leave-to { opacity: 0; transform: translateY(4px); }

/* ---------- 商品区标题栏 ---------- */
.toolbar {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 16px; flex-wrap: wrap; margin: 40px 0 16px;
}
.toolbar .head .kicker { margin-bottom: 8px; }
.toolbar h2 {
  font-family: var(--sans-strong); font-weight: 600; font-size: 24px; letter-spacing: .05em;
  color: var(--text); display: flex; align-items: baseline; gap: 10px;
}
.toolbar h2 small {
  font-family: var(--sans-strong); font-weight: 500; font-size: 12.5px; letter-spacing: .06em;
  color: var(--muted); opacity: .9;
}
.sort-wrap { display: flex; align-items: center; gap: 8px; }
.lab { font-family: var(--sans-strong); font-weight: 600; font-size: 12.5px; letter-spacing: .08em; color: var(--muted); }
.sort {
  border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px;
  font-size: 13px; background: var(--card); color: var(--text);
  font-family: var(--sans-strong); font-weight: 600; cursor: pointer; outline: none; transition: .18s;
}
.sort:hover, .sort:focus { border-color: var(--primary); color: var(--primary); }

/* ---------- 筛选条 ---------- */
.filters {
  display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
  margin-bottom: 22px; padding: 12px 16px;
  background: var(--card); border: 1px solid var(--line); border-radius: 14px;
}
.filters .sep { margin-left: 8px; }
.filters input {
  width: 84px; border: 1px solid var(--line); border-radius: 999px; padding: 7px 12px;
  background: var(--bg); color: var(--text); outline: none; font-size: 13px;
  text-align: center; transition: .18s;
}
.filters input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(43, 108, 184, .14); }
.dash { color: var(--muted); }
.filters .filter-btn {
  border: 1px solid var(--hairline); border-radius: 999px; padding: 7px 20px;
  background: transparent; color: var(--primary); font-family: var(--sans-strong);
  font-weight: 600; font-size: 13px; letter-spacing: .12em; text-indent: .12em; transition: .18s;
}
.filters .filter-btn:hover { background: rgba(43, 108, 184, .07); border-color: var(--primary); }
.chip {
  font-size: 12px; padding: 6px 13px; border-radius: 999px;
  border: 1px solid var(--line); color: var(--muted); background: transparent;
  cursor: pointer; font-family: var(--sans-strong); font-weight: 500;
  letter-spacing: .02em; transition: .18s;
}
.chip:hover { border-color: var(--primary); color: var(--primary); }
.chip.on {
  background: rgba(43, 108, 184, .08); border-color: var(--primary);
  color: var(--primary); font-weight: 600;
}

/* ---------- 商品卡片：细线、留白、衬线标题 ---------- */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(196px, 1fr)); gap: 20px; }
.grid :deep(.card) {
  border: 1px solid var(--line); border-radius: 18px;
  box-shadow: 0 1px 2px rgba(30, 60, 110, .05);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.grid :deep(.card:hover) {
  transform: translateY(-5px);
  box-shadow: 0 18px 34px rgba(30, 60, 110, .14);
  border-color: var(--hairline);
}
.grid :deep(.card .thumb) { height: 168px; font-size: 62px; background: var(--thumb-bg); }
.grid :deep(.card .body) { padding: 15px 15px 17px; gap: 5px; }
.grid :deep(.card .name) { font-family: var(--sans-strong); font-weight: 600; font-size: 15px; letter-spacing: .01em; }
.grid :deep(.card .desc) { letter-spacing: .02em; line-height: 1.55; }
.grid :deep(.card .price) { letter-spacing: .02em; margin-top: 2px; }
.grid :deep(.card .add) {
  background: transparent; color: var(--primary); border: 1px solid var(--hairline);
  border-radius: 999px; font-family: var(--sans-strong); font-weight: 600; font-size: 13.5px;
  letter-spacing: .1em; text-indent: .1em; padding: 10px; margin-top: 9px; transition: .2s;
}
.grid :deep(.card .add:hover) {
  background: linear-gradient(135deg, var(--primary), #659edb); color: #fff;
  border-color: transparent; box-shadow: 0 8px 16px rgba(43, 108, 184, .24);
}
.grid :deep(.card .add:disabled) { background: var(--line); color: var(--muted); border-color: transparent; }
.grid :deep(.card .fav) { background: rgba(255, 255, 255, .9); box-shadow: 0 2px 8px rgba(30, 60, 110, .1); }
.grid :deep(.tag-badge) { border-radius: 999px; letter-spacing: .08em; }

.empty { grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 56px 0 64px; }
.empty .empty-t { font-family: var(--sans-strong); font-weight: 600; font-size: 16px; letter-spacing: .04em; color: var(--text); }
.empty-tip { font-size: 13px; margin-top: 6px; opacity: .8; }

/* ---------- 分页 ---------- */
.pager { display: flex; justify-content: center; gap: 9px; margin-top: 34px; }
.pager button {
  min-width: 38px; height: 38px; border-radius: 999px; border: 1px solid var(--line);
  background: var(--card); color: var(--text); font-family: var(--sans-strong);
  font-weight: 600; font-size: 13px; transition: .18s;
}
.pager button:hover:not(:disabled):not(.on) { border-color: var(--primary); color: var(--primary); }
.pager button.on {
  background: linear-gradient(135deg, var(--primary), #659edb); color: #fff;
  border-color: transparent; box-shadow: 0 6px 14px rgba(43, 108, 184, .26);
}
.pager button:disabled { opacity: .35; cursor: not-allowed; }

/* ---------- 自适应 ---------- */
@media (max-width: 900px) {
  /* 这一档还是左右两栏，只把插画列收窄：竖版插画在这个比例下几乎能整张露出来 */
  .hero { grid-template-columns: 34% minmax(0, 1fr); }
  .hero-art { padding: 22px 18px; min-height: 0; background-position: center 16%; }
  /* 列窄了，四条卖点会把文字块顶到插画脸上去，这一档整块文案都收起来 */
  .hero-art ul { display: none; }
  /* 卖点收起来后，这条分隔线上面没有字可隔，留着会变成一根孤零零的色条 */
  .rule { display: none; }
  .hero-main { padding: 24px 22px 20px; min-height: 0; }
  .stage { min-height: 168px; }
  .scene h1 { font-size: 26px; }
  .hero-foot { flex-direction: column; align-items: flex-start; gap: 14px; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
  .grid :deep(.card .thumb) { height: 134px; font-size: 46px; }
}

@media (max-width: 640px) {
  /* 手机上是横条，插画自己就把画面占满了，再压字会盖住脸：这里只留图 */
  .hero { grid-template-columns: 1fr; }
  .hero-art {
    order: -1; min-height: 0; height: 280px; padding: 0;
    background-position: center 12%;
  }
  .hero-art::before { background: none; }
  /* 底部融进卡片，不留硬边 */
  .hero-art::after {
    background: linear-gradient(to bottom, rgba(15, 33, 55, .16) 0%, rgba(15, 33, 55, 0) 24%, rgba(15, 33, 55, 0) 70%, var(--card) 100%);
  }
  .art-copy { display: none; }
  .scene h1 { font-size: 24px; }
}
</style>
