<template>
  <div class="page">
    <div class="wrap">
      <div class="reg-hero">
        <!-- 左侧雪景插画（与注册页统一放左边） -->
        <div class="reg-art" role="img" aria-label="冬日雪景插画">
          <div class="art-copy">
            <p class="art-eyebrow">欢迎回到{{ SHOP_NAME }}</p>
            <h3>雪落无声<br />静候归人</h3>
            <span class="art-rule"></span>
            <ul>
              <li>仅已注册的账号可登录</li>
              <li>登录后同步购物车与订单</li>
              <li>优惠券自动归集到账户</li>
              <li>七天无理由退换货</li>
            </ul>
          </div>
        </div>

        <div class="reg-panel">
          <h2>登录{{ SHOP_NAME }}</h2>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import mascotHappy from '../assets/mascot/happy.png'
import { ref, reactive } from 'vue'
import { store, submitAuth, go, toast } from '../store.js'
import { SHOP_NAME } from '../brand.js'

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
  --serif:"STSong","Songti SC","Noto Serif SC","Source Han Serif SC","SimSun",Georgia,"Times New Roman",serif;
  display:grid;grid-template-columns:340px 1fr;gap:0;
  background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);
  overflow:hidden;max-width:1020px;margin:14px auto 0;
}
/* 表单在卡片里垂直居中，避免插画栏比表单高时留白偏上 */
.reg-panel{padding:36px 40px;display:flex;flex-direction:column;justify-content:center}
.reg-panel h2{font-family:var(--serif);font-size:25px;font-weight:400;letter-spacing:.1em;margin-bottom:9px}
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
/* ---------- 左侧雪景插画栏（与注册页同一套视觉） ---------- */
.reg-art{
  position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:flex-end;
  min-height:540px;padding:34px 28px 30px;color:#fff;
  background:#a9c8e6 url('../assets/register-hero.webp') center 10%/cover no-repeat;
}
/* 右侧渐隐成卡片底色，和表单区无缝衔接 */
.reg-art::before{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:linear-gradient(270deg,var(--card) 0%,transparent 34%);
}
/* 底部压暗，保证白色文字在任何雪花噪点上都能读清 */
.reg-art::after{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:linear-gradient(to top,rgba(10,28,52,.90) 0%,rgba(10,28,52,.60) 32%,rgba(10,28,52,0) 64%);
}
/* 小人像一枚「欢迎回来」贴纸，轻放在插画右上角 */
.art-mascot{
  position:absolute;top:16px;right:14px;z-index:1;
  width:58px;height:58px;
  filter:drop-shadow(0 6px 14px rgba(6,22,48,.45));
  opacity:.96;
}
.art-copy{position:relative;z-index:1}
.art-eyebrow{
  display:inline-block;font-family:var(--serif);font-size:11px;letter-spacing:.24em;
  color:rgba(255,255,255,.94);
  padding:5px 12px 5px 14px;border-radius:999px;
  background:rgba(10,28,52,.42);border:1px solid rgba(255,255,255,.26);
  backdrop-filter:blur(4px);
  margin-bottom:14px;
}
.reg-art h3{
  font-family:var(--serif);font-weight:400;font-size:27px;line-height:1.62;
  letter-spacing:.15em;text-shadow:0 2px 14px rgba(4,16,34,.6);
}
.art-rule{
  display:block;width:46px;height:1px;margin:17px 0 19px;
  background:linear-gradient(90deg,rgba(255,255,255,.92),rgba(255,255,255,0));
}
.reg-art ul{
  list-style:none;display:flex;flex-direction:column;gap:11px;
  font-family:var(--serif);font-size:13.5px;letter-spacing:.06em;
  color:rgba(255,255,255,.9);
}
.reg-art li{display:flex;align-items:center;gap:10px}
.reg-art li::before{
  content:'';flex-shrink:0;width:4px;height:4px;border-radius:50%;
  background:#fff;box-shadow:0 0 9px rgba(190,225,255,.95);
}
@media(max-width:860px){
  .reg-hero{grid-template-columns:1fr}
  .reg-panel{padding:26px 22px}
  .reg-art{order:-1;min-height:0;height:250px;padding:18px 20px}
  .reg-art::before{background:none}
  .reg-art::after{background:linear-gradient(to top,rgba(8,22,42,.93) 0%,rgba(8,22,42,.66) 48%,rgba(8,22,42,.14) 100%)}
  .art-mascot{width:44px;height:44px;top:12px;right:12px}
  .art-eyebrow{margin-bottom:10px;font-size:10.5px;padding:4px 10px 4px 12px;letter-spacing:.2em}
  .reg-art h3{font-size:20px;letter-spacing:.1em;line-height:1.46}
  .art-rule{margin:9px 0 0;width:30px}
  .reg-art ul{display:none}
}
</style>
