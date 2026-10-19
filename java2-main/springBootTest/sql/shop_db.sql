-- =============================================================
-- 云购商城 - 用户数据库初始化脚本
-- 数据库: shop   用户表: user
-- 使用方法: mysql -uroot -p123456 < sql/shop_db.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS shop DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE shop;

-- 用户表
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `email`       VARCHAR(100) NOT NULL COMMENT '邮箱（登录账号）',
    `nick`        VARCHAR(50)  DEFAULT NULL COMMENT '昵称（展示名称）',
    `password`    VARCHAR(64)  NOT NULL COMMENT '密码（MD5）',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户表';

-- 测试数据：账号 demo@qq.com / 密码 123456（MD5: e10adc3949ba59abbe56e057f20f883e）
INSERT INTO `user` (`email`, `nick`, `password`) VALUES
('demo@qq.com', '演示用户', 'e10adc3949ba59abbe56e057f20f883e');

-- 验证
SELECT * FROM `user`;
