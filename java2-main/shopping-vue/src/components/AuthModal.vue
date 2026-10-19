<template>
  <div class="modal open" @click.self="closeModal">
    <div class="modal-box" style="max-width:400px">
      <div class="modal-head">
        <h3>{{ store.authMode === 'login' ? '登录' : '注册' }}云购</h3>
        <button class="close" @click="closeModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="field"><label>昵称</label><input v-model="name" maxlength="12" placeholder="请输入注册时的昵称" /></div>
        <div class="field"><label>密码</label><input v-model="pwd" type="password" placeholder="至少 6 位" /></div>
        <div class="field" v-if="store.authMode === 'register'"><label>昵称</label><input v-model="nick" placeholder="展示名称" /></div>
        <p style="text-align:center;margin-top:10px;font-size:13px;color:var(--primary)" v-if="msg">{{ msg }}</p>
        <button class="btn block" @click="submit">{{ store.authMode === 'login' ? '登录' : '去注册' }}</button>
        <p style="text-align:center;margin-top:12px;font-size:13px;color:var(--muted)">
          {{ store.authMode === 'login' ? '还没有账号？' : '已有账号？' }}
          <a v-if="store.authMode === 'login'" style="color:var(--primary);cursor:pointer;font-weight:600" @click="goRegisterPage">去注册</a>
          <a v-else style="color:var(--primary);cursor:pointer;font-weight:600" @click="switchAuth">去登录</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { store, closeModal, switchAuth, submitAuth, openRegisterPage, toast } from '../store.js'

const name = ref('')
const pwd = ref('')
const nick = ref('')
const msg = ref('')

// 跳转到站内注册页（原 register.html 独立页，保持单页体验）
function goRegisterPage() {
  closeModal()
  openRegisterPage()
}

async function submit() {
  msg.value = ''
  // 注册统一走独立的注册页面
  if (store.authMode === 'register') { goRegisterPage(); return }
  if (!name.value.trim() || !pwd.value) { msg.value = '请输入昵称和密码'; return }
  const res = await submitAuth(name.value.trim(), pwd.value)
  if (res.ok) {
    closeModal()
    toast('登录成功，欢迎回来 👋')
    name.value = pwd.value = ''
  } else {
    // 账号不存在 / 密码错误：保持弹窗打开并提示
    msg.value = res.msg
  }
}
</script>
