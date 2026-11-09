<template>
  <!-- 后台管理系统：独立布局，不显示商城头部 / 页脚 -->
  <template v-if="isAdminView">
    <AdminLogin v-if="store.view === 'adminLogin'" />
    <AdminView v-else />
  </template>

  <!-- 商城前台 -->
  <template v-else>
    <AppHeader />

    <main>
      <HomeView v-if="store.view === 'home'" />
      <CheckoutView v-else-if="store.view === 'checkout'" />
      <OrdersView v-else-if="store.view === 'orders'" />
      <AccountView v-else-if="store.view === 'account'" />
      <RegisterView v-else-if="store.view === 'register'" />
      <LoginView v-else-if="store.view === 'login'" />
      <CouponView v-else-if="store.view === 'coupon'" />
    </main>

    <AppFooter />

    <!-- 抽屉遮罩 -->
    <div class="overlay" :class="{ open: store.drawer }" @click="closeDrawer"></div>

    <!-- 抽屉（常驻 DOM，靠 .open 类切换滑入） -->
    <CartDrawer />
    <WishDrawer />
    <OrderDrawer />

    <!-- 弹窗：按需挂载 -->
    <DetailModal v-if="store.modal === 'detail'" />
    <AuthModal v-if="store.modal === 'auth'" />
    <AddrModal v-if="store.modal === 'addr'" />
    <SuccessModal v-if="store.modal === 'success'" />

    <!-- 返回顶部 -->
    <button class="to-top" :class="{ show: showToTop }" @click="scrollTop">↑</button>
  </template>

  <!-- Toast：前台与后台共用 -->
  <Toast />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { store, closeDrawer, loadProducts, isAdminUser, adminLogout, go } from './store.js'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import HomeView from './components/HomeView.vue'
import CheckoutView from './components/CheckoutView.vue'
import OrdersView from './components/OrdersView.vue'
import AccountView from './components/AccountView.vue'
import RegisterView from './components/RegisterView.vue'
import LoginView from './components/LoginView.vue'
import CouponView from './components/CouponView.vue'
import CartDrawer from './components/CartDrawer.vue'
import WishDrawer from './components/WishDrawer.vue'
import OrderDrawer from './components/OrderDrawer.vue'
import DetailModal from './components/DetailModal.vue'
import AuthModal from './components/AuthModal.vue'
import AddrModal from './components/AddrModal.vue'
import SuccessModal from './components/SuccessModal.vue'
import Toast from './components/Toast.vue'
import AdminLogin from './components/AdminLogin.vue'
import AdminView from './components/AdminView.vue'

// 后台视图（登录页 / 管理页）走独立布局，不套商城的头部与页脚。
// 必须同时满足「当前登录用户是管理员权限（0）」，否则即便视图被改成 admin 也不渲染后台。
const isAdminView = computed(() =>
  isAdminUser.value && (store.view === 'adminLogin' || store.view === 'admin')
)

// 登录态变化（退出登录 / 换成普通账号）时，立刻把后台视图踢回商城首页
watch(isAdminUser, (ok) => {
  if (!ok && (store.view === 'admin' || store.view === 'adminLogin')) {
    adminLogout()
    go('home')
  }
})

const showToTop = ref(false)
function onScroll() { showToTop.value = window.scrollY > 300 }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

onMounted(() => {
  // 入口规则：
  //  - 已登录（localStorage 有 shopUser）→ 直接进商城首页
  //  - 带 #login（如 register.html 注册成功后的跳转目标）→ 登录页
  //  - 其他情况 → 默认打开注册页面
  // 兜底：非管理员不得停留在后台视图（例如旧版本残留的视图状态）
  if ((store.view === 'admin' || store.view === 'adminLogin') && !isAdminUser.value) {
    store.view = 'home'
  }
  if (location.hash.indexOf('#login') === 0 && !store.user) {
    // 从 register.html 注册成功跳转过来：取出预填昵称（用后即清空）
    const prefill = localStorage.getItem('shopPrefillName')
    if (prefill) {
      store.prefillName = prefill
      localStorage.removeItem('shopPrefillName')
    }
    store.view = 'login'
  }
  else if (location.hash === '#home' || store.user) store.view = 'home'
  else store.view = 'register'
  const t = localStorage.getItem('shopTheme')
  const theme = t || store.theme
  store.theme = theme
  document.documentElement.setAttribute('data-theme', theme)
  // 启动时尝试拉取后端商品数据：后台管理改过的数据会直接反映到首页
  loadProducts()
  window.addEventListener('scroll', onScroll)
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>
