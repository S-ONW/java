-- =============================================================
-- 云购商城 - 用户数据库初始化脚本（全新安装用）
-- 数据库: shop   用户表: user
-- 使用方法: mysql -uroot -p123456 < sql/shop_db.sql
--
-- 约定（按需求）：
--   * 密码明文存储，不做 MD5 / BCrypt 等任何加密
--   * permission = 1 → 默认权限：注册用户，首页看不到「后台管理」按钮，也无法登录后台
--   * permission = 0 → 管理员权限：首页可见按钮，且能登录后台管理系统
-- 已存在的数据库请勿直接执行本脚本（会 DROP 表），请改用 sql/upgrade_user_permission.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS shop DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE shop;

-- 用户表
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `email`       VARCHAR(100) NOT NULL COMMENT '邮箱（登录账号）',
    `nick`        VARCHAR(50)  DEFAULT NULL COMMENT '昵称（展示名称）',
    `password`    VARCHAR(64)  NOT NULL COMMENT '密码（明文存储，不加密）',
    `permission`  TINYINT      NOT NULL DEFAULT 1 COMMENT '权限：1=默认权限，0=管理员权限',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户表';

-- 演示普通用户：昵称「演示用户」/ 密码 123456 / 默认权限 1
INSERT INTO `user` (`email`, `nick`, `password`, `permission`) VALUES
('demo@qq.com', '演示用户', '123456', 1);

-- 内置管理员：权限 0。
-- 商城前台用昵称 admin 登录；后台登录页可用 admin 或 admin@shop.local，密码 admin123。
-- 如需更换管理员，直接改这条记录或新增一条 permission = 0 的记录即可。
INSERT INTO `user` (`email`, `nick`, `password`, `permission`) VALUES
('admin@shop.local', 'admin', 'admin123', 0);

-- 验证
SELECT * FROM `user`;
