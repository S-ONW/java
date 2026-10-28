/*
 Navicat Premium Dump SQL

 Source Server         : test
 Source Server Type    : MySQL
 Source Server Version : 80039 (8.0.39)
 Source Host           : localhost:3306
 Source Schema         : shop

 Target Server Type    : MySQL
 Target Server Version : 80039 (8.0.39)
 File Encoding         : 65001

 Date: 28/10/2026 09:51:37
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for product
-- ----------------------------
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '商品名称',
  `descp` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '商品描述',
  `price` int NOT NULL DEFAULT 0 COMMENT '现价',
  `old_price` int NULL DEFAULT 0 COMMENT '原价',
  `cat` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '其他' COMMENT '分类',
  `icon` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '商品图标 emoji',
  `hot` int NULL DEFAULT 50 COMMENT '热度',
  `rate` double NULL DEFAULT 4.5 COMMENT '评分',
  `stock` int NULL DEFAULT 0 COMMENT '库存',
  `tag` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '角标：热销/新品/折扣',
  `gallery` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '图集 emoji，英文逗号分隔',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 19 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商品表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of product
-- ----------------------------
INSERT INTO `product` VALUES (1, '无线降噪耳机', '主动降噪 · 30h 续航 · 通透模式', 399, 599, '数码', '🎧', 98, 4.8, 32, '热销', '🎧,🔇,🔋');
INSERT INTO `product` VALUES (2, '机械键盘', 'RGB 背光 · 红轴手感 · 全键无冲', 259, 349, '数码', '⌨️', 85, 4.6, 18, '折扣', '⌨️,💡,🖱️');
INSERT INTO `product` VALUES (3, '智能手表', '心率血氧 · 运动追踪 · 防水', 699, 899, '数码', '⌚', 90, 4.7, 9, '新品', '⌚,❤️,🏃');
INSERT INTO `product` VALUES (4, '便携充电宝', '20000mAh · 22.5W 快充', 129, 199, '数码', '🔋', 76, 4.5, 50, '', '🔋,⚡,🔌');
INSERT INTO `product` VALUES (5, '北欧香薰蜡烛', '舒缓助眠 · 40h 燃烧', 59, 89, '家居', '🕯️', 64, 4.4, 40, '', '🕯️,🌿,🛏️');
INSERT INTO `product` VALUES (6, '记忆棉抱枕', '护颈支撑 · 可拆洗外套', 79, 119, '家居', '🛋️', 58, 4.3, 25, '', '🛋️,😴,🧼');
INSERT INTO `product` VALUES (7, '陶瓷马克杯', '手绘釉面 · 350ml 容量', 39, 59, '家居', '☕', 70, 4.6, 60, '热销', '☕,🍵,🥛');
INSERT INTO `product` VALUES (8, '保湿面霜', '玻尿酸 · 24h 锁水保湿', 159, 229, '美妆', '🧴', 88, 4.7, 30, '折扣', '🧴,💧,✨');
INSERT INTO `product` VALUES (9, '哑光口红', '丝绒质地 · 持久不脱色', 99, 139, '美妆', '💄', 92, 4.8, 22, '热销', '💄,💋,🌹');
INSERT INTO `product` VALUES (10, '手工黑咖啡', '中度烘焙 · 200g 现磨', 69, 99, '食品', '🧋', 81, 4.5, 45, '', '🧋,☕,🫘');
INSERT INTO `product` VALUES (11, '进口巧克力', '纯可可 · 精致礼盒装', 89, 129, '食品', '🍫', 77, 4.6, 35, '新品', '🍫,🎁,🍬');
INSERT INTO `product` VALUES (12, '瑜伽垫', '防滑加厚 · 环保 TPE', 119, 169, '运动', '🧘', 73, 4.4, 28, '', '🧘,💪,🏞️');
INSERT INTO `product` VALUES (13, '专业跳绳', '电子计数 · 静音轴承', 49, 79, '运动', '🤸', 66, 4.2, 55, '', '🤸,⏱️,🔥');
INSERT INTO `product` VALUES (14, '保温运动水壶', '316 不锈钢 · 12h 保温', 89, 129, '运动', '🍶', 80, 4.7, 38, '折扣', '🍶,🌡️,🏃');
INSERT INTO `product` VALUES (15, '蓝牙音箱', '360° 环绕 · IPX7 防水', 199, 299, '数码', '🔊', 83, 4.6, 20, '热销', '🔊,🎵,💦');
INSERT INTO `product` VALUES (16, '真丝眼罩', '遮光助眠 · 亲肤透气', 45, 69, '家居', '😴', 55, 4.3, 48, '', '😴,🌙,🛌');
INSERT INTO `product` VALUES (17, '精华护肤套装', '水乳精华三步曲 · 礼盒', 299, 429, '美妆', '🧖', 79, 4.8, 16, '新品', '🧖,✨,🎀');
INSERT INTO `product` VALUES (18, '坚果能量包', '每日坚果 · 30 袋独立装', 99, 149, '食品', '🥜', 74, 4.5, 42, '折扣', '🥜,🥥,🍪');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '邮箱（登录账号）',
  `nick` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '昵称（展示名称）',
  `password` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码（MD5）',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'demo@qq.com', '演示用户', 'e10adc3949ba59abbe56e057f20f883e', '2026-10-26 11:35:33');
INSERT INTO `user` VALUES (3, 'rr@shop.local', 'rr', 'e10adc3949ba59abbe56e057f20f883e', '2026-10-26 11:46:34');
INSERT INTO `user` VALUES (4, 'dd@shop.local', 'dd', 'e10adc3949ba59abbe56e057f20f883e', '2026-10-26 11:47:15');
INSERT INTO `user` VALUES (5, 'cc@shop.local', 'cc', 'e10adc3949ba59abbe56e057f20f883e', '2026-10-28 09:03:40');

SET FOREIGN_KEY_CHECKS = 1;
