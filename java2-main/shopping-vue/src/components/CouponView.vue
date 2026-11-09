<template>
  <div class="page">
    <div class="wrap">
      <!-- 顶部活动横幅 -->
      <div class="cp-hero">
        <div class="cp-hero-txt">
          <h1>🎁 领券中心</h1>
          <p>精选优惠券限时放送，先到先得，手慢无！</p>
        </div>
        <div class="cp-hero-emoji">🧧</div>
      </div>

      <!-- 优惠券列表 -->
      <div class="cp-grid">
        <div
          v-for="c in couponPool"
          :key="c.code"
          class="cp-card"
          :class="{ got: hasGot(c.code) }"
        >
          <div class="cp-left">
            <div class="cp-amount">
              <span class="cp-num">{{ c.amount }}</span>
            </div>
            <div class="cp-cond">{{ c.cond }}</div>
          </div>
          <div class="cp-right">
            <div class="cp-title">{{ c.title }}</div>
            <div class="cp-desc">{{ c.desc }}</div>
            <button
              class="cp-btn"
              :class="{ done: hasGot(c.code) }"
              :disabled="hasGot(c.code)"
              @click="onClaim(c)"
            >{{ hasGot(c.code) ? '已领取' : '立即领取' }}</button>
          </div>
          <!-- 装饰缺口 -->
          <span class="cp-notch top"></span>
          <span class="cp-notch bottom"></span>
        </div>
      </div>

      <!-- 我的优惠券 -->
      <div class="cp-mine">
        <h2>我的优惠券 <small>({{ myCount }})</small></h2>
        <p v-if="!myCount" class="cp-empty">还没有领取优惠券，快去上面领取吧～</p>
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
import { store, go, claimCoupon, loadMyCoupons, openAuth } from '../store.js'

const couponPool = computed(() => store.couponPool)
const hasGot = (code) => store.myCoupons.includes(code)
const myCount = computed(() => store.myCoupons.length)
const myCoupons = computed(() =>
  store.myCoupons
    .map((code) => store.couponPool.find((c) => c.code === code))
    .filter(Boolean)
)

// 进入领券中心时，从后端同步当前用户已领取的券（未登录则无需拉取）
onMounted(() => { if (store.user) loadMyCoupons() })

// 记录未登录时想领取的券，登录成功后自动领取
const pendingCode = ref(null)
async function onClaim(c) {
  const res = await claimCoupon(c.code)
  // 未登录时弹出登录提示，并记住这张券，登录后自动领取
  if (res === 'login') {
    pendingCode.value = c.code
    openAuth('login')
  }
}

watch(
  () => store.user,
  (u) => {
    if (u) {
      // 登录成功后先同步已领券，再自动领取之前想领的那张
      loadMyCoupons()
      if (pendingCode.value) {
        claimCoupon(pendingCode.value)
        pendingCode.value = null
      }
    }
  }
)
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
.cp-btn{
  margin-top:6px;align-self:flex-start;background:var(--primary);color:#fff;
  border-radius:999px;padding:7px 20px;font-weight:600;font-size:13px;transition:.15s;
}
.cp-btn:hover{background:var(--primary-dark)}
.cp-btn.done{background:var(--line);color:var(--muted);cursor:not-allowed}
.cp-card.got{opacity:.75}
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
}
</style>
