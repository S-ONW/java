<template>
  <div class="page">
    <div class="wrap">
      <div class="reg-hero">
        <div class="reg-panel">
          <h2>登录云购商城</h2>
          <p class="sub">欢迎回来，请使用已注册的账号登录 👋</p>

          <form @submit.prevent="submit" novalidate>
            <div class="field" :class="{ err: errors.name }">
              <label>昵称</label>
              <input v-model="form.name" maxlength="12" placeholder="请输入注册时的昵称" @blur="checkName" />
              <p class="tip" v-if="errors.name">{{ errors.name }}</p>
            </div>

            <div class="field" :class="{ err: errors.pwd }">
              <label>密码</label>
              <div class="pwd-wrap">
                <input v-model="form.pwd" :type="showPwd ? 'text' : 'password'" placeholder="请输入注册时设置的密码" @blur="checkPwd" />
                <button type="button" class="eye" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</button>
              </div>
              <p class="tip" v-if="errors.pwd">{{ errors.pwd }}</p>
            </div>

            <p class="tip" v-if="formMsg">{{ formMsg }}</p>

            <button class="btn block reg-btn" type="submit" :disabled="loading">
              {{ loading ? '登录中…' : '登 录' }}
            </button>
          </form>

          <p class="to-login">
            还没有账号？
            <a @click="go('register')">去注册</a>
          </p>
        </div>

        <div class="reg-side">
          <div class="emoji">🔐</div>
          <h3>安全登录</h3>
          <ul>
            <li>✅ 仅已注册的账号可登录</li>
            <li>🔒 邮箱或密码错误将无法进入</li>
            <li>🛒 登录后同步购物车与订单</li>
            <li>🎁 新人专享优惠券礼包</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { store, submitAuth, go, toast } from '../store.js'

// 从注册页跳转过来时预填昵称（用后即清空）
const form = reactive({ name: store.prefillName || '', pwd: '' })
store.prefillName = ''

const errors = reactive({ name: '', pwd: '' })
const formMsg = ref('')
const showPwd = ref(false)
const loading = ref(false)

function checkName() {
  const v = form.name.trim()
  if (!v) errors.name = '请输入昵称'
  else errors.name = ''
  return !errors.name
}
function checkPwd() {
  if (!form.pwd) errors.pwd = '请输入密码'
  else if (form.pwd.length < 6) errors.pwd = '密码至少 6 位'
  else errors.pwd = ''
  return !errors.pwd
}

async function submit() {
  formMsg.value = ''
  const ok = [checkName(), checkPwd()].every(Boolean)
  if (!ok) return
  loading.value = true
  const res = await submitAuth(form.name.trim(), form.pwd)
  loading.value = false
  if (res.ok) {
    toast('登录成功，欢迎回来 👋')
    go('home')
  } else {
    // 账号不存在 / 密码错误：停留在登录页并提示
    formMsg.value = res.msg
  }
}
</script>

<style scoped>
.reg-hero{
  display:grid;grid-template-columns:1fr 300px;gap:0;
  background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);
  overflow:hidden;margin-top:12px;
}
.reg-panel{padding:36px 40px}
.reg-panel h2{font-size:24px;margin-bottom:6px}
.reg-panel .sub{font-size:13px;color:var(--muted);margin-bottom:22px}
.field{margin-bottom:14px}
.field label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}
.field input{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--bg);color:var(--text);outline:none;font-family:inherit;transition:border-color .15s}
.field input:focus{border-color:var(--primary)}
.field.err input{border-color:var(--primary)}
.tip{font-size:12px;color:var(--primary);margin-top:5px}
.pwd-wrap{position:relative}
.pwd-wrap input{padding-right:40px}
.pwd-wrap .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:16px;padding:6px}
.reg-btn{margin-top:10px;padding:12px;font-size:15px;letter-spacing:2px}
.reg-btn:disabled{opacity:.6;cursor:not-allowed}
.to-login{text-align:center;margin-top:16px;font-size:13px;color:var(--muted)}
.to-login a{color:var(--primary);cursor:pointer;font-weight:600}
.reg-side{
  background:linear-gradient(160deg,#4da3ff,#8cc8ff);
  color:#fff;padding:40px 28px;display:flex;flex-direction:column;justify-content:center;
}
.reg-side .emoji{font-size:52px;margin-bottom:12px}
.reg-side h3{font-size:20px;margin-bottom:16px}
.reg-side ul{list-style:none;display:flex;flex-direction:column;gap:12px;font-size:14px;opacity:.95}
@media(max-width:860px){
  .reg-hero{grid-template-columns:1fr}
  .reg-panel{padding:26px 22px}
  .reg-side{order:-1;padding:26px 22px}
  .reg-side ul{flex-direction:row;flex-wrap:wrap;gap:8px 16px}
}
</style>
