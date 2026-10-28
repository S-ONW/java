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
