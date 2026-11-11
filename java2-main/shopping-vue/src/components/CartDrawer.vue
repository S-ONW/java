<template>
  <div class="drawer" :class="{ open: store.drawer === 'cart' }">
    <header>
      <h3>我的购物车</h3>
      <button class="close" @click="closeDrawer">✕</button>
    </header>
    <div class="items">
      <div v-if="!ids.length" class="empty">
        <img class="mascot sm" :src="mascotCalm" alt="购物车是空的" />
        购物车还是空的 🛒
      </div>
      <div v-for="id in ids" :key="id" class="item">
        <div class="ic">{{ pById(id).icon }}</div>
        <div class="info">
          <div class="n">{{ pById(id).name }}</div>
          <div class="pp">
            {{ money(pById(id).price) }} × {{ store.cart[id] }} =
            {{ money(pById(id).price * store.cart[id]) }}
          </div>
          <div class="qty">
            <button @click="cartInc(id)">−</button>
            <span>{{ store.cart[id] }}</span>
            <button @click="cartDec(id)">+</button>
          </div>
        </div>
        <button class="del" @click="cartDel(id)">移除</button>
      </div>
    </div>
    <div class="coupon" style="padding:0;border:none">
      <div v-if="!myCoupons.length" class="cp-tip">暂无可用优惠券</div>
      <div v-else class="cp-list">
        <div
          v-for="c in myCoupons"
          :key="c.code"
          class="cp-item"
          :class="{ on: store.coupon === c.code, dis: !c.usable }"
          @click="onPick(c)"
        >
          <span class="cp-amount">{{ c.amount }}</span>
          <span class="cp-title">{{ c.title }}</span>
          <span class="cp-state" :class="{ lock: !c.usable }">
            {{ !c.usable ? '未达门槛' : (store.coupon === c.code ? '已选 ✓' : '使用') }}
          </span>
        </div>
      </div>
      <div v-if="store.coupon" class="cp-cancel" @click="clearCoupon">取消使用</div>
    </div>
    <div class="foot">
      <div class="row"><span>商品小计</span><span>{{ money(cartSub) }}</span></div>
      <div class="row" v-show="disc > 0">
        <span>优惠减免</span><span style="color:var(--ok)">-{{ money(disc) }}</span>
      </div>
      <div class="row"><span>运费</span><span>{{ ship === 0 ? '包邮' : money(ship) }}</span></div>
      <div class="row total"><span>合计</span><span class="t-price">{{ money(total) }}</span></div>
      <button class="btn block" @click="toCheckout">去结算</button>
    </div>
  </div>
</template>

<script setup>
import mascotCalm from '../assets/mascot/calm.png'
import { computed, onMounted } from 'vue'
import {
  store, pById, money, cartSub, couponDisc, couponInfo, shipFee,
  cartInc, cartDec, cartDel, selectCoupon, clearCoupon, loadMyCoupons,
  toCheckout, closeDrawer, toast,
} from '../store.js'

const ids = computed(() => Object.keys(store.cart))
const disc = computed(() => couponDisc(cartSub.value))
const ship = computed(() => shipFee(cartSub.value))
const total = computed(() => Math.max(0, cartSub.value - disc.value) + ship.value)

// 已领取的优惠券，附上「当前订单是否可用」判断
const myCoupons = computed(() =>
  store.myCoupons
    .map((code) => couponInfo(code))
    .filter(Boolean)
    .map((c) => ({ ...c, usable: cartSub.value >= (c.min || 0) }))
)

// 打开购物车时同步已领券
onMounted(() => { if (store.user) loadMyCoupons() })

function onPick(c) {
  if (!c.usable) { toast('订单金额未达到该券使用门槛'); return }
  if (store.coupon === c.code) { clearCoupon(); return }
  selectCoupon(c.code)
}
</script>

<style scoped>
.cp-tip{font-size:12px;color:var(--muted);padding:4px 0}
.cp-list{display:flex;flex-direction:column;gap:8px}
.cp-item{
  display:flex;align-items:center;gap:10px;
  border:1px solid var(--line);border-radius:10px;padding:8px 12px;
  cursor:pointer;transition:.15s;background:var(--card);font-size:13px;
}
.cp-item:hover{border-color:var(--primary)}
.cp-item.on{border-color:var(--primary);background:rgba(43,108,184,.10)}
.cp-item.dis{opacity:.55;cursor:not-allowed}
.cp-amount{font-weight:800;color:var(--primary);background:var(--bg);border-radius:8px;padding:4px 8px;flex-shrink:0}
.cp-title{flex:1;min-width:0;font-weight:600}
.cp-state{flex-shrink:0;font-size:12px;color:var(--primary);border:1px solid var(--primary);border-radius:999px;padding:2px 10px;font-weight:600}
.cp-state.lock{color:var(--muted);border-color:var(--line);background:var(--bg)}
.cp-cancel{font-size:12px;color:var(--muted);text-align:right;margin-top:6px;cursor:pointer}
.cp-cancel:hover{color:var(--primary)}
</style>
