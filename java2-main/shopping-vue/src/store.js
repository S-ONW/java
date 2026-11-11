import { reactive, computed } from 'vue'
import { PRODUCTS, COUPONS, COUPON_POOL, SHIP_FREE } from './data.js'
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

  // 商品数据：默认取 data.js 的静态数据，后台管理系统可对它增删改
  // （后端可用时以后端 product 表为准，离线时改动保存在浏览器本地）
  products: LS.get('shopProducts', null) || PRODUCTS.map((p) => ({ ...p, g: [...(p.g || [])] })),

  // 后台管理员登录态：{ username, nick, token, offline }
  admin: LS.get('shopAdmin', null),

  // 优惠券池：领券中心 / 结算 / 后台优惠券管理共用，数据来自后端 coupon 表
  // （启动时由 loadCouponPool() 同步；后端不可用时先用 data.js 的 COUPON_POOL 兜底）。
  couponPool: LS.get('shopCouponPool', null) || COUPON_POOL.map((c) => ({ ...c })),

  // 每张券的「已领取人数」（coupon_code → 人数），后台概览用：由 loadCouponStats()
  // 从 user_coupon 表统计，不持久化，进后台时现拉。
  couponStats: {},

  // 用户相关的购物数据（购物车/收藏/订单/优惠券）改为「按用户隔离」：
  // 未登录时为 0/空；登录后从「该用户的存储 key」加载，切换账户即切换对应数据。
  // 初始值统一为空，真正的数据在登录成功后由 loadUserData() 注入。
  cart: {},
  wish: [],
  orders: [],
  addresses: [],
  user: LS.get('shopUser', null),
  coupon: null,
  // 用户已领取的优惠券 code 列表（领券中心领取后，结账时可用于抵扣）
  myCoupons: [],
  selAddr: null,

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

  toastMsg: '',
  toastShow: false,
})

// ---------- 权限 ----------
// permission: 1 = 默认权限（注册用户，看不到后台入口、不能登录后台）
//             0 = 管理员权限（首页可见「后台管理」按钮，且能登录后台管理系统）
export const PERMISSION_DEFAULT = 1
export const PERMISSION_ADMIN = 0

/** 当前登录用户是否为管理员权限（0）。登录时由 /api/user/login 返回的 permission 决定 */
export const isAdminUser = computed(() =>
  !!store.user && Number(store.user.permission) === PERMISSION_ADMIN
)

// 旧版本会把后台登录态长期存在 localStorage。非管理员一律清掉，
// 避免「换了个普通账号登录，却仍能用旧的后台 token 直接进管理页」。
if (store.admin && !isAdminUser.value) {
  store.admin = null
  LS.set('shopAdmin', null)
}

// ---------- 纯函数 / 派生数据 ----------
// 商品以 store.products 为准：后台管理系统改的数据会实时反映到首页 / 详情 / 购物车
export const pById = (id) => store.products.find((p) => p.id == id)
export const money = (n) => '¥' + n
export const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r))

// ---------- 商品分类（顶部导航条与首页共用同一份数据） ----------
// 后台新增商品/分类后，顶部导航条会自动多出对应按钮
export const categories = computed(() => ['all', ...new Set(store.products.map((p) => p.cat))])
export function catLabel(c) {
  const m = {
    数码: '📱 数码电子', 家居: '🛋️ 家居生活', 美妆: '💄 美妆个护',
    食品: '🍫 食品饮料', 运动: '⚽ 运动户外',
  }
  return m[c] || c
}

export const cartCount = computed(() =>
  Object.values(store.cart).reduce((a, b) => a + b, 0)
)
export const cartSub = computed(() =>
  Object.keys(store.cart).reduce(
    (s, id) => s + (pById(id)?.price || 0) * store.cart[id],
    0
  )
)

// 根据当前选中的优惠券 code 解析券信息（从动态优惠券池 couponPool 查询，兼容旧 COUPONS）
export function couponInfo(code) {
  if (!code) return null
  const c = store.couponPool.find((x) => x.code === code)
  if (c) return c
  const old = COUPONS[code]
  if (old) return { code, type: old.type, val: old.val, amount: old.label, min: 0 }
  return null
}

// 计算某张券在当前订单小计 sub 下的减免金额；券不可用（未选/不满足门槛）返回 0
export function couponDisc(sub, code) {
  const c = couponInfo(code == null ? store.coupon : code)
  if (!c) return 0
  if (sub < (c.min || 0)) return 0
  return c.type === 'pct' ? Math.round(sub * c.val) : Math.min(c.val, sub)
}
export function shipFee(sub) {
  return sub === 0 ? 0 : sub >= SHIP_FREE ? 0 : 10
}

// 当前登录用户的唯一标识（未登录为 null）；用于用户数据的存储隔离
function userKey() {
  return store.user ? (store.user.email || store.user.nick || store.user.name) : null
}

// 带用户后缀的存储 key：已登录 -> shopCart_<uid>，未登录 -> shopCart_guest
function ukey(base) {
  const k = userKey()
  return base + '_' + (k || 'guest')
}

function save() {
  // 用户相关数据：按当前用户隔离存储；未登录时写入 guest 命名空间（登录后不再使用）
  LS.set(ukey('shopCart'), store.cart)
  LS.set(ukey('shopWish'), store.wish)
  LS.set(ukey('shopOrders'), store.orders)
  LS.set(ukey('shopMyCoupons'), store.myCoupons)
  LS.set(ukey('shopCoupon'), store.coupon)
  LS.set(ukey('shopAddr'), store.addresses)
  LS.set(ukey('shopSelAddr'), store.selAddr)
  // 登录态、商品、优惠券池、后台等：全局
  LS.set('shopUser', store.user)
  LS.set('shopProducts', store.products)
  LS.set('shopCouponPool', store.couponPool)
  LS.set('shopAdmin', store.admin)
}

// 登录成功后：从「该用户」的存储 key 加载其购物车/收藏/订单/优惠券，并同步后端优惠券
function loadUserData() {
  const uk = userKey()
  if (!uk) { clearUserData(); return }
  store.cart = LS.get('shopCart_' + uk, {})
  store.wish = LS.get('shopWish_' + uk, [])
  store.orders = LS.get('shopOrders_' + uk, [])
  store.myCoupons = LS.get('shopMyCoupons_' + uk, [])
  store.coupon = LS.get('shopCoupon_' + uk, null)
  store.addresses = LS.get('shopAddr_' + uk, [])
  store.selAddr = LS.get('shopSelAddr_' + uk, null)
  // 异步同步后端优惠券列表（后端不可用则保持本地值）
  loadMyCoupons()
}

// 登出 / 未登录时：清空用户购物数据，图标数字归零
function clearUserData() {
  store.cart = {}
  store.wish = []
  store.orders = []
  store.myCoupons = []
  store.coupon = null
  store.addresses = []
  store.selAddr = null
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
  // 按钮隐藏之外的第二道防线：即使手动改 URL / 直接调 go()，
  // 非管理员权限（permission !== 0）也进不了后台登录页与管理页。
  if ((view === 'admin' || view === 'adminLogin') && !isAdminUser.value) {
    toast('仅管理员权限（0）可进入后台管理系统')
    view = 'home'
  }
  store.drawer = ''
  store.modal = ''
  store.view = view
  store.page = 1
  window.scrollTo({ top: 0 })
}
// 顶部 Logo / 品牌字统一走这里：任何界面点一下，都回到「干净的首页」
// （顺手清掉搜索词、分类、排序、筛选，避免点了 Logo 还停在上次的筛选结果里）
export function goHome() {
  store.keyword = ''
  store.cat = 'all'
  store.sort = 'default'
  store.filters = { min: null, max: null, rate: 0 }
  // 记一笔 #home：刷新后仍停在首页（否则未登录时会按默认规则落回注册页）
  try {
    if (location.hash !== '#home') history.replaceState(null, '', '#home')
  } catch (e) { /* file:// 等场景忽略 */ }
  go('home')
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
  if (!p) { toast('商品已下架'); return }   // 后台删除商品后购物车残留的兜底
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
  if (!p) return                                                  // 商品已被后台删除
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

// ---------- 结账选择优惠券 ----------
// 选中某张已领取的优惠券（code），作为本次订单的抵扣券
export function selectCoupon(code) {
  if (!store.myCoupons.includes(code)) {
    toast('你还没有这张优惠券，请先去领券中心领取')
    return false
  }
  store.coupon = code
  return true
}
// 取消使用优惠券
export function clearCoupon() {
  store.coupon = null
}

// ---------- 领券中心 ----------
// 领取优惠券：未登录需先登录；重复领取同一张券会被拦截。
// 优先写后端（POST /api/coupon/claim），后端未启动时回退 localStorage。
export async function claimCoupon(code) {
  if (!store.user) {
    toast('请先登录后再领取优惠券')
    return 'login'
  }
  if (store.myCoupons.includes(code)) {
    toast('这张优惠券你已经领过啦')
    return false
  }
  const email = store.user.email || (store.user.name + '@shop.local')
  try {
    const r = await fetch(API + '/api/coupon/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const res = await r.json()
    if (res.code === 200) {
      store.myCoupons.push(code)
      save()
      toast('🎉 领取成功，已放入「我的优惠券」')
      return true
    }
    if (res.code === 409) { toast(res.msg || '这张优惠券你已经领过啦'); return false }
    // 其它错误也视为失败，但不再回退本地（保持与后端一致）
    toast(res.msg || '领取失败，请稍后再试')
    return false
  } catch (e) {
    // 后端未启动 → 回退本地领取
    store.myCoupons.push(code)
    save()
    toast('🎉 领取成功（离线模式）')
    return true
  }
}

// 从后端拉取当前用户已领取的优惠券 code 列表；后端不可用则沿用 localStorage
export async function loadMyCoupons() {
  if (!store.user) return
  const email = store.user.email || (store.user.name + '@shop.local')
  try {
    const r = await fetch(API + '/api/coupon/list?email=' + encodeURIComponent(email))
    const res = await r.json()
    if (res.code === 200 && Array.isArray(res.data)) {
      store.myCoupons = res.data
      save()
    }
  } catch (e) {
    // 后端未启动，沿用本地已领记录
  }
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
// 每条记录都带 permission：注册写入 1（默认权限），内置管理员为 0。

// 内置管理员，与数据库种子 sql/shop_db.sql 保持一致；仅在后端不可用时作为离线兜底。
const LOCAL_ADMIN = { nick: 'admin', email: 'admin@shop.local', pwd: 'admin123', permission: PERMISSION_ADMIN }
const localUsers = () => {
  const list = LS.get('shopUsers', [])
  return list.some((u) => u.email === LOCAL_ADMIN.email || u.nick === LOCAL_ADMIN.nick)
    ? list
    : [...list, LOCAL_ADMIN]
}
// 老数据没有 permission 字段时一律按默认权限处理
const permOf = (u) => (u && Number(u.permission) === PERMISSION_ADMIN ? PERMISSION_ADMIN : PERMISSION_DEFAULT)

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
      // 注册用户一律默认权限 1；以后端返回的 permission 为准（后端不会接受前端传的权限）
      saveLocalUser({ nick, pwd, permission: permOf(res.data) })
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
    saveLocalUser({ nick, pwd, permission: PERMISSION_DEFAULT })
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
      // 后端返回 permission：0 = 管理员（首页显示后台按钮），1 = 默认权限（不显示）
      store.user = {
        name: res.data.nick || nick,
        nick: res.data.nick || nick,
        email: res.data.email || nickToEmail(nick),
        permission: permOf(res.data),
      }
      loadUserData()
      save()
      return { ok: true, msg: '登录成功' }
    }
    // 后端返回的明确错误（账号不存在 / 密码错误等）
    if (res.msg) return { ok: false, msg: res.msg }
    return { ok: false, msg: '登录失败，请稍后再试' }
  } catch (e) {
    // 后端未启动 → 回退本地校验（保持离线可用），同样带出 permission
    const u = localUsers().find((x) => x.nick === nick || x.email === nick || x.email === nickToEmail(nick))
    if (!u) return { ok: false, msg: '昵称不存在，请先注册' }
    if (u.pwd !== pwd) return { ok: false, msg: '昵称或密码不正确' }
    store.user = {
      name: u.nick,
      nick: u.nick,
      email: u.email || nickToEmail(u.nick),
      permission: permOf(u),
    }
    loadUserData()
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
export function logout() {
  store.user = null
  adminLogout()   // 同步清掉后台登录态，避免退出后仍残留管理员入口
  clearUserData() // 清空购物车/收藏/订单/优惠券，图标数字归零
  save()
  toast('已退出登录')
}
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

// ---------- 后台管理系统 ----------
// 后台负责对首页展示的购物数据（商品）做增删改查。
// 后端可用 → 数据存 MySQL（product 表），并同步回首页；后端不可用 → 退化为浏览器本地数据，
// 后台页面顶部会提示「离线模式」，保证功能任何情况下都能演示。
// 权限：只有 permission = 0 的管理员能进入后台（前端 go/按钮拦截 + 后端 /api/admin/login 校验）。

/** 拉取后端商品列表，覆盖本地数据（后台改动 → 首页立即生效） */
export async function loadProducts() {
  try {
    const r = await fetch(API + '/api/product/list')
    const res = await r.json()
    if (res.code === 200 && Array.isArray(res.data) && res.data.length) {
      store.products = res.data
      save()
      return { ok: true, msg: '已同步后端商品数据' }
    }
    return { ok: false, msg: res.msg || '后端暂无商品数据' }
  } catch (e) {
    return { ok: false, msg: '未连接后端，当前使用本地数据' }
  }
}

/**
 * 拉取后端优惠券池（coupon 表），覆盖本地券池。
 * 券池已由「前端写死 COUPON_POOL」改为「数据库 coupon 表」：
 * 领券中心 / 结算抵扣 / 后台优惠券管理读的都是 store.couponPool，
 * 只要这里同步成功，三处就都与数据库一致；后端不可用时沿用本地数据。
 */
export async function loadCouponPool() {
  try {
    const r = await fetch(API + '/api/coupon/pool')
    const res = await r.json()
    // 注意：空数组也要覆盖——否则后台把券删光后，前端仍会显示上一次的旧券池
    if (res.code === 200 && Array.isArray(res.data)) {
      store.couponPool = res.data
      save()
      return { ok: true, msg: res.data.length ? '已同步后端优惠券数据' : '后端券池当前为空' }
    }
    return { ok: false, msg: res.msg || '后端暂无优惠券数据' }
  } catch (e) {
    return { ok: false, msg: '未连接后端，当前使用本地优惠券数据' }
  }
}

/**
 * 拉取「每张券被领了多少人」（后台优惠券概览用）：GET /api/coupon/admin/stats。
 * 统计来自 user_coupon 表；后端不可用或离线模式则保留旧值（本地没有领取明细，无从统计）。
 */
export async function loadCouponStats() {
  if (!store.admin || store.admin.offline) return store.couponStats
  try {
    const res = await adminWrite('/api/coupon/admin/stats')
    if (res.code === 200 && res.data) store.couponStats = res.data
  } catch (e) {
    // 后端不可用：保留上一次的统计值
  }
  return store.couponStats
}

// 本次会话的管理员凭据，仅存 sessionStorage（标签页关闭即清除，不长期落盘）。
// 用途：后端 token 是内存态，服务/devtools 热重启或过期后会自动失效；
// 此时用它静默重新登录换取新 token，避免用户编辑到一半被踢回登录页、丢失表单。
let adminCreds = null
try { adminCreds = JSON.parse(sessionStorage.getItem('shopAdminCreds') || 'null') } catch (e) { adminCreds = null }

/** 用记住的凭据静默重新登录，成功返回新 token，失败返回 null */
async function adminRelogin() {
  if (!adminCreds || !adminCreds.username || !adminCreds.pwd) return null
  try {
    const r = await fetch(API + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminCreds),
    })
    const res = await r.json()
    if (res.code === 200 && res.data && res.data.token) {
      store.admin = {
        username: res.data.username || adminCreds.username,
        nick: res.data.nick || '管理员',
        token: res.data.token,
        offline: false,
      }
      save()
      return res.data.token
    }
  } catch (e) { /* 后端不可用，交给上层跳登录页 */ }
  return null
}

/**
 * 统一的后台写请求：自动携带当前 token；
 * 若后端返回 401（token 因重启/过期失效），静默重新登录后用新 token 重试一次。
 * 后端不可用（fetch 抛错）时把异常抛给调用方，由调用方走离线本地逻辑。
 */
async function adminWrite(path, options = {}) {
  const send = (token) => fetch(API + path, {
    ...options,
    headers: { ...(options.headers || {}), 'X-Admin-Token': token || '' },
  })
  let r = await send((store.admin && store.admin.token) || '')
  let res = await r.json()
  if (res.code === 401) {
    const fresh = await adminRelogin()
    if (fresh) {
      r = await send(fresh)
      res = await r.json()
    }
  }
  return res
}

/**
 * 后台登录。后台只提供登录、不开放注册：账号直接取 user 表，
 * 只有 permission = 0（管理员权限）且明文密码正确才能登录；
 * permission = 1 的默认权限用户后端会返回 403 拒绝。
 * 前端先做一道权限拦截，后端 /api/admin/login 再做一次（防止伪造请求绕过）。
 */
export async function adminLogin(username, pwd) {
  const acct = (username || '').trim()
  if (!acct || !pwd) return { ok: false, msg: '请输入账号和密码' }
  if (!isAdminUser.value) {
    return { ok: false, msg: '仅管理员权限（0）的账号可登录后台管理系统' }
  }
  try {
    const r = await fetch(API + '/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: acct, pwd }),
    })
    const res = await r.json()
    if (res.code === 200 && res.data) {
      store.admin = {
        username: res.data.username || acct,
        nick: res.data.nick || '管理员',
        token: res.data.token,
        permission: PERMISSION_ADMIN,
        offline: false,
      }
      // 记住凭据，供 token 失效时静默重新登录（仅 sessionStorage，标签页关闭即失效）
      adminCreds = { username: acct, pwd }
      try { sessionStorage.setItem('shopAdminCreds', JSON.stringify(adminCreds)) } catch (e) { /* ignore */ }
      save()
      await loadProducts()
      return { ok: true, msg: '登录成功' }
    }
    return { ok: false, msg: res.msg || '账号或密码不正确' }
  } catch (e) {
    // 后端未启动 → 离线模式：同样必须命中本地账号表里 permission = 0 的管理员
    const u = localUsers().find((x) => x.nick === acct || x.email === acct || x.email === nickToEmail(acct))
    if (!u || u.pwd !== pwd) return { ok: false, msg: '账号或密码不正确' }
    if (permOf(u) !== PERMISSION_ADMIN) {
      return { ok: false, msg: '该账号为默认权限（1），无权登录后台管理系统' }
    }
    store.admin = {
      username: u.nick,
      nick: u.nick,
      token: 'offline',
      permission: PERMISSION_ADMIN,
      offline: true,
    }
    adminCreds = null
    save()
    return { ok: true, msg: '离线模式登录成功（数据仅存本地）' }
  }
}

/** 校验当前后台登录态是否仍然有效（后端 token 为内存态，重启/过期即失效） */
export async function adminCheck() {
  if (!store.admin || !store.admin.token) return false
  if (store.admin.offline) return true // 离线模式无需校验
  try {
    const r = await fetch(API + '/api/admin/check', {
      method: 'POST',
      headers: { 'X-Admin-Token': store.admin.token },
    })
    const res = await r.json()
    // 401：先尝试静默重新登录换取新 token，成功则登录态继续有效
    if (res.code === 401) return (await adminRelogin()) !== null
    // 404（后端尚未部署校验端点）等情况保守视为有效，避免误踢登录态
    return true
  } catch (e) {
    return true
  }
}

/** 后台登录态失效且自动重登失败：清空并跳回登录页，让用户重新登录 */
function adminSessionExpired() {
  adminLogout()
  go('adminLogin')
}

/** 退出后台登录 */
export function adminLogout() {
  const token = store.admin && store.admin.token
  if (token && token !== 'offline') {
    fetch(API + '/api/admin/logout', {
      method: 'POST',
      headers: { 'X-Admin-Token': token },
    }).catch(() => { /* 后端不可用则忽略 */ })
  }
  adminCreds = null
  try { sessionStorage.removeItem('shopAdminCreds') } catch (e) { /* ignore */ }
  store.admin = null
  save()
}

// ==================== 后台优惠券管理 ====================
// 券池已落库：优惠券池 = coupon 表，「谁领了哪张券」= user_coupon 表。
// 后台增删改优先写后端（/api/coupon/admin/save、/api/coupon/admin/delete），
// 成功后立刻重新拉取券池；后端不可用（或离线模式登录）时退化为本地修改。

/** 校验券字段，返回错误文案或空串；original 为编辑前的券对象（用于排除自身） */
function couponValidate(c, original) {
  const code = (c.code || '').trim().toUpperCase()
  if (!code) return '券码（code）不能为空'
  if (!/^[A-Z0-9_]+$/.test(code)) return '券码只能由字母、数字、下划线组成'
  if (!c.title || !c.title.trim()) return '券名称不能为空'
  if (c.type !== 'pct' && c.type !== 'fix') return '券类型需为「折扣」或「立减」'
  const val = +c.val
  if (isNaN(val) || val <= 0) return '面值/折扣需为大于 0 的数字'
  if (c.type === 'pct' && (val > 1 || val < 0.01)) return '折扣需在 0.01 ~ 1 之间（如 0.2 表示减 20%）'
  const min = c.min == null ? 0 : +c.min
  if (isNaN(min) || min < 0) return '使用门槛需为不小于 0 的数字'
  // 码重复校验（编辑时排除自身；注意不能拿 clone 出来的对象做引用比较）
  if (store.couponPool.some((x) => x.code === code && x !== (original || c))) return '该券码已存在'
  return ''
}

/** 把表单字段归一化成券对象（amount / cond 是展示文案，由 type/val/min 推导） */
function normalizeCoupon(body) {
  const code = (body.code || '').trim().toUpperCase()
  return {
    code,
    title: (body.title || '').trim(),
    desc: (body.desc || '').trim(),
    type: body.type,
    val: +body.val,
    // val 统一按「减免比例」存：pct 0.2 → 减 20% →「8 折」
    amount: body.type === 'pct' ? (Math.round((1 - +body.val) * 100) / 10) + ' 折' : '¥' + body.val,
    cond: (+(body.min || 0)) > 0 ? '满 ' + body.min + ' 可用' : '无门槛',
    min: +(body.min || 0),
  }
}

/** 离线保存：直接改本地券池 */
function saveCouponLocal(body, original) {
  const norm = normalizeCoupon(body)
  const i = store.couponPool.indexOf(original)
  if (i > -1) store.couponPool[i] = { ...norm, id: body.id == null ? undefined : body.id }
  else store.couponPool.push(norm)
  save()
  return { ok: true, msg: (original ? '优惠券已更新' : '优惠券已新增') + '（离线模式）' }
}

/** 新增或修改优惠券（有原始引用视为修改），优先写数据库 */
export async function adminSaveCoupon(c, original) {
  const code = (c.code || '').trim().toUpperCase()
  const err = couponValidate({ ...c, code }, original)
  if (err) return { ok: false, msg: err }
  const body = {
    id: c.id == null ? null : c.id,
    code,
    title: (c.title || '').trim(),
    desc: (c.desc || '').trim(),
    type: c.type,
    val: +c.val,
    min: +(c.min || 0),
  }
  // 离线模式登录（token='offline'）时不请求后端，直接改本地
  if (store.admin && store.admin.offline) return saveCouponLocal(body, original)
  try {
    const res = await adminWrite('/api/coupon/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.code === 200) {
      await loadCouponPool()
      return { ok: true, msg: '已保存到数据库' }
    }
    if (res.code === 401) { adminSessionExpired(); return { ok: false, msg: res.msg || '登录已失效，请重新登录后台' } }
    return { ok: false, msg: res.msg || '保存失败' }
  } catch (e) {
    // 后端不可用 → 本地修改，界面同样即时生效
    return saveCouponLocal(body, original)
  }
}

/** 删除优惠券（从券池/数据库 coupon 表移除），优先写数据库 */
export async function adminDeleteCoupon(c) {
  if (!(store.admin && store.admin.offline)) {
    try {
      const res = await adminWrite(
        '/api/coupon/admin/delete?code=' + encodeURIComponent(c.code),
        { method: 'DELETE' }
      )
      if (res.code === 200) {
        await loadCouponPool()
        return { ok: true, msg: '已从数据库删除' }
      }
      if (res.code === 401) { adminSessionExpired(); return { ok: false, msg: res.msg || '登录已失效，请重新登录后台' } }
      return { ok: false, msg: res.msg || '删除失败' }
    } catch (e) {
      // 后端不可用 → 删本地
    }
  }
  store.couponPool = store.couponPool.filter((x) => x !== c)
  save()
  return { ok: true, msg: '优惠券已删除（离线模式）' }
}

/**
 * 管理员发放优惠券给指定用户（email）。
 * 优先走后端（POST /api/coupon/admin/grant，带 X-Admin-Token）；后端不可用则
 * 直接写该用户本地的已领记录（离线模式）。
 */
export async function adminGrantCoupon(email, code) {
  const e = (email || '').trim()
  if (!e) return { ok: false, msg: '请填写用户邮箱' }
  if (!couponInfo(code)) return { ok: false, msg: '该优惠券不存在' }
  // 离线模式登录（token='offline'）时不请求后端，直接写本地
  if (store.admin && store.admin.offline) {
    return grantOffline(e, code)
  }
  try {
    const res = await adminWrite('/api/coupon/admin/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e, code }),
    })
    if (res.code === 200) { await loadCouponStats(); return { ok: true, msg: '发放成功' } }
    if (res.code === 401) { adminSessionExpired(); return { ok: false, msg: res.msg || '登录已失效' } }
    return { ok: false, msg: res.msg || '发放失败' }
  } catch (err) {
    // 后端不可用 → 离线：写入该用户本地的已领券列表
    return grantOffline(e, code)
  }
}

/** 离线发放：直接写入该用户本地的已领券记录 */
function grantOffline(email, code) {
  const key = 'shopMyCoupons_' + email
  const list = LS.get(key, [])
  if (list.includes(code)) return { ok: false, msg: '该用户已拥有这张券' }
  list.push(code)
  LS.set(key, list)
  return { ok: true, msg: '发放成功（离线模式）' }
}

/** 管理员删除某个用户已领取的优惠券 */
export async function adminRemoveUserCoupon(email, code) {
  const e = (email || '').trim()
  if (!e || !code) return { ok: false, msg: '参数缺失' }
  // 离线模式登录时不请求后端，直接改本地
  if (store.admin && store.admin.offline) return removeOffline(e, code)
  try {
    const res = await adminWrite(
      '/api/coupon/admin/remove?email=' + encodeURIComponent(e) + '&code=' + encodeURIComponent(code),
      { method: 'DELETE' }
    )
    if (res.code === 200) { await loadCouponStats(); return { ok: true, msg: '已删除' } }
    if (res.code === 401) { adminSessionExpired(); return { ok: false, msg: res.msg || '登录已失效' } }
    return { ok: false, msg: res.msg || '删除失败' }
  } catch (err) {
    return removeOffline(e, code)
  }
}

/** 离线删除：直接改该用户本地的已领券记录 */
function removeOffline(email, code) {
  const key = 'shopMyCoupons_' + email
  const list = LS.get(key, [])
  LS.set(key, list.filter((x) => x !== code))
  return { ok: true, msg: '已删除（离线模式）' }
}

/** 新增或修改商品（有 id 视为修改） */
export async function adminSaveProduct(p) {
  const body = {
    id: p.id == null ? null : p.id,
    name: (p.name || '').trim(),
    desc: p.desc || '',
    price: +p.price || 0,
    old: +p.old || 0,
    cat: p.cat || '其他',
    icon: p.icon || '📦',
    hot: +p.hot || 50,
    rate: +p.rate || 4.5,
    stock: +p.stock || 0,
    tag: p.tag || '',
    g: Array.isArray(p.g) ? p.g.filter(Boolean) : [],
  }
  if (!body.name) return { ok: false, msg: '商品名称不能为空' }
  try {
    const res = await adminWrite('/api/product/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.code === 200) {
      await loadProducts()
      return { ok: true, msg: '已保存到数据库' }
    }
    if (res.code === 401) { adminSessionExpired(); return { ok: false, msg: res.msg || '登录已失效，请重新登录后台' } }
    return { ok: false, msg: res.msg || '保存失败' }
  } catch (e) {
    // 离线：改本地数据，首页同样实时生效
    const i = store.products.findIndex((x) => x.id == body.id)
    if (i > -1) store.products[i] = { ...store.products[i], ...body }
    else store.products.push({ ...body, id: Date.now() })
    save()
    return { ok: true, msg: '离线模式：已保存到本地' }
  }
}

/** 删除商品 */
export async function adminDeleteProduct(id) {
  try {
    const res = await adminWrite('/api/product/' + id, { method: 'DELETE' })
    if (res.code === 200) {
      await loadProducts()
      return { ok: true, msg: '已删除' }
    }
    if (res.code === 401) { adminSessionExpired(); return { ok: false, msg: res.msg || '登录已失效，请重新登录后台' } }
    return { ok: false, msg: res.msg || '删除失败' }
  } catch (e) {
    store.products = store.products.filter((p) => p.id != id)
    save()
    return { ok: true, msg: '离线模式：已在本地删除' }
  }
}

/** 批量删除商品：ids 为数组 */
export async function adminDeleteProducts(ids) {
  if (!Array.isArray(ids) || !ids.length) return { ok: false, msg: '请选择要删除的商品' }
  try {
    const res = await adminWrite('/api/product/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.code === 200) {
      await loadProducts()
      return { ok: true, msg: res.msg || '已批量删除' }
    }
    if (res.code === 401) { adminSessionExpired(); return { ok: false, msg: res.msg || '登录已失效，请重新登录后台' } }
    return { ok: false, msg: res.msg || '批量删除失败' }
  } catch (e) {
    const set = new Set(ids.map(String))
    store.products = store.products.filter((p) => !set.has(String(p.id)))
    save()
    return { ok: true, msg: '离线模式：已在本地删除' }
  }
}

// ---------- 启动初始化：恢复登录态对应的用户数据 ----------
// 刷新页面时若 localStorage 里仍有登录态（shopUser），需要把该用户
// 的购物车/收藏/订单/优惠券重新加载出来；未登录则保持空（图标归零）。
if (store.user) {
  loadUserData()
}
