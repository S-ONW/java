<template>
  <div class="wrap page">
    <div class="section-title">确认订单 <span class="back" @click="go('home')">← 继续购物</span></div>
    <div v-if="!ids.length" class="empty">购物车是空的，去逛逛吧 🛒</div>
    <div class="ck" v-else>
      <div>
        <div class="panel">
          <h3>收货地址</h3>
          <div v-if="store.addresses.length">
            <div
              v-for="a in store.addresses"
              :key="a.id"
              class="addr-card"
              :class="{ on: store.selAddr === a.id }"
              @click="selectAddr(a.id)"
            >
              <div>
                <b>{{ a.name }}</b> <span style="color:var(--muted)">{{ a.phone }}</span>
                <span v-if="a.def" class="def">默认</span><br />
                <small style="color:var(--muted)">{{ a.area }} {{ a.detail }}</small>
              </div>
              <div class="ops">
                <span @click.stop="editAddr(a.id)">编辑</span>
                <span @click.stop="deleteAddr(a.id)">删除</span>
              </div>
            </div>
          </div>
          <p v-else style="color:var(--muted)">还没有收货地址，请先添加。</p>
          <button class="btn ghost" @click="openAddrForm(null)">+ 新增地址</button>
        </div>

        <div class="panel">
          <h3>支付方式</h3>
          <div class="pay">
            <div
              v-for="[v, i, n] in pays"
              :key="v"
              class="opt"
              :class="{ on: store.payMethod === v }"
              @click="setPayMethod(v)"
            >
              <div class="ic">{{ i }}</div>
              <div class="nm">{{ n }}</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>优惠券</h3>
          <div v-if="!myCoupons.length" class="cp-tip">
            暂无可用优惠券，
            <a @click="go('coupon')" style="color:var(--primary);cursor:pointer">去领券中心领取</a>
          </div>
          <div v-else class="cp-list">
            <div
              v-for="c in myCoupons"
              :key="c.code"
              class="cp-item"
              :class="{ on: store.coupon === c.code, dis: !c.usable }"
              @click="onPick(c)"
            >
              <div class="cp-item-amount">{{ c.amount }}</div>
              <div class="cp-item-info">
                <div class="cp-item-title">{{ c.title }}</div>
                <div class="cp-item-cond">{{ c.cond }}</div>
              </div>
              <div class="cp-item-state">
                <span v-if="c.usable && store.coupon !== c.code" class="cp-use">使用</span>
                <span v-else-if="c.usable && store.coupon === c.code" class="cp-used">已选 ✓</span>
                <span v-else class="cp-lock">未达门槛</span>
              </div>
            </div>
          </div>
          <div v-if="store.coupon" class="cp-cancel" @click="clearCoupon">取消使用优惠券</div>
        </div>
      </div>

      <div class="panel" style="align-self:start">
        <h3>订单摘要</h3>
        <div class="ck-list">
          <div v-for="id in ids" :key="id" class="ci">
            <div class="ic">{{ pById(id).icon }}</div>
            <div class="nm">
              {{ pById(id).name }}<br />
              <small style="color:var(--muted)">{{ money(pById(id).price) }} × {{ store.cart[id] }}</small>
            </div>
            <div class="pr">{{ money(pById(id).price * store.cart[id]) }}</div>
          </div>
        </div>
        <div class="sum-row"><span>商品小计</span><span>{{ money(cartSub) }}</span></div>
        <div class="sum-row"><span>优惠减免</span><span style="color:var(--ok)">-{{ money(disc) }}</span></div>
        <div class="sum-row"><span>运费</span><span>{{ ship === 0 ? '包邮' : money(ship) }}</span></div>
        <div class="sum-row big"><span>应付</span><span class="t">{{ money(total) }}</span></div>
        <button class="btn block" @click="placeOrder">提交订单</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import {
  store, pById, money, cartSub, couponDisc, couponInfo, shipFee,
  go, selectAddr, editAddr, deleteAddr, setPayMethod, openAddrForm,
  selectCoupon, clearCoupon, placeOrder, toast, loadMyCoupons,
} from '../store.js'

const pays = [['wechat', '💚', '微信支付'], ['alipay', '🔵', '支付宝'], ['cod', '📦', '货到付款']]
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

// 进入结账页时同步已领券
onMounted(() => { if (store.user) loadMyCoupons() })

function onPick(c) {
  if (!c.usable) { toast('订单金额未达到该券使用门槛'); return }
  if (store.coupon === c.code) { clearCoupon(); return }
  selectCoupon(c.code)
}

watch(
  ids,
  (v) => { if (!v.length) { toast('购物车是空的'); go('home') } },
  { immediate: true }
)
</script>

<style scoped>
.cp-tip{font-size:13px;color:var(--muted);padding:6px 0}
.cp-list{display:flex;flex-direction:column;gap:10px}
.cp-item{
  display:flex;align-items:center;gap:14px;
  border:1px solid var(--line);border-radius:12px;padding:12px 14px;
  cursor:pointer;transition:.15s;background:var(--card);
}
.cp-item:hover{border-color:var(--primary)}
.cp-item.on{border-color:var(--primary);background:rgba(43,108,184,.10);box-shadow:0 0 0 2px rgba(43,108,184,.18)}
.cp-item.dis{opacity:.55;cursor:not-allowed}
.cp-item-amount{
  min-width:64px;text-align:center;font-size:18px;font-weight:800;color:var(--primary);
  background:var(--bg);border-radius:10px;padding:10px 8px;flex-shrink:0;
}
.cp-item-info{flex:1;min-width:0}
.cp-item-title{font-size:14px;font-weight:600}
.cp-item-cond{font-size:12px;color:var(--muted);margin-top:2px}
.cp-item-state{flex-shrink:0}
.cp-use{font-size:12px;color:var(--primary);border:1px solid var(--primary);border-radius:999px;padding:4px 12px;font-weight:600}
.cp-used{font-size:12px;color:#fff;background:var(--primary);border-radius:999px;padding:4px 12px;font-weight:600}
.cp-lock{font-size:12px;color:var(--muted);background:var(--bg);border-radius:999px;padding:4px 12px}
.cp-cancel{font-size:12px;color:var(--muted);text-align:right;margin-top:8px;cursor:pointer}
.cp-cancel:hover{color:var(--primary)}
</style>
