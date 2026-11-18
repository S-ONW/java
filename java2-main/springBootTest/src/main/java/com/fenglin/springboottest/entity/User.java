package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 用户实体，对应数据库 shop 库的 user 表
 */
@TableName("user")
public class User {

    /** 主键自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 邮箱（登录账号，唯一） */
    private String email;

    /** 昵称（展示名称） */
    private String nick;

    /** 密码（明文存储，按需求不做加密） */
    private String password;

    /**
     * 权限：1 = 默认权限（注册用户，看不到后台入口、不能登录后台管理系统）
     *       0 = 管理员权限（首页可见「后台管理」按钮，且可登录后台）
     */
    private Integer permission;

    /**
     * 新人标识：1 = 新注册、还没领新人专享券（登录时前端据此弹出新人礼弹窗）
     *           0 = 老用户 / 已经领过新人券
     * 注册时落 1，领到新人券后由 CouponService 置 0，所以弹窗只对「刚注册的人」出现。
     */
    private Integer newbie;

    /** 注册时间 */
    private LocalDateTime createTime;

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNick() { return nick; }
    public void setNick(String nick) { this.nick = nick; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Integer getPermission() { return permission; }
    public void setPermission(Integer permission) { this.permission = permission; }
    public Integer getNewbie() { return newbie; }
    public void setNewbie(Integer newbie) { this.newbie = newbie; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
