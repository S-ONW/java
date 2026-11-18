-- 商品种子数据：与前端 data.js 中的 18 个商品保持一致
-- 使用 INSERT IGNORE，重复启动不会插入重复数据
INSERT IGNORE INTO product (id, name, descp, price, old_price, cat, icon, hot, rate, stock, tag, gallery) VALUES
(1,  '无线降噪耳机',   '主动降噪 · 30h 续航 · 通透模式',   399, 599, '数码', '🎧', 98, 4.8, 32, '热销', '🎧,🔇,🔋'),
(2,  '机械键盘',       'RGB 背光 · 红轴手感 · 全键无冲',   259, 349, '数码', '⌨️', 85, 4.6, 18, '折扣', '⌨️,💡,🖱️'),
(3,  '智能手表',       '心率血氧 · 运动追踪 · 防水',       699, 899, '数码', '⌚', 90, 4.7,  9, '新品', '⌚,❤️,🏃'),
(4,  '便携充电宝',     '20000mAh · 22.5W 快充',            129, 199, '数码', '🔋', 76, 4.5, 50, '',     '🔋,⚡,🔌'),
(5,  '北欧香薰蜡烛',   '舒缓助眠 · 40h 燃烧',               59,  89, '家居', '🕯️', 64, 4.4, 40, '',     '🕯️,🌿,🛏️'),
(6,  '记忆棉抱枕',     '护颈支撑 · 可拆洗外套',             79, 119, '家居', '🛋️', 58, 4.3, 25, '',     '🛋️,😴,🧼'),
(7,  '陶瓷马克杯',     '手绘釉面 · 350ml 容量',             39,  59, '家居', '☕', 70, 4.6, 60, '热销', '☕,🍵,🥛'),
(8,  '保湿面霜',       '玻尿酸 · 24h 锁水保湿',            159, 229, '美妆', '🧴', 88, 4.7, 30, '折扣', '🧴,💧,✨'),
(9,  '哑光口红',       '丝绒质地 · 持久不脱色',             99, 139, '美妆', '💄', 92, 4.8, 22, '热销', '💄,💋,🌹'),
(10, '手工黑咖啡',     '中度烘焙 · 200g 现磨',              69,  99, '食品', '🧋', 81, 4.5, 45, '',     '🧋,☕,🫘'),
(11, '进口巧克力',     '纯可可 · 精致礼盒装',               89, 129, '食品', '🍫', 77, 4.6, 35, '新品', '🍫,🎁,🍬'),
(12, '瑜伽垫',         '防滑加厚 · 环保 TPE',              119, 169, '运动', '🧘', 73, 4.4, 28, '',     '🧘,💪,🏞️'),
(13, '专业跳绳',       '电子计数 · 静音轴承',               49,  79, '运动', '🤸', 66, 4.2, 55, '',     '🤸,⏱️,🔥'),
(14, '保温运动水壶',   '316 不锈钢 · 12h 保温',             89, 129, '运动', '🍶', 80, 4.7, 38, '折扣', '🍶,🌡️,🏃'),
(15, '蓝牙音箱',       '360° 环绕 · IPX7 防水',            199, 299, '数码', '🔊', 83, 4.6, 20, '热销', '🔊,🎵,💦'),
(16, '真丝眼罩',       '遮光助眠 · 亲肤透气',               45,  69, '家居', '😴', 55, 4.3, 48, '',     '😴,🌙,🛌'),
(17, '精华护肤套装',   '水乳精华三步曲 · 礼盒',            299, 429, '美妆', '🧖', 79, 4.8, 16, '新品', '🧖,✨,🎀'),
(18, '坚果能量包',     '每日坚果 · 30 袋独立装',            99, 149, '食品', '🥜', 74, 4.5, 42, '折扣', '🥜,🥥,🍪');

-- 优惠券池种子数据（2026-11-18 起）：
--   1）扫雷闯关奖励（source = 'mine'，只能由游戏发奖，页面直接领取会被后端拒绝）：
--        连点 2 次不踩雷 → MINE2   ¥3 （小额）
--        连点 5 次不踩雷 → MINE5   ¥8 （稍大额）
--        通关（翻开全部安全格）→ MINEWIN ¥20（大额）
--   2）新人专享大额券（source = 'newbie'）：
--        NEWBIE50 ¥50 无门槛，只有 user.newbie = 1（刚注册、还没领过新人礼）的账号能领；
--        登录后弹窗领取，取消掉也能在领券中心领；领到后 user.newbie 自动置 0。
-- 次数只统计用户亲手点击的格子，空白格自动扩散翻开的不计入。
-- 使用 INSERT IGNORE，重复启动不会插入重复券码；后台增删改直接落这张表。
INSERT IGNORE INTO coupon (code, title, descp, type, val, min_amount, source) VALUES
('MINE2',    '扫雷新手券',     '扫雷连点 2 次 · 无门槛立减',   'fix', 3,  0, 'mine'),
('MINE5',    '扫雷进阶券',     '扫雷连点 5 次 · 无门槛立减',   'fix', 8,  0, 'mine'),
('MINEWIN',  '扫雷通关券',     '扫雷通关奖励 · 无门槛立减',    'fix', 20, 0, 'mine'),
('NEWBIE50', '新人专享大额券', '新用户专享 · 无门槛立减 50 元', 'fix', 50, 0, 'newbie');

-- 老库里这几张券可能已经存在（source 默认 claim），INSERT IGNORE 不会覆盖，这里补一次。
UPDATE coupon SET source = 'mine', descp = '扫雷连点 2 次 · 无门槛立减' WHERE code = 'MINE2';
UPDATE coupon SET source = 'mine', descp = '扫雷连点 5 次 · 无门槛立减' WHERE code = 'MINE5';
UPDATE coupon SET source = 'mine' WHERE code = 'MINEWIN';
UPDATE coupon SET source = 'newbie', title = '新人专享大额券',
       descp = '新用户专享 · 无门槛立减 50 元', val = 50, min_amount = 0
 WHERE code = 'NEWBIE50';

-- 下线原先把「点一下就能领」的 6 张券：SAVE20 / WELCOME10 / VIP30 / SAVE50 / FREE5 / PCT30。
-- 必须用 DELETE：老库里这些行早就存在，只是不再 INSERT 是删不掉的。
-- user_coupon 里的领取记录一并清掉，否则「我的优惠券」里会留下查不到券面的空记录。
-- user_coupon 表只在完整 dump（sql/shop.sql）里建，空库时可能不存在，
-- 所以沿用 schema.sql 的写法：先查 information_schema，再用动态 SQL 兜底。
SET @uc_tbl_exists = (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_coupon');
SET @del_uc_sql = IF(@uc_tbl_exists = 1,
    'DELETE FROM user_coupon WHERE coupon_code IN (''SAVE20'',''WELCOME10'',''VIP30'',''SAVE50'',''FREE5'',''PCT30'')',
    'SELECT 1');
PREPARE del_uc FROM @del_uc_sql;
EXECUTE del_uc;
DEALLOCATE PREPARE del_uc;

DELETE FROM coupon WHERE code IN ('SAVE20', 'WELCOME10', 'VIP30', 'SAVE50', 'FREE5', 'PCT30');
