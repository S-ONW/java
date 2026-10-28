<template>
  <div class="page">
    <div class="wrap">
      <div class="reg-hero">
        <div class="reg-panel">
          <h2>注册云购商城</h2>
          <p class="sub">创建账号，开启愉快购物之旅 🎁 新用户首单立减 ¥10</p>

          <form @submit.prevent="submit" novalidate>
            <div class="field" :class="{ err: errors.nick }">
              <label>昵称</label>
              <input v-model="form.nick" maxlength="12" placeholder="登录账号（最多 12 字）" @blur="checkNick" />
              <p class="tip" v-if="errors.nick">{{ errors.nick }}</p>
            </div>

            <div class="field" :class="{ err: errors.pwd }">
              <label>密码</label>
              <div class="pwd-wrap">
                <input v-model="form.pwd" :type="showPwd ? 'text' : 'password'" placeholder="至少 6 位，建议字母 + 数字" @blur="checkPwd" />
                <button type="button" class="eye" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</button>
              </div>
              <div class="strength" v-if="form.pwd">
                <div class="bar">
                  <span :class="['seg', 's' + strength.level, { on: strength.level >= 1 }]"></span>
                  <span :class="['seg', 's' + strength.level, { on: strength.level >= 2 }]"></span>
                  <span :class="['seg', 's' + strength.level, { on: strength.level >= 3 }]"></span>
                </div>
                <em :class="'lv' + strength.level">{{ strength.text }}</em>
              </div>
              <p class="tip" v-if="errors.pwd">{{ errors.pwd }}</p>
            </div>

            <div class="field" :class="{ err: errors.pwd2 }">
              <label>确认密码</label>
              <input v-model="form.pwd2" type="password" placeholder="再次输入密码" @blur="checkPwd2" />
              <p class="tip" v-if="errors.pwd2">{{ errors.pwd2 }}</p>
              <p class="tip ok" v-else-if="form.pwd2 && form.pwd === form.pwd2">两次输入一致 ✓</p>
            </div>

            <div class="field" :class="{ err: errors.captcha }">
              <label>图形验证码</label>
              <div class="captcha-row">
                <input v-model="form.captcha" maxlength="4" placeholder="输入右侧 4 位字符" autocomplete="off" spellcheck="false" @blur="checkCaptcha" />
                <img v-if="captchaImg" :src="captchaImg" class="cv" title="看不清？点击刷新" @click="fetchCaptcha" />
                <button type="button" class="refresh" title="换一张" @click="fetchCaptcha">🔄</button>
              </div>
              <p class="tip" v-if="errors.captcha">{{ errors.captcha }}</p>
            </div>

            <label class="agree" :class="{ err: errors.agree }">
              <input type="checkbox" v-model="form.agree" />
              <span>我已阅读并同意 <a>《用户协议》</a> 和 <a>《隐私政策》</a></span>
            </label>
            <p class="tip" v-if="errors.agree">{{ errors.agree }}</p>
            <p class="tip" v-if="formMsg">{{ formMsg }}</p>

            <button class="btn block reg-btn" type="submit" :disabled="loading">
              {{ loading ? '注册中…' : '立即注册' }}
            </button>
          </form>

          <p class="to-login">
            已有账号？
            <a @click="toLogin">去登录</a>
          </p>
        </div>

        <div class="reg-side">
          <div class="emoji">🛍️</div>
          <h3>加入云购</h3>
          <ul>
            <li>✨ 千款好物，每日上新</li>
            <li>🚚 满 ¥99 包邮，闪电发货</li>
            <li>🎫 新人专享优惠券礼包</li>
            <li>🔄 七天无理由退换货</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { store, submitRegister, go, toast } from '../store.js'

const API = 'http://localhost:8081'

const form = reactive({ nick: '', pwd: '', pwd2: '', captcha: '', agree: false })
const errors = reactive({ nick: '', pwd: '', pwd2: '', captcha: '', agree: '' })
const formMsg = ref('')
const showPwd = ref(false)
const loading = ref(false)

// ---------- 图形验证码（改为连接后端） ----------
const captchaImg = ref('')
const captchaToken = ref('')

// 向后端获取验证码图片 + token
async function fetchCaptcha() {
  try {
    const r = await fetch(API + '/api/captcha')
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const data = await r.json()
    captchaToken.value = data.token
    captchaImg.value = data.image
    form.captcha = ''
    errors.captcha = ''
  } catch (e) {
    captchaImg.value = ''
    errors.captcha = '验证码加载失败，请确认后端已启动'
  }
}

// 输入框失焦：调后端实时校验（不消费 token，可重复校验）
async function checkCaptcha() {
  const v = (form.captcha || '').trim()
  if (!v) { errors.captcha = '请输入图形验证码'; return false }
  try {
    const r = await fetch(API + '/api/captcha/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: captchaToken.value, code: v }),
    })
    const data = await r.json()
    if (data.ok) { errors.captcha = ''; return true }
    errors.captcha = '验证码不正确，请重试'
    fetchCaptcha() // 错误后自动换一张
    return false
  } catch (e) {
    errors.captcha = '验证码校验失败，请重试'
    return false
  }
}
onMounted(fetchCaptcha)

// 密码强度：0-3
const strength = computed(() => {
  const p = form.pwd
  if (!p) return { level: 0, text: '' }
  let score = 0
  if (p.length >= 6) score++
  if (/[a-zA-Z]/.test(p) && /\d/.test(p)) score++
  if (p.length >= 10 || /[^a-zA-Z0-9]/.test(p)) score++
  return { level: Math.max(1, score), text: ['弱', '弱', '中', '强'][Math.max(1, score)] }
})

function checkNick() {
  const v = form.nick.trim()
  if (!v) errors.nick = '请输入昵称'
  else if (v.length < 2) errors.nick = '昵称至少 2 个字符'
  else if (v.includes('@')) errors.nick = '昵称不能包含 @ 符号'
  else errors.nick = ''
  return !errors.nick
}
function checkPwd() {
  const v = form.pwd
  if (!v) errors.pwd = '请输入密码'
  else if (v.length < 6) errors.pwd = '密码至少 6 位'
  else errors.pwd = ''
  if (form.pwd2) checkPwd2()
  return !errors.pwd
}
function checkPwd2() {
  if (!form.pwd2) errors.pwd2 = '请再次输入密码'
  else if (form.pwd2 !== form.pwd) errors.pwd2 = '两次输入的密码不一致'
  else errors.pwd2 = ''
  return !errors.pwd2
}

async function submit() {
  formMsg.value = ''
  const okNick = checkNick()
  const okPwd = checkPwd()
  const okPwd2 = checkPwd2()
  const okCaptcha = await checkCaptcha()
  errors.agree = form.agree ? '' : '请先勾选同意用户协议'
  if (!(okNick && okPwd && okPwd2 && okCaptcha) || !form.agree) return
  loading.value = true
  const res = await submitRegister(form.nick.trim(), form.pwd, captchaToken.value, form.captcha)
  loading.value = false
  if (res.ok) {
    // 注册成功 → 跳转登录页面（并预填昵称），需填对账号密码才能登录
    store.prefillName = form.nick.trim()
    toast('注册成功，请登录 🎉')
    go('login')
  } else {
    // 注册失败（如昵称已注册）→ 停留在注册页并提示
    formMsg.value = res.msg
    if (res.msg && res.msg.includes('昵称')) errors.nick = res.msg
    fetchCaptcha() // 失败刷新验证码
  }
}

function toLogin() { go('login') }
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
.tip.ok{color:var(--ok)}
.pwd-wrap{position:relative}
.pwd-wrap input{padding-right:40px}
.pwd-wrap .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:16px;padding:6px}
.captcha-row{display:flex;gap:8px;align-items:center}
.captcha-row input{flex:1;min-width:0;letter-spacing:1px}
.captcha-row .cv{border:1px solid var(--line);border-radius:10px;background:#fafafb;cursor:pointer;flex-shrink:0;display:block;height:42px}
.captcha-row .cv:hover{border-color:var(--primary)}
.captcha-row .refresh{border:1px solid var(--line);border-radius:10px;background:var(--bg);width:42px;height:42px;font-size:16px;cursor:pointer;flex-shrink:0;transition:.15s}
.captcha-row .refresh:hover{border-color:var(--primary);transform:rotate(90deg)}
.strength{display:flex;align-items:center;gap:8px;margin-top:7px}
.strength .bar{display:flex;gap:4px;flex:1}
.strength .seg{height:4px;flex:1;border-radius:4px;background:var(--line)}
.strength .seg.on.s1{background:var(--primary)}
.strength .seg.on.s2{background:var(--warn)}
.strength .seg.on.s3{background:var(--ok)}
.strength em{font-size:12px;font-style:normal;font-weight:700;width:16px;text-align:center}
.strength em.lv1{color:var(--primary)}.strength em.lv2{color:var(--warn)}.strength em.lv3{color:var(--ok)}
.agree{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);margin:16px 0 6px;cursor:pointer}
.agree input{width:16px;height:16px;accent-color:var(--primary)}
.agree a{color:var(--primary)}
.agree.err{color:var(--primary)}
.reg-btn{margin-top:10px;padding:12px;font-size:15px}
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
