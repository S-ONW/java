import { reactive, computed } from 'vue'
import { PRODUCTS, COUPONS, SHIP_FREE } from './data.js'

// ---------- localStorage 封装 ----------
const LS = {
  get(k, d) {
    try { return JSON.parse(localStorage.getItem(k)) ?? d } catch (e) { return d }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* ignore */ }
  },
}

// ---------- 全局响应式状态 ----------
export const store = reactive({
  view: 'home',          // home | checkout | orders | account | register | login
  cat: 'all',
  sort: 'default',
  keyword: '',
  page: 1,
  perPage: 8,
  filters: { min: null, max: null, rate: 0 },

  cart: LS.get('shopCart', {}),
  wish: LS.get('shopWish', []),
  orders: LS.get('shopOrders', []),
  addresses: LS.get('shopAddr', []),
  user: LS.get('shopUser', null),
  coupon: null,
  selAddr: LS.get('shopSelAddr', null),

  detailId: null,
  detailQty: 1,
  detailImg: 0,
  acctTab: 'profile',
  payMethod: 'wechat',

  theme: LS.get('shopTheme', 'light'),

  drawer: '',            // '' | 'cart' | 'wish' | 'order'
  modal: '',             // '' | 'detail' | 'auth' | 'addr' | 'success'
  authMode: 'login',
  addrFormId: null,
  success: null,
  prefillName: '',       // 注册成功后带到登录页预填的昵称

  cartMsg: '',
  coMsg: '',
  toastMsg: '',
  toastShow: false,
})

// ---------- 纯函数 / 派生数据 ----------
export const pById = (id) => PRODUCTS.find((p) => p.id == id)
export const money = (n) => '¥' + n
export const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r))

export const cartCount = computed(() =>
  Object.values(store.cart).reduce((a, b) => a + b, 0)
)
export const cartSub = computed(() =>
  Object.keys(store.cart).reduce(
    (s, id) => s + (pById(id)?.price || 0) * store.cart[id],
    0
  )
)

export function couponDisc(sub) {
  if (!store.coupon) return 0
  const c = COUPONS[store.coupon]
  return c.type === 'pct' ? Math.round(sub * c.val) : Math.min(c.val, sub)
}
export function shipFee(sub) {
  return sub === 0 ? 0 : sub >= SHIP_FREE ? 0 : 10
}

function save() {
  LS.set('shopCart', store.cart)
  LS.set('shopWish', store.wish)
  LS.set('shopOrders', store.orders)
  LS.set('shopAddr', store.addresses)
  LS.set('shopUser', store.user)
  LS.set('shopSelAddr', store.selAddr)
}

// ---------- Toast ----------
let toastTimer = null
export function toast(msg) {
  store.toastMsg = msg
  store.toastShow = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { store.toastShow = false }, 1600)
}

// ---------- 视图导航 ----------
export function go(view) {
  store.drawer = ''
  store.modal = ''
  store.view = view
  store.page = 1
  window.scrollTo({ top: 0 })
}
export function openAccount() {
  store.view = 'account'
  store.acctTab = 'profile'
  store.drawer = ''
  store.modal = ''
  window.scrollTo({ top: 0 })
}

// ---------- 首页筛选 / 排序 ----------
export function setCat(c) { store.cat = c; store.page = 1 }
export function setSort(v) { store.sort = v }
export function applyFilter(min, max) {
  store.filters.min = min ? +min : null
  store.filters.max = max ? +max : null
  store.page = 1
}
export function setRate(r) { store.filters.rate = +r; store.page = 1 }
export function setPage(p) { store.page = p }

// ---------- 商品 / 收藏 ----------
export function addToCart(id, q = 1) {
  const p = pById(id)
  const have = store.cart[id] || 0
  if (have + q > p.stock) { toast('超出库存啦'); return }
  store.cart[id] = have + q
  save()
  toast('已加入购物车 ✓')
}
export function toggleFav(id) {
  if (store.wish.includes(id)) store.wish = store.wish.filter((x) => x !== id)
  else store.wish.push(id)
  save()
}

// ---------- 详情弹窗 ----------
export function openDetail(id) {
  store.detailId = id
  store.detailQty = 1
  store.detailImg = 0
  store.modal = 'detail'
}
export function closeModal() { store.modal = '' }
export function setDetailImg(k) { store.detailImg = k }
export function changeDetailQty(d) {
  const p = pById(store.detailId)
  store.detailQty = Math.min(p.stock, Math.max(1, store.detailQty + d))
}
export function addDetailToCart() {
  const id = store.detailId
  addToCart(id, store.detailQty)
  closeModal()
}

// ---------- 抽屉 ----------
export function openCart() { store.drawer = 'cart' }
export function openWish() { store.drawer = 'wish' }
export function openOrder() { store.drawer = 'order' }
export function closeDrawer() { store.drawer = '' }

export function cartInc(id) {
  const p = pById(id)
  if ((store.cart[id] || 0) + 1 > p.stock) { toast('超出库存'); return }
  store.cart[id]++
  save()
}
export function cartDec(id) {
  store.cart[id]--
  if (store.cart[id] <= 0) delete store.cart[id]
  save()
}
export function cartDel(id) { delete store.cart[id]; save() }

export function applyCartCoupon(code) {
  code = (code || '').trim().toUpperCase()
  if (!code) { store.cartMsg = '请输入优惠码'; return }
  if (COUPONS[code]) { store.coupon = code; store.cartMsg = '已生效：' + COUPONS[code].label }
  else { store.coupon = null; store.cartMsg = '优惠码无效' }
}
export function applyCheckoutCoupon(code) {
  code = (code || '').trim().toUpperCase()
  if (COUPONS[code]) { store.coupon = code; store.coMsg = '已生效：' + COUPONS[code].label }
  else if (code) { store.coupon = null; store.coMsg = '优惠码无效' }
  else { store.coupon = null; store.coMsg = '' }
}
export function toCheckout() { store.drawer = ''; go('checkout') }

// ---------- 登录 / 注册 ----------
export function openAuth(mode) { store.authMode = mode || 'login'; store.modal = 'auth' }
export function switchAuth() { store.authMode = store.authMode === 'login' ? 'register' : 'login' }
export function openRegisterPage() { store.modal = ''; store.authMode = 'register'; store.view = 'register'; window.scrollTo({ top: 0 }) }
export function openLoginPage() { store.modal = ''; store.authMode = 'login'; store.view = 'login'; window.scrollTo({ top: 0 }) }

const API = 'http://localhost:8081'

// ---------- 本地账号注册表（localStorage: shopUsers） ----------
// 账号标识为「昵称」：登录校验以本表为准，只有"注册过的昵称 + 正确的密码"才能登录成功。
// 后端（springBootTest，8081）启动时，注册会同步一份到后端（用昵称生成本地邮箱标识）；
// 后端未启动时仅存本地，两种情况下登录规则完全一致。
const localUsers = () => LS.get('shopUsers', [])
function saveLocalUser(u) {
  const users = localUsers()
  const i = users.findIndex((x) => (u.nick && x.nick === u.nick) || (u.email && x.email === u.email))
  if (i > -1) users[i] = u
  else users.push(u)
  LS.set('shopUsers', users)
}

// 后端接口按邮箱存储用户：用昵称生成本地邮箱标识（仅用于同步，不展示给用户）
function nickToEmail(nick) {
  return nick.replace(/\s+/g, '') + '@shop.local'
}

/**
 * 注册：账号 = 昵称（无需邮箱）。优先写 Spring Boot 后端（POST /api/user/register），
 * 后端会校验图形验证码（captchaToken + captcha），校验通过才入库；后端未启动时回退为纯本地注册。
 * 成功均写入本地账号表，保证随后必须"填对昵称和密码"才能登录。
 * @param {string} captchaToken 后端下发的验证码 token
 * @param {string} captcha      用户输入的验证码
 * @returns {Promise<{ok:boolean, msg:string}>}
 */
export async function submitRegister(nick, pwd, captchaToken, captcha) {
  const code = (captcha || '').trim()
  if (!code) return { ok: false, msg: '请输入图形验证码' }
  try {
    const r = await fetch(API + '/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: nickToEmail(nick), pwd, nick, captchaToken, captcha: code }),
    })
    const res = await r.json()
    if (res.code === 200) {
      saveLocalUser({ nick, pwd })
      return { ok: true, msg: '注册成功' }
    }
    // 后端按邮箱判重 → 对应到昵称判重
    if (res.msg && res.msg.indexOf('已注册') > -1) {
      return { ok: false, msg: '该昵称已注册，请直接登录' }
    }
    return { ok: false, msg: res.msg || '注册失败，请稍后再试' }
  } catch (e) {
    // 后端未启动 → 本地注册（仍需输入验证码，但无法校验图形，仅做非空校验）
    if (!code) return { ok: false, msg: '请输入图形验证码' }
    if (localUsers().some((u) => u.nick === nick)) {
      return { ok: false, msg: '该昵称已注册，请直接登录' }
    }
    saveLocalUser({ nick, pwd })
    return { ok: true, msg: '注册成功（离线模式，验证码未校验）' }
  }
}

/**
 * 登录：优先走 Spring Boot 后端（POST /api/user/login，用「昵称@shop.local」作为账号标识
 * 与注册时一致），由 MySQL 校验昵称+密码；后端未启动则回退本地账号表校验。
 * 登录方式不变：仍只用「昵称 + 密码」，不改成邮箱登录。
 * @returns {Promise<{ok:boolean, msg:string}>}
 */
export async function submitAuth(name, pwd) {
  const nick = (name || '').trim()
  try {
    const r = await fetch(API + '/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: nickToEmail(nick), pwd }),
    })
    const res = await r.json()
    if (res.code === 200 && res.data) {
      store.user = { name: res.data.nick || nick, nick: res.data.nick || nick }
      save()
      return { ok: true, msg: '登录成功' }
    }
    // 后端返回的明确错误（账号不存在 / 密码错误等）
    if (res.msg) return { ok: false, msg: res.msg }
    return { ok: false, msg: '登录失败，请稍后再试' }
  } catch (e) {
    // 后端未启动 → 回退本地校验（保持离线可用）
    const u = localUsers().find((x) => x.nick === nick)
    if (!u) return { ok: false, msg: '昵称不存在，请先注册' }
    if (u.pwd !== pwd) return { ok: false, msg: '昵称或密码不正确' }
    store.user = { name: u.nick, nick: u.nick }
    save()
    return { ok: true, msg: '登录成功' }
  }
}

// ---------- 地址 ----------
export function openAddrForm(id) { store.addrFormId = id || null; store.modal = 'addr' }
export function editAddr(id) { openAddrForm(id) }
export function saveAddr(f) {
  const { name, phone, area, detail, def } = f
  if (def) store.addresses.forEach((x) => (x.def = false))
  if (store.addrFormId) {
    const a = store.addresses.find((x) => x.id === store.addrFormId)
    if (a) Object.assign(a, { name, phone, area, detail, def })
  } else {
    const na = { id: Date.now(), name, phone, area, detail, def }
    store.addresses.push(na)
    if (!store.selAddr) store.selAddr = na.id
  }
  save()
  store.modal = ''
  toast('地址已保存')
}
export function setPayMethod(v) { store.payMethod = v }
export function selectAddr(id) { store.selAddr = id }
export function deleteAddr(id) {
  store.addresses = store.addresses.filter((x) => x.id != id)
  if (store.selAddr == id) store.selAddr = store.addresses[0]?.id || null
  save()
}
export function setDefAddr(id) {
  store.addresses.forEach((x) => (x.def = false))
  const a = store.addresses.find((x) => x.id == id)
  if (a) a.def = true
  save()
}

// ---------- 下单 / 订单 ----------
export function placeOrder() {
  if (!store.user) { openAuth('login'); return false }
  if (!store.addresses.length) { openAddrForm(null); toast('请先填写收货地址'); return false }
  if (!store.selAddr) { toast('请选择收货地址'); return false }
  const sub = cartSub.value
  const disc = couponDisc(sub)
  const ship = shipFee(sub)
  const total = Math.max(0, sub - disc) + ship
  const no = 'YC' + Date.now().toString().slice(-10)
  const addr = store.addresses.find((a) => a.id === store.selAddr) || store.addresses[0]
  store.orders.push({
    no,
    time: new Date().toLocaleString('zh-CN'),
    status: '待发货',
    total,
    items: Object.keys(store.cart).map((id) => ({ id: +id, q: store.cart[id] })),
    addr,
    pay: store.payMethod,
  })
  store.cart = {}
  store.coupon = null
  save()
  store.success = { no, total }
  store.modal = 'success'
  return true
}
export function confirmRecv(no) {
  const o = store.orders.find((x) => x.no == no)
  if (o) { o.status = '已完成'; save(); toast('已确认收货 🎉') }
}
export function cancelOrder(no) {
  const o = store.orders.find((x) => x.no == no)
  if (o) { o.status = '已取消'; save(); toast('订单已取消') }
}
export function payOrder(no) {
  const o = store.orders.find((x) => x.no == no)
  if (o) { o.status = '待发货'; save(); toast('支付成功') }
}

// ---------- 账户 ----------
export function logout() { store.user = null; save(); toast('已退出登录') }
export function saveNick(nick) {
  if (store.user) { store.user.nick = nick || store.user.name; save(); toast('已保存') }
}
export function setAcctTab(t) { store.acctTab = t }

// ---------- 主题 ----------
export function toggleTheme() {
  store.theme = store.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', store.theme)
  localStorage.setItem('shopTheme', store.theme)
}

// ---------- 订阅 ----------
export function subscribe(email) {
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('订阅成功 📧'); return true }
  toast('请输入有效邮箱')
  return false
}
