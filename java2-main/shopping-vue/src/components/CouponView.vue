<template>
  <div class="page">
    <div class="wrap">
      <!-- 顶部活动横幅 -->
      <div class="cp-hero">
        <div class="cp-hero-txt">
          <h1>🎁 领券中心</h1>
          <p>新注册用户可领 ¥50 无门槛新人券；另外三张要靠扫雷闯关拿（连续 2 次 / 5 次安全点击、通关）</p>
        </div>
        <div class="cp-hero-emoji">🧧</div>
      </div>

      <!-- 新人专享大额券：只有刚注册的账号能领。
           登录时弹窗点了「暂不需要」，这张券就留在这里，随时可以补领。 -->
      <section v-if="showNewbie" class="cp-newbie">
        <div class="cn-left">
          <span class="cn-tag">新人专享</span>
          <div class="cn-amt"><span>¥</span><b>{{ newbie.coupon.val }}</b></div>
          <div class="cn-cond">{{ newbie.coupon.cond }}</div>
        </div>
        <div class="cn-right">
          <h2>{{ newbie.coupon.title }}</h2>
          <p class="cn-desc">{{ newbie.coupon.desc }}</p>
          <p class="cn-tip">{{ newbieTip }}</p>
          <button v-if="newbie.can" class="cn-btn" :disabled="claiming" @click="onClaimNewbie">
            {{ claiming ? '领取中…' : (store.user ? '立即领取' : '登录领取') }}
          </button>
          <span v-else class="cn-done">已领取 · 结算可直接抵扣</span>
        </div>
      </section>

      <!-- 三档奖励：只展示，领券全靠下面的扫雷闯关 -->
      <div class="cp-grid">
        <div
          v-for="t in tiers"
          :key="t.code"
          class="cp-card"
          :class="{ got: hasGot(t.code) }"
        >
          <div class="cp-left">
            <div class="cp-amount">
              <span class="cp-num">{{ t.coupon ? t.coupon.amount : '—' }}</span>
            </div>
            <div class="cp-cond">{{ t.coupon ? t.coupon.cond : '待补券' }}</div>
          </div>
          <div class="cp-right">
            <div class="cp-title">{{ t.coupon ? t.coupon.title : '券池待补' }}</div>
            <div class="cp-desc">{{ t.hint }}</div>
            <!-- 这里只反映「领没领到」；实时进度（还差几次）在下面的游戏面板里 -->
            <span class="cp-state" :class="{ on: hasGot(t.code) }">
              {{ hasGot(t.code) ? '已领取' : t.need === 0 ? '通关可得' : `连点 ${t.need} 次可得` }}
            </span>
          </div>
          <!-- 装饰缺口 -->
          <span class="cp-notch top"></span>
          <span class="cp-notch bottom"></span>
        </div>
      </div>
      <p class="cp-hint">
        下面这三张券没有领取按钮，只能靠扫雷闯关拿到：达成条件即刻发放，自动进入「我的优惠券」，每人每张限领一次。
      </p>

      <!-- 扫雷小游戏：连续 2 次 / 5 次安全点击 / 通关，各送一张券 -->
      <MineGame />

      <!-- 我的优惠券 -->
      <div class="cp-mine">
        <h2>我的优惠券 <small>({{ myCount }})</small></h2>
        <p v-if="!myCount" class="cp-empty">还没有优惠券：新注册用户可领新人券，其余靠下面的扫雷闯关拿到～</p>
        <div class="cp-mine-list" v-else>
          <span
            v-for="c in myCoupons"
            :key="c.code"
            class="cp-mine-chip"
          >{{ c.amount }} {{ c.title }}</span>
        </div>
      </div>

      <button class="btn ghost cp-back" @click="go('home')">← 返回首页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { store, go, loadMyCoupons, loadCouponPool, newbieState, claimNewbieCoupon, openAuth } from '../store.js'
import { MINE_TIERS } from '../data.js'
import MineGame from './MineGame.vue'

// 三档奖励：券面信息取券池（数据库 coupon 表），档位条件取 data.js 的 MINE_TIERS
const tiers = computed(() =>
  MINE_TIERS.map((t) => ({
    ...t,
    coupon: (store.couponPool || []).find((c) => c.code === t.code) || null,
  }))
)
const hasGot = (code) => store.myCoupons.includes(code)

// ---------- 新人专享大额券 ----------
// 券池里 source = 'newbie' 的那张；只有「刚注册、还没领过」的账号能领。
// 未登录时也展示（按钮变成「登录领取」），已经不符合条件的老用户则整块隐藏，避免出现点不动的死按钮。
const newbie = computed(() => newbieState())
const showNewbie = computed(() => !!newbie.value.coupon && (!store.user || newbie.value.can || newbie.value.got))
const newbieTip = computed(() => {
  if (newbie.value.got) return '已在「我的优惠券」里，结算时可以勾选抵扣'
  if (!store.user) return '登录后领取，仅限新注册账号'
  return '无门槛，领取后立刻进「我的优惠券」'
})
const claiming = ref(false)
async function onClaimNewbie() {
  if (!store.user) { openAuth('login'); return }
  if (claiming.value) return
  claiming.value = true
  await claimNewbieCoupon()
  claiming.value = false
}

// 只认券池里还存在的券：后台删掉某张券后，用户本地残留的旧券码不会把计数撑大
const myCoupons = computed(() =>
  store.myCoupons
    .map((code) => store.couponPool.find((c) => c.code === code))
    .filter(Boolean)
)
const myCount = computed(() => myCoupons.value.length)

// 进入领券中心时，先从后端同步券池（coupon 表）+ 当前用户已领取的券（未登录则不拉已领）
onMounted(() => {
  loadCouponPool()
  if (store.user) loadMyCoupons()
})

// 在页面上登录后，把「我的优惠券」同步一次（游戏那边会自动补发已达成的券）
watch(() => store.user, (u) => { if (u) loadMyCoupons() })
</script>

<style scoped>
.page{padding:24px 0 50px}
.cp-hero{
  display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(120deg,#2b6cb8,#4a90d9 55%,#5b9bd5);
  color:#fff;border-radius:var(--radius);box-shadow:var(--shadow);
  padding:28px 32px;margin-bottom:24px;
}
.cp-hero-txt h1{font-size:26px;margin-bottom:6px}
.cp-hero-txt p{font-size:14px;opacity:.95}
.cp-hero-emoji{font-size:64px;animation:float 2.5s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

/* ---------- 新人专享大额券 ---------- */
.cp-newbie{
  display:flex;align-items:stretch;overflow:hidden;margin-bottom:18px;
  background:var(--card);border-radius:14px;box-shadow:var(--shadow);
  border:1px solid rgba(209,68,42,.22);
}
.cn-left{
  position:relative;width:152px;flex-shrink:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  padding:20px 12px;color:#fff;text-align:center;
  background:linear-gradient(162deg,#c0392b,#d9502f 52%,#e8883c);
  border-right:1px dashed rgba(255,255,255,.55);
}
.cn-tag{
  font-size:10px;font-weight:700;letter-spacing:.16em;
  padding:2px 9px;border-radius:999px;background:rgba(255,255,255,.22);
}
.cn-amt{display:flex;align-items:baseline;gap:2px;margin-top:2px}
.cn-amt span{font-size:15px;font-weight:700;opacity:.92}
.cn-amt b{font-size:34px;font-weight:800;line-height:1.05;letter-spacing:-.02em}
.cn-cond{font-size:11.5px;opacity:.9}
.cn-right{flex:1;min-width:0;padding:18px 20px;display:flex;flex-direction:column;justify-content:center;gap:5px}
.cn-right h2{font-size:17px;font-weight:700}
.cn-desc{font-size:12.5px;color:var(--muted)}
.cn-tip{font-size:11.5px;color:var(--muted)}
.cn-btn{
  margin-top:8px;align-self:flex-start;padding:8px 22px;border-radius:999px;
  font-size:13px;font-weight:700;color:#fff;
  background:linear-gradient(120deg,#c0392b,#e07a32);
  box-shadow:0 6px 16px rgba(196,60,30,.28);transition:filter .15s,transform .12s;
}
.cn-btn:hover{filter:brightness(1.06);transform:translateY(-1px)}
.cn-btn:disabled{opacity:.7;cursor:not-allowed;transform:none}
.cn-done{
  margin-top:8px;align-self:flex-start;
  font-size:12px;font-weight:600;color:#2f855a;
  border:1px solid rgba(47,133,90,.4);background:rgba(47,133,90,.08);
  border-radius:999px;padding:5px 12px;
}
[data-theme="dark"] .cn-done{color:#68d391;border-color:rgba(104,211,145,.4);background:rgba(104,211,145,.1)}

.cp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px;margin-bottom:28px}
.cp-card{
  position:relative;display:flex;background:var(--card);border-radius:14px;
  box-shadow:var(--shadow);overflow:hidden;transition:.2s;
}
.cp-card:hover{transform:translateY(-3px)}
.cp-left{
  width:132px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  background:linear-gradient(160deg,var(--primary),var(--primary-dark));
  color:#fff;padding:20px 12px;border-right:1px dashed rgba(255,255,255,.5);
}
.cp-num{font-size:26px;font-weight:800;letter-spacing:.5px}
.cp-cond{font-size:12px;background:rgba(255,255,255,.22);padding:3px 10px;border-radius:999px}
.cp-right{flex:1;padding:18px 20px;display:flex;flex-direction:column;justify-content:center;gap:6px}
.cp-title{font-size:16px;font-weight:700}
.cp-desc{font-size:12px;color:var(--muted)}
/* 状态标签：只表示「已领取 / 未解锁」，页面上没有可直接点的领取按钮了 */
.cp-state{
  margin-top:6px;align-self:flex-start;
  font-size:12px;font-weight:600;color:var(--muted);
  border:1px solid var(--line);border-radius:999px;padding:4px 12px;
}
.cp-state.on{color:#2f855a;border-color:rgba(47,133,90,.4);background:rgba(47,133,90,.08)}
[data-theme="dark"] .cp-state.on{color:#68d391;border-color:rgba(104,211,145,.4);background:rgba(104,211,145,.1)}
.cp-card.got{opacity:.75}
.cp-hint{margin:-10px 0 26px;font-size:12.5px;color:var(--muted)}
.cp-notch{position:absolute;right:112px;width:18px;height:18px;background:var(--bg);border-radius:50%}
.cp-notch.top{top:-9px}
.cp-notch.bottom{bottom:-9px}

.cp-mine{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px;margin-bottom:20px}
.cp-mine h2{font-size:18px;margin-bottom:14px}
.cp-mine h2 small{font-size:13px;color:var(--muted);font-weight:400}
.cp-empty{color:var(--muted);font-size:14px;padding:10px 0}
.cp-mine-list{display:flex;flex-wrap:wrap;gap:10px}
.cp-mine-chip{
  background:linear-gradient(160deg,#f0f6ff,#dfeaff);color:#2b6cb8;
  border:1px solid #c3d7f0;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:600;
}
[data-theme="dark"] .cp-mine-chip{background:rgba(74,144,217,.15);color:#7fb3e8;border-color:rgba(74,144,217,.35)}
.cp-back{display:inline-block}

@media(max-width:640px){
  .cp-hero{padding:20px}.cp-hero-emoji{font-size:44px}
  .cp-grid{grid-template-columns:1fr}
  .cp-left{width:110px}.cp-notch{right:95px}
  /* 窄屏：券面窄一点，右侧文案别被挤成两行碎句 */
  .cn-left{width:118px;padding:18px 8px}
  .cn-amt b{font-size:29px}
  .cn-right{padding:16px 16px}
  .cn-right h2{font-size:15.5px}
}
</style>
