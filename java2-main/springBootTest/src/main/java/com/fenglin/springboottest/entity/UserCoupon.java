package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 用户已领取优惠券实体，对应数据库 shop 库的 user_coupon 表。
 * 记录「哪个用户（user_email）领取了哪张优惠券（coupon_code）」。
 */
@TableName("user_coupon")
public class UserCoupon {

    /** 主键自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户邮箱（关联 user.email，登录账号） */
    private String userEmail;

    /** 优惠券 code（对应前端 COUPON_POOL 的定义） */
    private String couponCode;

    /** 领取时间 */
    private LocalDateTime createTime;

    public UserCoupon() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
