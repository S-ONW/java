<template>
  <div class="admin">
    <!-- 顶部栏 -->
    <header class="top">
      <div class="brand">
        <span class="logo">⚙️</span>
        <div class="titles">
          <h1>云购商城 · 后台管理系统</h1>
          <p>管理首页展示的商品数据，增删改会实时同步到商城首页</p>
        </div>
      </div>
      <div class="ops">
        <span class="chip warn" v-if="store.admin && store.admin.offline">离线模式 · 数据存本地</span>
        <span class="chip ok" v-else>已连接数据库</span>
        <span class="who">👤 {{ (store.admin && store.admin.nick) || '管理员' }}</span>
        <button class="btn ghost" @click="back">← 返回商城</button>
        <button class="btn ghost" @click="logout">退出登录</button>
      </div>
    </header>

    <div class="wrap">
      <!-- 数据概览 -->
      <section class="stats">
        <div class="stat"><em>{{ stats.total }}</em><span>商品总数</span></div>
        <div class="stat"><em>{{ stats.cats }}</em><span>商品分类</span></div>
        <div class="stat"><em>{{ stats.stock }}</em><span>库存总量（件）</span></div>
        <div class="stat danger"><em>{{ stats.low }}</em><span>低库存预警（≤10）</span></div>
      </section>

      <!-- 工具栏 -->
      <section class="toolbar">
        <input v-model="kw" class="search" placeholder="🔍 搜索商品名称 / 描述 / 分类" />
        <select v-model="cat">
          <option value="">全部分类</option>
          <option v-for="c in catList" :key="c" :value="c">{{ c }}</option>
        </select>
        <button class="btn primary" @click="openForm(null)">＋ 新增商品</button>
        <button class="btn" @click="refresh">🔄 刷新数据</button>
      </section>

      <!-- 商品表格 -->
      <section class="panel">
        <table>
          <thead>
            <tr>
              <th>图标</th><th>ID</th><th>商品名称</th><th>分类</th>
              <th>售价</th><th>原价</th><th>库存</th><th>热度</th><th>评分</th>
              <th>角标</th><th class="right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in list" :key="p.id">
              <td class="icon">{{ p.icon }}</td>
              <td class="muted">{{ p.id }}</td>
              <td class="name">
                {{ p.name }}
                <em>{{ p.desc }}</em>
              </td>
              <td>{{ p.cat }}</td>
              <td class="price">¥{{ p.price }}</td>
              <td class="muted">¥{{ p.old }}</td>
              <td :class="{ low: +p.stock <= 10 }">{{ p.stock }}</td>
              <td>{{ p.hot }}</td>
              <td>{{ p.rate }}</td>
              <td><span class="badge" v-if="p.tag">{{ p.tag }}</span><span v-else class="muted">—</span></td>
              <td class="right ops">
                <button class="btn sm" @click="openForm(p)">编辑</button>
                <button class="btn sm danger" @click="remove(p)">删除</button>
              </td>
            </tr>
            <tr v-if="!list.length">
              <td colspan="11" class="empty">暂无商品数据，点击「新增商品」添加</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <div class="mask" v-if="showForm" @click.self="showForm = false">
      <div class="modal">
        <h3>{{ editing ? '编辑商品' : '新增商品' }}</h3>
        <div class="grid">
          <label class="f"><span>商品名称 *</span><input v-model="draft.name" placeholder="如：无线降噪耳机" /></label>
          <label class="f"><span>分类</span><input v-model="draft.cat" list="cat-list" placeholder="数码 / 家居 / 美妆…" /></label>
          <label class="f"><span>图标 emoji</span><input v-model="draft.icon" placeholder="🎧" /></label>
          <label class="f"><span>角标</span><input v-model="draft.tag" placeholder="热销 / 新品 / 折扣（可空）" /></label>
          <label class="f wide"><span>商品描述</span><input v-model="draft.desc" placeholder="一句话卖点" /></label>
          <label class="f"><span>售价（元）</span><input v-model="draft.price" type="number" min="0" /></label>
          <label class="f"><span>原价（元）</span><input v-model="draft.old" type="number" min="0" /></label>
          <label class="f"><span>库存</span><input v-model="draft.stock" type="number" min="0" /></label>
          <label class="f"><span>热度</span><input v-model="draft.hot" type="number" min="0" /></label>
          <label class="f"><span>评分</span><input v-model="draft.rate" type="number" step="0.1" min="0" max="5" /></label>
          <label class="f wide"><span>图集 emoji（空格或逗号分隔）</span><input v-model="gText" placeholder="🎧 🔇 🔋" /></label>
        </div>
        <datalist id="cat-list">
          <option v-for="c in catList" :key="c" :value="c"></option>
        </datalist>

        <p class="err" v-if="formErr">{{ formErr }}</p>
        <div class="modal-ops">
          <button class="btn" @click="showForm = false">取消</button>
          <button class="btn primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  store, loadProducts, adminSaveProduct, adminDeleteProduct, adminLogout, go, toast,
} from '../store.js'

const kw = ref('')
const cat = ref('')
const showForm = ref(false)
const editing = ref(null)
const saving = ref(false)
const formErr = ref('')
const gText = ref('')

function blank() {
  return {
    id: null, name: '', desc: '', price: 99, old: 129, cat: '数码',
    icon: '📦', hot: 60, rate: 4.5, stock: 20, tag: '', g: [],
  }
}
const draft = reactive(blank())

// 分类列表：来自当前商品数据，新增分类后自动出现
const catList = computed(() => [...new Set(store.products.map((p) => p.cat))])

const list = computed(() =>
  store.products.filter((p) => {
    const k = kw.value.trim().toLowerCase()
    const okKw = !k || (p.name + p.desc + p.cat).toLowerCase().includes(k)
    const okCat = !cat.value || p.cat === cat.value
    return okKw && okCat
  })
)

const stats = computed(() => ({
  total: store.products.length,
  cats: catList.value.length,
  stock: store.products.reduce((s, p) => s + (+p.stock || 0), 0),
  low: store.products.filter((p) => (+p.stock || 0) <= 10).length,
}))

function openForm(p) {
  editing.value = p
  Object.assign(draft, p ? { ...p } : blank())
  gText.value = (p && p.g ? p.g : []).join(' ')
  formErr.value = ''
  showForm.value = true
}

async function save() {
  if (!draft.name.trim()) { formErr.value = '商品名称不能为空'; return }
  saving.value = true
  const payload = {
    ...draft,
    name: draft.name.trim(),
    g: gText.value.split(/[\s,，]+/).filter(Boolean),
  }
  const res = await adminSaveProduct(payload)
  saving.value = false
  if (res.ok) {
    toast(res.msg)
    showForm.value = false
  } else {
    formErr.value = res.msg
  }
}

async function remove(p) {
  if (!window.confirm(`确定删除商品「${p.name}」？删除后该商品将从商城首页移除。`)) return
  const res = await adminDeleteProduct(p.id)
  toast(res.msg)
}

async function refresh() {
  const res = await loadProducts()
  toast(res.msg)
}

function logout() {
  adminLogout()
  toast('已退出后台登录')
  go('adminLogin')
}
function back() { go('home') }

// 未登录时（如刷新页面后登录态丢失）回到登录页
onMounted(() => {
  if (!store.admin) go('adminLogin')
})
</script>

<style scoped>
.admin { min-height: 100vh; background: var(--bg); color: var(--text); }

/* 顶部栏 */
.top {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 14px 22px; background: var(--card); border-bottom: 1px solid var(--line);
  position: sticky; top: 0; z-index: 20; flex-wrap: wrap;
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand .logo {
  width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 20px;
  border-radius: 12px; background: linear-gradient(140deg, #4da3ff, #6a7bff); color: #fff;
}
.titles h1 { font-size: 17px; margin-bottom: 3px; }
.titles p { font-size: 12px; color: var(--muted); }
.ops { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.who { font-size: 13px; color: var(--muted); }
.chip {
  font-size: 12px; padding: 4px 10px; border-radius: 20px;
  background: var(--bg); color: var(--muted); border: 1px solid var(--line);
}
.chip.ok { color: var(--ok); border-color: var(--ok); }
.chip.warn { color: var(--warn); border-color: var(--warn); }

.wrap { max-width: 1200px; margin: 0 auto; padding: 20px 22px 40px; }

/* 概览卡片 */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.stat {
  background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px;
}
.stat em { display: block; font-style: normal; font-size: 26px; font-weight: 700; color: var(--primary); }
.stat span { font-size: 13px; color: var(--muted); }
.stat.danger em { color: var(--warn); }

/* 工具栏 */
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.toolbar .search { flex: 1; min-width: 200px; }
.toolbar input, .toolbar select {
  border: 1px solid var(--line); border-radius: 10px; padding: 9px 12px;
  background: var(--card); color: var(--text); outline: none; font-family: inherit; font-size: 14px;
}
.toolbar input:focus, .toolbar select:focus { border-color: var(--primary); }

/* 表格 */
.panel {
  background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow-x: auto;
}
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid var(--line); white-space: nowrap; }
th { background: var(--bg); font-size: 13px; color: var(--muted); font-weight: 600; }
tbody tr:hover td { background: var(--bg); }
td.right, th.right { text-align: right; }
.icon { font-size: 20px; }
.name { white-space: normal; min-width: 180px; }
.name em { display: block; font-style: normal; font-size: 12px; color: var(--muted); margin-top: 2px; }
.price { color: var(--primary); font-weight: 700; }
.muted { color: var(--muted); }
.low { color: var(--warn); font-weight: 700; }
.badge {
  font-size: 12px; padding: 2px 8px; border-radius: 12px;
  background: var(--bg); color: var(--primary); border: 1px solid var(--line);
}
.empty { text-align: center; color: var(--muted); padding: 40px 0; }
.ops { display: flex; gap: 6px; justify-content: flex-end; }

/* 按钮 */
.btn {
  border: 1px solid var(--line); background: var(--card); color: var(--text);
  padding: 9px 14px; border-radius: 10px; cursor: pointer; font-size: 14px;
  font-family: inherit; transition: .15s; white-space: nowrap;
}
.btn:hover { border-color: var(--primary); }
.btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }
.btn.primary:hover { filter: brightness(1.06); }
.btn.primary:disabled { opacity: .6; cursor: not-allowed; }
.btn.ghost { background: transparent; color: var(--muted); }
.btn.sm { padding: 5px 12px; font-size: 13px; }
.btn.danger { color: var(--primary); border-color: var(--primary); }

/* 弹窗 */
.mask {
  position: fixed; inset: 0; background: rgba(15, 25, 45, .45);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
}
.modal {
  background: var(--card); border-radius: 16px; padding: 24px;
  width: 100%; max-width: 560px; max-height: 88vh; overflow: auto;
}
.modal h3 { font-size: 18px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
.f { display: flex; flex-direction: column; gap: 6px; }
.f.wide { grid-column: 1 / -1; }
.f span { font-size: 12px; color: var(--muted); }
.f input {
  border: 1px solid var(--line); border-radius: 9px; padding: 9px 11px;
  background: var(--bg); color: var(--text); outline: none; font-family: inherit; font-size: 14px;
}
.f input:focus { border-color: var(--primary); }
.modal-ops { display: flex; justify-content: flex-end; gap: 10px; }
.err { color: var(--primary); font-size: 13px; margin-bottom: 8px; }

@media (max-width: 860px) {
  .stats { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .grid { grid-template-columns: 1fr; }
  .top { padding: 12px 14px; }
  .wrap { padding: 14px; }
}
</style>
