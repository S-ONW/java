package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 后台管理登录态服务。
 *
 * 后台账号不再写在 application-*.properties 里，而是直接取自 user 表：
 *   permission = 0 → 管理员权限，允许登录后台；
 *   permission = 1 → 默认权限，登录后台直接被拒绝。
 * 密码为明文存储，登录时直接比对，不做任何加密。
 *
 * 登录成功后下发一个内存 token，后台写操作（新增/修改/删除商品）需携带该 token；
 * 每次校验 token 时都会重新读库确认该账号仍是管理员，权限被改回 1 立刻失效。
 */
@Service
public class AdminService {

    public static final int PERMISSION_ADMIN = 0;    // 管理员权限
    public static final int PERMISSION_DEFAULT = 1; // 默认权限

    private final UserMapper userMapper;

    /** token -> 会话信息（用户 id + 过期时间戳，内存态，服务重启后失效） */
    private final Map<String, TokenInfo> tokens = new ConcurrentHashMap<>();

    private static final long TTL_MILLIS = 4 * 60 * 60 * 1000L; // 4 小时

    public AdminService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /** 账号可以是邮箱，也可以是昵称（商城前台用昵称登录） */
    public User findByAccount(String account) {
        if (account == null || account.isBlank()) return null;
        String a = account.trim();
        User u = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, a).last("LIMIT 1"));
        if (u == null) {
            u = userMapper.selectOne(
                    new LambdaQueryWrapper<User>().eq(User::getNick, a).last("LIMIT 1"));
        }
        return u;
    }

    /** 是否管理员权限（0） */
    public boolean isAdmin(User u) {
        return u != null && u.getPermission() != null && u.getPermission() == PERMISSION_ADMIN;
    }

    /**
     * 后台登录：账号密码必须命中 user 表中的管理员记录，否则拒绝。
     * 权限为 1（默认权限）的账号即使密码正确也无法登录后台管理系统。
     */
    public AdminSession login(String account, String pwd) {
        User u = findByAccount(account);
        if (u == null) {
            throw new BusinessException("账号不存在，请先用管理员账号登录商城");
        }
        if (!Objects.equals(u.getPassword(), pwd)) {
            throw new BusinessException("账号或密码不正确");
        }
        if (!isAdmin(u)) {
            throw new BusinessException("该账号为默认权限（1），无权登录后台管理系统", 403);
        }
        String token = UUID.randomUUID().toString().replace("-", "");
        tokens.put(token, new TokenInfo(u.getId(), System.currentTimeMillis() + TTL_MILLIS));
        return new AdminSession(token, u);
    }

    /**
     * token 是否有效：校验过期时间，并重新读库确认权限仍为管理员。
     * 这样把某个管理员改回默认权限后，其已有 token 会立即失效。
     */
    public boolean check(String token) {
        if (token == null || token.isBlank()) return false;
        TokenInfo info = tokens.get(token);
        if (info == null) return false;
        if (info.expire < System.currentTimeMillis()) {
            tokens.remove(token);
            return false;
        }
        User u = info.userId == null ? null : userMapper.selectById(info.userId);
        if (!isAdmin(u)) {
            tokens.remove(token);
            return false;
        }
        return true;
    }

    public void logout(String token) {
        if (token != null) tokens.remove(token);
    }

    /** 登录成功后返回给控制层的数据 */
    public static class AdminSession {
        private final String token;
        private final User user;

        AdminSession(String token, User user) {
            this.token = token;
            this.user = user;
        }

        public String getToken() { return token; }
        public User getUser() { return user; }
    }

    private static class TokenInfo {
        final Long userId;
        final long expire;

        TokenInfo(Long userId, long expire) {
            this.userId = userId;
            this.expire = expire;
        }
    }

    public static class BusinessException extends RuntimeException {
        private final int status;

        public BusinessException(String msg) { this(msg, 401); }
        public BusinessException(String msg, int status) { super(msg); this.status = status; }
        public int getStatus() { return status; }
    }
}
