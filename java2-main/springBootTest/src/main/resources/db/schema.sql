-- 后台管理系统的商品表（首页展示的购物数据即来源于此表）
-- 应用启动时由 Spring Boot 的 SQL 初始化机制自动执行（幂等，重复启动不会报错）
CREATE TABLE IF NOT EXISTS product (
    id        BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    name      VARCHAR(64)  NOT NULL              COMMENT '商品名称',
    descp     VARCHAR(128) DEFAULT ''            COMMENT '商品描述',
    price     INT          NOT NULL DEFAULT 0    COMMENT '现价',
    old_price INT                   DEFAULT 0    COMMENT '原价',
    cat       VARCHAR(32)           DEFAULT '其他' COMMENT '分类',
    icon      VARCHAR(16)           DEFAULT ''   COMMENT '商品图标 emoji',
    hot       INT                   DEFAULT 50   COMMENT '热度',
    rate      DOUBLE                DEFAULT 4.5  COMMENT '评分',
    stock     INT                   DEFAULT 0    COMMENT '库存',
    tag       VARCHAR(16)           DEFAULT ''   COMMENT '角标：热销/新品/折扣',
    gallery   VARCHAR(64)           DEFAULT ''   COMMENT '图集 emoji，英文逗号分隔'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '商品表';

-- ---------------------------------------------------------------------------
-- 用户表在线升级：新增 permission 权限字段（幂等，随应用启动自动执行）
--   permission = 1 → 默认权限：注册用户，首页看不到「后台管理」按钮，也无法登录后台
--   permission = 0 → 管理员权限：首页可见按钮，且能登录后台管理系统
-- MySQL 8 不支持 ADD COLUMN IF NOT EXISTS，故用 information_schema + 动态 SQL 保证幂等。
-- 全新建库请用 sql/shop_db.sql；已有库也可手动执行 sql/upgrade_user_permission.sql。
-- ---------------------------------------------------------------------------
SET @user_tbl_exists = (SELECT COUNT(*) FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user');

SET @add_perm_sql = IF(@user_tbl_exists = 1 AND
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'permission') = 0,
    'ALTER TABLE `user` ADD COLUMN `permission` TINYINT NOT NULL DEFAULT 1 COMMENT ''权限：1=默认权限，0=管理员权限''',
    'SELECT 1');
PREPARE add_perm FROM @add_perm_sql;
EXECUTE add_perm;
DEALLOCATE PREPARE add_perm;

-- 顺带修正旧库密码列还写着「MD5」的注释（仅当仍是旧注释时才执行）
SET @fix_pwd_sql = IF(@user_tbl_exists = 1 AND
    (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'password'
        AND COLUMN_COMMENT = '密码（MD5）') = 1,
    'ALTER TABLE `user` MODIFY COLUMN `password` VARCHAR(64) NOT NULL COMMENT ''密码（明文存储，不加密）''',
    'SELECT 1');
PREPARE fix_pwd FROM @fix_pwd_sql;
EXECUTE fix_pwd;
DEALLOCATE PREPARE fix_pwd;

-- 历史数据兼容：把旧版 MD5('123456') 密码还原成明文，保证老账号仍能登录（幂等）
UPDATE `user` SET `password` = '123456'
 WHERE `password` = 'e10adc3949ba59abbe56e057f20f883e';

-- 内置管理员账号（已存在则不重复插入）：权限 0，可用昵称 admin 登录商城与后台
INSERT INTO `user` (`email`, `nick`, `password`, `permission`)
SELECT 'admin@shop.local', 'admin', 'admin123', 0
 WHERE @user_tbl_exists = 1
   AND NOT EXISTS (SELECT 1 FROM `user` WHERE `email` = 'admin@shop.local');
