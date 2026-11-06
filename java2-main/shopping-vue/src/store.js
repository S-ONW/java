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

  // 商品数据：默认取 data.js 的静态数据，后台管理系统可对它增删改
  // （后端可用时以后端 product 表为准，离线时改动保存在浏览器本地）
  products: LS.get('shopProducts', null) || PRODUCTS.map((p) => ({ ...p, g: [...(p.g || [])] })),

  // 后台管理员登录态：{ username, nick, token, offline }
  admin: LS.get('shopAdmin', null),

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
  LS.set('shopProducts', store.products)
  LS.set('shopAdmin', store.admin)
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
