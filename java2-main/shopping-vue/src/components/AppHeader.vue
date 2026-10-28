<template>
  <header>
    <div class="nav">
      <div class="logo" @click="go('home')">云购<span>商城</span></div>
      <div class="search">
        <input v-model="keyword" type="text" placeholder="搜索商品，如 耳机 / 咖啡 / 瑜伽…" @keyup.enter="onSearch" />
        <button @click="onSearch">搜索</button>
      </div>
      <button class="icon-btn" @click="openWish" title="收藏夹">❤️ <span class="badge">{{ store.wish.length }}</span></button>
      <button class="icon-btn" @click="go('orders')" title="我的订单">📦 <span class="badge" v-show="store.orders.length">{{ store.orders.length }}</span></button>
      <button class="icon-btn" @click="toggleTheme" title="暗色模式">{{ store.theme === 'dark' ? '☀️' : '🌙' }}</button>
      <button class="icon-btn admin-entry" @click="onAdmin" title="后台管理系统">⚙️ 后台管理</button>
      <button class="icon-btn" @click="openCart" title="购物车">🛒 <span class="badge">{{ cartCount }}</span></button>
      <div v-if="store.user" class="avatar" @click="openAccount" title="账户">{{ store.user.name[0].toUpperCase() }}</div>
      <div v-else class="auth-wrap" ref="authWrap">
        <button class="icon-btn auth-trigger" type="button" @click.stop="toggleAuthMenu">👤 登录 / 注册</button>
        <div class="auth-menu" v-if="showAuthMenu">
          <button class="auth-item" type="button" @click="goLogin">登录</button>
          <button class="auth-item" type="button" @click="goRegister">注册</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { store, cartCount, go, openCart, openWish, toggleTheme, openAccount, openLoginPage, openRegisterPage } from '../store.js'

const keyword = ref(store.keyword)
const showAuthMenu = ref(false)
const authWrap = ref(null)

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

// 后台管理系统入口：已登录直接进管理页，未登录先到后台登录页（后台不提供注册）
function onAdmin() { go(store.admin ? 'admin' : 'adminLogin') }

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
