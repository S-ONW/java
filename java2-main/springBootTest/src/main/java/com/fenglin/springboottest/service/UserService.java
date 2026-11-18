package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 用户服务：注册 / 登录
 *
 * 按需求：
 *  - 密码明文存储、明文比对，不做任何加密
 *  - 注册用户一律是默认权限 permission = 1
 *  - 只有 permission = 0（管理员权限）才能进入后台管理系统（见 AdminService）
 */
@Service
public class UserService {

    /** 默认权限：普通注册用户 */
    public static final int PERMISSION_DEFAULT = 1;
    /** 管理员权限 */
    public static final int PERMISSION_ADMIN = 0;
    /** 新人标识：1 = 新注册、还没领新人券；0 = 老用户 / 已领过 */
    public static final int NEWBIE_YES = 1;
    public static final int NEWBIE_NO = 0;

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /**
     * 注册：邮箱唯一性校验后入库，权限固定为默认权限 1
     * @return 注册成功的用户（不含密码）
     */
    public User register(String email, String nick, String pwd) {
        // 邮箱是否已存在
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getEmail, email));
        if (count != null && count > 0) {
            throw new BusinessException("该邮箱已被注册");
        }
        User u = new User();
        u.setEmail(email);
        u.setNick(nick);
        u.setPassword(pwd);                            // 明文入库，不加密
        u.setPermission(PERMISSION_DEFAULT);          // 注册用户 = 默认权限 1
        // 新注册 = 新人：登录后前端会弹「新人专享大额券」，领到券后自动置 0
        u.setNewbie(NEWBIE_YES);
        u.setCreateTime(LocalDateTime.now());
        userMapper.insert(u);
        u.setPassword(null); // 不返回密码
        return u;
    }

    /**
     * 登录：校验邮箱 + 明文密码，返回带 permission 的用户信息（前端据此决定是否显示后台入口）
     */
    public User login(String email, String pwd) {
        User u = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, email));
        if (u == null) {
            throw new BusinessException("账号不存在，请先注册");
        }
        if (!Objects.equals(u.getPassword(), pwd)) {   // 明文直接比对
            throw new BusinessException("密码错误");
        }
        // 老数据没有 permission / newbie 字段值时按默认值处理
        if (u.getPermission() == null) u.setPermission(PERMISSION_DEFAULT);
        if (u.getNewbie() == null) u.setNewbie(NEWBIE_NO);
        u.setPassword(null);
        return u;
    }

    /**
     * 领到新人券后把新人标识置 0：之后再登录就不会再弹新人礼弹窗。
     * @return 是否真的更新了一行（用户不存在 / 已经是 0 时返回 false）
     */
    public boolean markNewbieDone(String email) {
        if (email == null || email.isBlank()) return false;
        User u = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, email.trim()));
        if (u == null || u.getNewbie() == null || u.getNewbie() == NEWBIE_NO) return false;
        u.setNewbie(NEWBIE_NO);
        userMapper.updateById(u);
        return true;
    }

    /** 业务异常 */
    public static class BusinessException extends RuntimeException {
        public BusinessException(String msg) { super(msg); }
    }
}
