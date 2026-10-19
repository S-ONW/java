<template>
  <AppHeader />

  <main>
    <HomeView v-if="store.view === 'home'" />
    <CheckoutView v-else-if="store.view === 'checkout'" />
    <OrdersView v-else-if="store.view === 'orders'" />
    <AccountView v-else-if="store.view === 'account'" />
    <RegisterView v-else-if="store.view === 'register'" />
    <LoginView v-else-if="store.view === 'login'" />
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

  <!-- 返回顶部 & Toast -->
  <button class="to-top" :class="{ show: showToTop }" @click="scrollTop">↑</button>
  <Toast />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { store, closeDrawer } from './store.js'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import HomeView from './components/HomeView.vue'
import CheckoutView from './components/CheckoutView.vue'
import OrdersView from './components/OrdersView.vue'
import AccountView from './components/AccountView.vue'
import RegisterView from './components/RegisterView.vue'
import LoginView from './components/LoginView.vue'
import CartDrawer from './components/CartDrawer.vue'
import WishDrawer from './components/WishDrawer.vue'
import OrderDrawer from './components/OrderDrawer.vue'
import DetailModal from './components/DetailModal.vue'
import AuthModal from './components/AuthModal.vue'
import AddrModal from './components/AddrModal.vue'
import SuccessModal from './components/SuccessModal.vue'
import Toast from './components/Toast.vue'

const showToTop = ref(false)
function onScroll() { showToTop.value = window.scrollY > 300 }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

onMounted(() => {
  // 入口规则：
  //  - 已登录（localStorage 有 shopUser）→ 直接进商城首页
  //  - 带 #login（如 register.html 注册成功后的跳转目标）→ 登录页
  //  - 其他情况 → 默认打开注册页面
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
  window.addEventListener('scroll', onScroll)
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>
