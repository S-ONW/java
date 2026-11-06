-- =============================================================
-- 已有数据库升级脚本：给用户表新增 permission 权限字段 + 密码改明文
-- 使用方法: mysql -uroot -p123456 shop < sql/upgrade_user_permission.sql
--
-- 说明：
--   1) 全新建库请直接用 sql/shop_db.sql，不必跑本脚本。
--   2) 应用启动时 db/schema.sql 也会自动做同样的幂等升级，正常情况无需手动执行。
--   3) permission = 1 默认权限（注册用户，不能进后台）；0 管理员权限（可进后台）。
--   4) 旧密码是 MD5，无法反解；本脚本把已知的 MD5('123456') 还原为明文 '123456'。
--      若有其他自定义密码的旧账号，请自行 UPDATE 成明文后用户才能登录。
-- =============================================================

USE shop;

ALTER TABLE `user`
    ADD COLUMN `permission` TINYINT NOT NULL DEFAULT 1
    COMMENT '权限：1=默认权限，0=管理员权限' AFTER `password`;

-- 同步修正密码列的注释（旧库还写着「MD5」）
ALTER TABLE `user` MODIFY COLUMN `password` VARCHAR(64) NOT NULL
    COMMENT '密码（明文存储，不加密）';

-- 已有用户一律是默认权限（1），不因升级意外获得管理员权限
UPDATE `user` SET `permission` = 1;

-- 旧版 MD5 密码 → 明文（仅处理已确认的演示密码 123456）
UPDATE `user` SET `password` = '123456'
 WHERE `password` = 'e10adc3949ba59abbe56e057f20f883e';

-- 新增管理员账号（权限 0），改密码直接 UPDATE 即可
INSERT INTO `user` (`email`, `nick`, `password`, `permission`)
SELECT 'admin@shop.local', 'admin', 'admin123', 0
 WHERE NOT EXISTS (SELECT 1 FROM `user` WHERE `email` = 'admin@shop.local');

SELECT `id`, `email`, `nick`, `password`, `permission` FROM `user` ORDER BY `id`;
