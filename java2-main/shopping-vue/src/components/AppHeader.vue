<template>
  <header>
    <div class="nav">
      <!-- 品牌 Logo：任何界面（含登录 / 注册 / 结算 / 订单 / 账户）点一下都回首页 -->
      <a
        class="logo"
        href="#home"
        role="button"
        :title="'返回' + SHOP_NAME + '首页'"
        aria-label="返回首页"
        @click.prevent="goHome"
      >
        <img :src="logoUrl" :alt="SHOP_NAME" class="logo-img" />
        <transition name="hint-pop">
          <span v-if="showHint && store.view !== 'home'" class="logo-hint">点我回到首页</span>
        </transition>
      </a>
      <div class="search">
        <input v-model="keyword" type="text" placeholder="搜索商品，如 耳机 / 咖啡 / 瑜伽…" @keyup.enter="onSearch" />
        <button @click="onSearch">搜索</button>
      </div>
      <button class="icon-btn" @click="onCoupon" title="我的优惠券">🎫 <span class="badge" v-show="store.myCoupons.length">{{ store.myCoupons.length }}</span></button>
      <button class="icon-btn" @click="openWish" title="收藏夹">❤️ <span class="badge" v-show="store.wish.length">{{ store.wish.length }}</span></button>
      <button class="icon-btn" @click="go('orders')" title="我的订单">📦 <span class="badge" v-show="store.orders.length">{{ store.orders.length }}</span></button>
      <button class="icon-btn" @click="toggleTheme" title="暗色模式">{{ store.theme === 'dark' ? '☀️' : '🌙' }}</button>
      <!-- 仅 permission = 0 的管理员可见后台管理系统入口；默认权限（1）完全隐藏 -->
      <button v-if="isAdminUser" class="icon-btn admin-entry" @click="onAdmin" title="后台管理系统">⚙️ 后台管理</button>
      <button class="icon-btn" @click="openCart" title="购物车">🛒 <span class="badge" v-show="cartCount">{{ cartCount }}</span></button>
      <div v-if="store.user" class="avatar" @click="openAccount" title="账户">{{ store.user.name[0].toUpperCase() }}</div>
      <div v-else class="auth-wrap" ref="authWrap">
        <button class="icon-btn auth-trigger" type="button" @click.stop="toggleAuthMenu">👤 登录 / 注册</button>
        <div class="auth-menu" v-if="showAuthMenu">
          <button class="auth-item" type="button" @click="goLogin">登录</button>
          <button class="auth-item" type="button" @click="goRegister">注册</button>
        </div>
      </div>
    </div>

    <!-- 分类导航条：位于搜索栏所在行的下方，随头部一起吸顶 -->
    <nav v-if="store.view === 'home'" class="cat-nav">
      <button
        v-for="c in categories"
        :key="c"
        class="cat"
        :class="{ active: store.cat === c }"
        @click="pickCat(c)"
      >
        <span class="cat-ico" aria-hidden="true">{{ c === 'all' ? '🛍️' : '' }}</span>
        <span class="cat-txt">{{ c === 'all' ? '全部商品' : catLabel(c) }}</span>
      </button>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { store, cartCount, go, goHome, openCart, openWish, toggleTheme, openAccount, openLoginPage, openRegisterPage, isAdminUser, categories, catLabel, setCat, toast, openAuth } from '../store.js'
import logoUrl from '../assets/logo.jpg'
import { SHOP_NAME } from '../brand.js'

const keyword = ref(store.keyword)
const showAuthMenu = ref(false)
const authWrap = ref(null)

// 每 5 秒在 Logo 附近弹一次「点我回到首页」提示，2 秒后自动消失
const showHint = ref(false)
let hintTimer = null
function tickHint() {
  showHint.value = true
  setTimeout(() => { showHint.value = false }, 2000)
}
onMounted(() => { hintTimer = setInterval(tickHint, 5000) })
onUnmounted(() => { clearInterval(hintTimer) })

function onSearch() {
  store.keyword = keyword.value.trim()
  store.cat = 'all'
  store.page = 1
  go('home')
}

// 未登录时展示「登录 / 注册」下拉，分别跳转到登录页与注册页
function toggleAuthMenu() { showAuthMenu.value = !showAuthMenu.value }
function goLogin() { showAuthMenu.value = false; openLoginPage() }
function goRegister() { showAuthMenu.value = false; openRegisterPage() }

// 后台管理系统入口：已登录后台直接进管理页，否则先到后台登录页（后台不提供注册）。
// go() 里还有权限守卫，非管理员即使直接调用也会被挡回首页。
function onAdmin() { go(store.admin ? 'admin' : 'adminLogin') }

// 顶部导航条选分类：切分类并回到首页（其它视图中点击也能直达首页）
function pickCat(c) { setCat(c); go('home') }

// 我的优惠券：未登录时提示，已登录才进入领券中心
function onCoupon() {
  if (!store.user) {
    toast('请先登录后再查看我的优惠券')
    openAuth('login')
    return
  }
  go('coupon')
}

// 点击下拉以外的区域时收起菜单
function onDocClick(e) {
  if (showAuthMenu.value && authWrap.value && !authWrap.value.contains(e.target)) {
    showAuthMenu.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.logo {
  position: relative;
  display: flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  border-radius: 12px;
  transition: transform .12s ease;
}
.logo:active { transform: scale(.95); }
.logo:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
.logo-hint {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  box-shadow: var(--shadow);
  pointer-events: none;
  z-index: 70;
}
.logo-hint::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--primary);
  border-bottom: none;
}
.hint-pop-enter-active { animation: hintIn .3s ease; }
.hint-pop-leave-active { animation: hintOut .3s ease; }
@keyframes hintIn {
  from { opacity: 0; transform: translateX(-50%) translateY(6px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes hintOut {
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to { opacity: 0; transform: translateX(-50%) translateY(6px); }
}
.auth-wrap { position: relative; display: flex; }
.admin-entry {
  white-space: nowrap;
  border: 1px solid var(--line);
  color: var(--primary);
  font-weight: 600;
}
.admin-entry:hover { border-color: var(--primary); background: var(--bg); }
.auth-trigger { white-space: nowrap; }
.auth-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 132px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 6px;
  display: flex;
  flex-direction: column;
  z-index: 60;
}
.auth-item {
  text-align: left;
  background: transparent;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
}
.auth-item:hover { background: var(--bg); color: var(--primary); }
</style>
