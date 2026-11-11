package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 优惠券池实体，对应数据库 shop 库的 coupon 表。
 *
 * 原来券池写死在前端 data.js 的 COUPON_POOL 里，现在改为存库：
 * 领券中心展示、结算抵扣、后台优惠券管理都读这张表。
 *
 * 另有一张 user_coupon 表记录「谁领了哪张券」（user_email + coupon_code）。
 */
@TableName("coupon")
public class Coupon {

    /** 主键自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 券码（唯一）：领券、用券、发放都按它匹配 */
    private String code;

    /** 券名称，如「满 299 减 50」 */
    private String title;

    /** 券说明（列名避开 SQL 关键字 desc） */
    private String descp;

    /** 类型：pct = 折扣，fix = 立减 */
    private String type;

    /** 面值：pct 为减免比例（0.2 = 减 20%，即 8 折），fix 为立减金额（元） */
    private Double val;

    /** 使用门槛：订单商品小计 >= 该值才可用，0 表示无门槛 */
    private Integer minAmount;

    /** 创建时间 */
    private LocalDateTime createTime;

    public Coupon() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescp() { return descp; }
    public void setDescp(String descp) { this.descp = descp; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getVal() { return val; }
    public void setVal(Double val) { this.val = val; }
    public Integer getMinAmount() { return minAmount; }
    public void setMinAmount(Integer minAmount) { this.minAmount = minAmount; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
