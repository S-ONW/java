// 商品/广告/优惠等静态数据，从原 shopping.html 抽取而来
// 首页首屏企划：文案跟街景插画同一个调子——短句、硬字重、不加 emoji
export const BANNERS = [
  { en: "Street Edit · 01", h: "街头上新，全场五折起", p: "全场低至 5 折 · 顺丰发货 · 七天无理由退换", t: "新人专享 · 满 ¥99 包邮", link: "coupon" },
  { en: "Digital Renewal · 02", h: "数码焕新，静享好声", p: "耳机 / 键盘 / 手表，限时直降", t: "晒单返现 · 最高返 ¥50", link: "cat:数码" },
  { en: "Healthy Living · 03", h: "起居有度，身心皆安", p: "瑜伽 / 运动 / 个护，满 199 减 30", t: "会员双倍积分", link: "cat:运动" },
]

export const PRODUCTS = [
  { id: 1, name: "无线降噪耳机", desc: "主动降噪 · 30h 续航 · 通透模式", price: 399, old: 599, cat: "数码", icon: "🎧", hot: 98, rate: 4.8, stock: 32, tag: "热销", g: ["🎧", "🔇", "🔋"] },
  { id: 2, name: "机械键盘", desc: "RGB 背光 · 红轴手感 · 全键无冲", price: 259, old: 349, cat: "数码", icon: "⌨️", hot: 85, rate: 4.6, stock: 18, tag: "折扣", g: ["⌨️", "💡", "🖱️"] },
  { id: 3, name: "智能手表", desc: "心率血氧 · 运动追踪 · 防水", price: 699, old: 899, cat: "数码", icon: "⌚", hot: 90, rate: 4.7, stock: 9, tag: "新品", g: ["⌚", "❤️", "🏃"] },
  { id: 4, name: "便携充电宝", desc: "20000mAh · 22.5W 快充", price: 129, old: 199, cat: "数码", icon: "🔋", hot: 76, rate: 4.5, stock: 50, tag: "", g: ["🔋", "⚡", "🔌"] },
  { id: 5, name: "北欧香薰蜡烛", desc: "舒缓助眠 · 40h 燃烧", price: 59, old: 89, cat: "家居", icon: "🕯️", hot: 64, rate: 4.4, stock: 40, tag: "", g: ["🕯️", "🌿", "🛏️"] },
  { id: 6, name: "记忆棉抱枕", desc: "护颈支撑 · 可拆洗外套", price: 79, old: 119, cat: "家居", icon: "🛋️", hot: 58, rate: 4.3, stock: 25, tag: "", g: ["🛋️", "😴", "🧼"] },
  { id: 7, name: "陶瓷马克杯", desc: "手绘釉面 · 350ml 容量", price: 39, old: 59, cat: "家居", icon: "☕", hot: 70, rate: 4.6, stock: 60, tag: "热销", g: ["☕", "🍵", "🥛"] },
  { id: 8, name: "保湿面霜", desc: "玻尿酸 · 24h 锁水保湿", price: 159, old: 229, cat: "美妆", icon: "🧴", hot: 88, rate: 4.7, stock: 30, tag: "折扣", g: ["🧴", "💧", "✨"] },
  { id: 9, name: "哑光口红", desc: "丝绒质地 · 持久不脱色", price: 99, old: 139, cat: "美妆", icon: "💄", hot: 92, rate: 4.8, stock: 22, tag: "热销", g: ["💄", "💋", "🌹"] },
  { id: 10, name: "手工黑咖啡", desc: "中度烘焙 · 200g 现磨", price: 69, old: 99, cat: "食品", icon: "🧋", hot: 81, rate: 4.5, stock: 45, tag: "", g: ["🧋", "☕", "🫘"] },
  { id: 11, name: "进口巧克力", desc: "纯可可 · 精致礼盒装", price: 89, old: 129, cat: "食品", icon: "🍫", hot: 77, rate: 4.6, stock: 35, tag: "新品", g: ["🍫", "🎁", "🍬"] },
  { id: 12, name: "瑜伽垫", desc: "防滑加厚 · 环保 TPE", price: 119, old: 169, cat: "运动", icon: "🧘", hot: 73, rate: 4.4, stock: 28, tag: "", g: ["🧘", "💪", "🏞️"] },
  { id: 13, name: "专业跳绳", desc: "电子计数 · 静音轴承", price: 49, old: 79, cat: "运动", icon: "🤸", hot: 66, rate: 4.2, stock: 55, tag: "", g: ["🤸", "⏱️", "🔥"] },
  { id: 14, name: "保温运动水壶", desc: "316 不锈钢 · 12h 保温", price: 89, old: 129, cat: "运动", icon: "🍶", hot: 80, rate: 4.7, stock: 38, tag: "折扣", g: ["🍶", "🌡️", "🏃"] },
  { id: 15, name: "蓝牙音箱", desc: "360° 环绕 · IPX7 防水", price: 199, old: 299, cat: "数码", icon: "🔊", hot: 83, rate: 4.6, stock: 20, tag: "热销", g: ["🔊", "🎵", "💦"] },
  { id: 16, name: "真丝眼罩", desc: "遮光助眠 · 亲肤透气", price: 45, old: 69, cat: "家居", icon: "😴", hot: 55, rate: 4.3, stock: 48, tag: "", g: ["😴", "🌙", "🛌"] },
  { id: 17, name: "精华护肤套装", desc: "水乳精华三步曲 · 礼盒", price: 299, old: 429, cat: "美妆", icon: "🧖", hot: 79, rate: 4.8, stock: 16, tag: "新品", g: ["🧖", "✨", "🎀"] },
  { id: 18, name: "坚果能量包", desc: "每日坚果 · 30 袋独立装", price: 99, old: 149, cat: "食品", icon: "🥜", hot: 74, rate: 4.5, stock: 42, tag: "折扣", g: ["🥜", "🥥", "🍪"] },
]

// 券池兜底数据（后端不可用时用这份；正常以数据库 coupon 表为准）：
//   source = "mine"    → 只能由扫雷游戏达成条件发放，页面上的直接领取会被前端与后端同时拒绝
//   source = "newbie"  → 新人专享大额券：只有「刚注册、还没领过新人礼」的账号能领，
//                        新用户登录后会弹窗提示，取消掉也能在领券中心领
export const COUPON_POOL = [
  { code: "NEWBIE50", title: "新人专享大额券", desc: "新用户专享 · 无门槛立减 50 元", type: "fix", val: 50, amount: "¥50", cond: "无门槛", min: 0, source: "newbie" },
  { code: "MINE2", title: "扫雷新手券", desc: "连点 2 次不踩雷 · 无门槛立减", type: "fix", val: 3, amount: "¥3", cond: "无门槛", min: 0, source: "mine" },
  { code: "MINE5", title: "扫雷进阶券", desc: "连点 5 次不踩雷 · 无门槛立减", type: "fix", val: 8, amount: "¥8", cond: "无门槛", min: 0, source: "mine" },
  { code: "MINEWIN", title: "扫雷通关券", desc: "通关奖励 · 无门槛立减", type: "fix", val: 20, amount: "¥20", cond: "无门槛", min: 0, source: "mine" },
]

// 扫雷与优惠券的联动档位：need = 需要连续安全点击的次数（0 表示「通关」这一档）。
// 次数只算用户亲手点的格子，空白格自动扩散翻开的不计入。
// 游戏、领券中心的奖励列表都读这份配置，改档位只改这里。
export const MINE_TIERS = [
  { code: "MINE2", need: 2, label: "连点 2 次", hint: "第 2 次点击仍然没踩雷" },
  { code: "MINE5", need: 5, label: "连点 5 次", hint: "第 5 次点击仍然没踩雷" },
  { code: "MINEWIN", need: 0, label: "通关", hint: "把全部安全格翻开" },
]

export const REVIEW_POOL = [
  { u: "小鹿同学", t: "东西很不错，物流也快，会回购！" },
  { u: "阿宅", t: "性价比高，做工比想象中好。" },
  { u: "Lily", t: "颜值在线，送人很有面子~" },
  { u: "老王", t: "用了一周才来评价，确实好用。" },
  { u: "momo", t: "客服态度好，有问题秒回。" },
]

export const SHIP_FREE = 99
