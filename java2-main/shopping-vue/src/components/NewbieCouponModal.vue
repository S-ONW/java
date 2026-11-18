<template>
  <!-- 新人礼弹窗：只在「刚注册、还没领过新人券」的账号登录后出现一次 -->
  <div class="modal open" @click.self="dismissNewbieCoupon">
    <div class="nb-box" role="dialog" aria-modal="true" aria-label="新人专享大额券">
      <button class="nb-close" aria-label="关闭" @click="dismissNewbieCoupon">✕</button>

      <p class="nb-kicker">NEW MEMBER GIFT</p>
      <h2 class="nb-title">新人专享大额券</h2>
      <p class="nb-sub" v-if="store.user">Hi {{ store.user.nick }}，欢迎加入{{ SHOP_NAME }}</p>
      <p class="nb-sub" v-else>欢迎加入{{ SHOP_NAME }}</p>

      <div class="nb-ticket" v-if="coupon">
        <div class="nb-amt">
          <span class="nb-cur">¥</span><b>{{ coupon.val }}</b>
        </div>
        <div class="nb-info">
          <p class="nb-name">{{ coupon.title }}</p>
          <p class="nb-desc">{{ coupon.desc }}</p>
          <span class="nb-cond">{{ coupon.cond }} · 全场通用</span>
        </div>
      </div>
      <p v-else class="nb-empty">新人券暂时补货中，稍后可在领券中心查看</p>

      <ul class="nb-points">
        <li>注册即送，不用凑单</li>
        <li>无门槛，直接抵现</li>
        <li>每人限领一次，自动进「我的优惠券」</li>
      </ul>

      <button class="nb-btn" :disabled="loading || !coupon" @click="onClaim">
        {{ loading ? '领取中…' : '立即领取' }}
      </button>
      <button class="nb-later" @click="dismissNewbieCoupon">暂不需要，先去逛逛</button>

      <p class="nb-tip">点「暂不需要」也别担心，这张券会留在「领券中心」，随时能领。</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { newbieCoupon, claimNewbieCoupon, dismissNewbieCoupon, store } from '../store.js'
import { SHOP_NAME } from '../brand.js'

const coupon = computed(() => newbieCoupon())
const loading = ref(false)

async function onClaim() {
  if (loading.value || !coupon.value) return
  loading.value = true
  await claimNewbieCoupon()
  loading.value = false
}
</script>

<style scoped>
.nb-box{
  position:relative;width:100%;max-width:418px;overflow:hidden;
  padding:26px 24px 18px;text-align:center;color:#fff;
  border-radius:20px;
  background:linear-gradient(168deg,#a92b1c 0%,#d1442a 42%,#e07a32 78%,#e89b3f 100%);
  box-shadow:0 26px 64px rgba(96,24,8,.46);
}
/* 两团柔光，让纯色渐变有点灯箱质感 */
.nb-box::before,
.nb-box::after{
  content:'';position:absolute;border-radius:50%;pointer-events:none;
}
.nb-box::before{width:260px;height:260px;top:-140px;left:-80px;background:radial-gradient(circle,rgba(255,214,140,.5),transparent 68%)}
.nb-box::after{width:220px;height:220px;right:-90px;bottom:-110px;background:radial-gradient(circle,rgba(255,120,80,.42),transparent 70%)}

.nb-close{
  position:absolute;top:12px;right:14px;z-index:3;
  width:30px;height:30px;border-radius:50%;
  background:rgba(255,255,255,.16);color:#fff;font-size:13px;line-height:1;
  display:flex;align-items:center;justify-content:center;
}
.nb-close:hover{background:rgba(255,255,255,.3)}

.nb-kicker{
  position:relative;z-index:1;font-size:10px;font-weight:700;
  letter-spacing:.28em;color:rgba(255,236,200,.9);margin-bottom:8px;
}
.nb-title{
  position:relative;z-index:1;
  font-family:var(--display);font-size:23px;font-weight:800;letter-spacing:.04em;
  text-shadow:0 2px 14px rgba(80,16,4,.4);
}
.nb-sub{position:relative;z-index:1;margin-top:6px;font-size:12.5px;color:rgba(255,244,229,.9)}

/* ---------- 券面 ---------- */
.nb-ticket{
  position:relative;z-index:1;display:flex;align-items:center;gap:14px;
  margin:16px 0 14px;padding:14px 16px;
  background:rgba(255,255,255,.14);
  border:1px dashed rgba(255,255,255,.5);
  border-radius:14px;text-align:left;
  backdrop-filter:blur(3px);
}
.nb-amt{display:flex;align-items:baseline;gap:2px;flex-shrink:0;color:#fff4d2}
.nb-amt .nb-cur{font-size:16px;font-weight:700;opacity:.9}
.nb-amt b{font-size:44px;font-weight:800;line-height:1;letter-spacing:-.02em;text-shadow:0 3px 16px rgba(110,26,6,.5)}
.nb-info{min-width:0}
.nb-name{font-size:14px;font-weight:700;letter-spacing:.02em}
.nb-desc{margin-top:3px;font-size:11.5px;color:rgba(255,244,229,.86)}
.nb-cond{
  display:inline-block;margin-top:8px;padding:2px 9px;border-radius:999px;
  font-size:11px;font-weight:600;color:#7a1f0d;background:rgba(255,246,224,.92);
}
.nb-empty{position:relative;z-index:1;margin:18px 0;font-size:13px;color:rgba(255,244,229,.9)}

/* ---------- 权益点 ---------- */
.nb-points{
  position:relative;z-index:1;list-style:none;
  display:flex;flex-direction:column;gap:6px;
  margin-bottom:16px;text-align:left;
}
.nb-points li{
  display:flex;align-items:center;gap:8px;
  font-size:12.5px;color:rgba(255,246,232,.95);
}
.nb-points li::before{
  content:'';flex-shrink:0;width:5px;height:5px;border-radius:50%;
  background:#ffe6b8;box-shadow:0 0 8px rgba(255,220,160,.8);
}

/* ---------- 按钮 ---------- */
.nb-btn{
  position:relative;z-index:1;width:100%;padding:13px;
  border-radius:12px;font-size:15px;font-weight:800;letter-spacing:.06em;
  color:#a3230f;background:linear-gradient(180deg,#fff7e6,#ffe6b8);
  box-shadow:0 10px 22px rgba(84,20,4,.35);
  transition:transform .12s,box-shadow .12s;
}
.nb-btn:hover{transform:translateY(-1px);box-shadow:0 14px 26px rgba(84,20,4,.42)}
.nb-btn:disabled{opacity:.7;cursor:not-allowed;transform:none}
.nb-later{
  position:relative;z-index:1;margin-top:10px;width:100%;padding:8px;
  background:none;color:rgba(255,244,229,.86);font-size:12.5px;
}
.nb-later:hover{color:#fff;text-decoration:underline}
.nb-tip{
  position:relative;z-index:1;margin-top:6px;
  font-size:11px;line-height:1.6;color:rgba(255,240,220,.72);
}

@media(max-width:480px){
  .nb-box{padding:22px 18px 14px;border-radius:16px}
  .nb-title{font-size:20px}
  .nb-amt b{font-size:38px}
  .nb-ticket{padding:12px 13px;gap:11px}
}
</style>
