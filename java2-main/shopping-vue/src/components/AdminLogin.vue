<template>
  <div class="admin-login">
    <div class="box">
      <div class="brand">
        <div class="logo">⚙️</div>
        <h2>后台管理系统</h2>
        <p class="sub">云购商城 · 商品数据管理后台</p>
      </div>

      <form @submit.prevent="submit" novalidate>
        <div class="field" :class="{ err: errors.username }">
          <label>管理员账号</label>
          <input v-model="form.username" placeholder="请输入管理员账号" autocomplete="off" @blur="checkUsername" />
          <p class="tip" v-if="errors.username">{{ errors.username }}</p>
        </div>

        <div class="field" :class="{ err: errors.pwd }">
          <label>密码</label>
          <div class="pwd-wrap">
            <input v-model="form.pwd" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码" @blur="checkPwd" />
            <button type="button" class="eye" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</button>
          </div>
          <p class="tip" v-if="errors.pwd">{{ errors.pwd }}</p>
        </div>

        <p class="msg" v-if="msg">{{ msg }}</p>

        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>
      </form>

      <p class="note">🔒 本系统仅开放登录，不提供注册入口，账号由系统管理员分配。</p>
      <p class="demo">演示账号：<b>admin</b> / <b>admin123</b>（可在后端 application-dev.properties 中修改）</p>

      <a class="back" @click="back">← 返回商城首页</a>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { store, adminLogin, go, toast } from '../store.js'

const form = reactive({ username: '', pwd: '' })
const errors = reactive({ username: '', pwd: '' })
const showPwd = ref(false)
const loading = ref(false)
const msg = ref('')

function checkUsername() {
  errors.username = form.username.trim() ? '' : '请输入管理员账号'
  return !errors.username
}
function checkPwd() {
  errors.pwd = form.pwd ? '' : '请输入密码'
  return !errors.pwd
}

async function submit() {
  msg.value = ''
  if (!checkUsername() || !checkPwd()) return
  loading.value = true
  const res = await adminLogin(form.username, form.pwd)
  loading.value = false
  if (res.ok) {
    toast('欢迎回来，管理员 👋')
    go('admin')
  } else {
    msg.value = res.msg
  }
}

function back() { go('home') }

// 已登录状态下直接进入管理页
onMounted(() => {
  if (store.admin) go('admin')
})
</script>

<style scoped>
.admin-login{
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
  background:linear-gradient(150deg,#4da3ff,#6a7bff 55%,#8b5cf6);
}
.box{
  width:100%;max-width:400px;background:var(--card);border-radius:18px;
  box-shadow:0 18px 50px rgba(20,40,90,.28);padding:36px 32px 28px;
}
.brand{text-align:center;margin-bottom:26px}
.brand .logo{
  width:56px;height:56px;line-height:56px;font-size:28px;margin:0 auto 12px;border-radius:16px;
  background:linear-gradient(140deg,#4da3ff,#6a7bff);color:#fff;
}
.brand h2{font-size:22px;margin-bottom:6px}
.brand .sub{font-size:13px;color:var(--muted)}
.field{margin-bottom:14px}
.field label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}
.field input{
  width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;
  background:var(--bg);color:var(--text);outline:none;font-family:inherit;transition:border-color .15s;
}
.field input:focus{border-color:var(--primary)}
.field.err input{border-color:var(--primary)}
.pwd-wrap{position:relative}
.pwd-wrap input{padding-right:42px}
.pwd-wrap .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:16px;padding:6px}
.tip{font-size:12px;color:var(--primary);margin-top:5px}
.msg{
  font-size:13px;color:var(--primary);background:var(--bg);border-radius:8px;
  padding:8px 10px;margin-bottom:12px;
}
.btn{
  width:100%;padding:12px;border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:600;
  background:linear-gradient(135deg,#4da3ff,#3a5cff);color:#fff;transition:.15s;
}
.btn:hover{filter:brightness(1.05)}
.btn:disabled{opacity:.6;cursor:not-allowed}
.note{font-size:12px;color:var(--muted);text-align:center;margin:16px 0 6px}
.demo{font-size:12px;color:var(--muted);text-align:center;margin-bottom:14px}
.demo b{color:var(--text)}
.back{display:block;text-align:center;font-size:13px;color:var(--primary);cursor:pointer;font-weight:600}
.back:hover{text-decoration:underline}
</style>
