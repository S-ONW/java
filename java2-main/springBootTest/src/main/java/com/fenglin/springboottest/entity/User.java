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

    /** 密码（MD5 存储） */
    private String password;

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
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
}
