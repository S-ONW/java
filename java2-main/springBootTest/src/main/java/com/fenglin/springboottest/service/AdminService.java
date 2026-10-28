package com.fenglin.springboottest.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 后台管理员登录态服务。
 *
 * 后台管理系统只提供登录、不提供注册：管理员账号写在 application-*.properties 中
 * （admin.username / admin.password，默认 admin / admin123），改密码改配置即可。
 *
 * 登录成功后下发一个内存 token，写操作（新增/修改/删除商品）需携带该 token。
 */
@Service
public class AdminService {

    @Value("${admin.username:admin}")
    private String username;

    @Value("${admin.password:admin123}")
    private String password;

    /** token -> 过期时间戳（内存态，服务重启后失效） */
    private final Map<String, Long> tokens = new ConcurrentHashMap<>();

    private static final long TTL_MILLIS = 4 * 60 * 60 * 1000L; // 4 小时

    /** 登录成功返回 token，失败抛 BusinessException */
    public String login(String u, String p) {
        if (!username.equals(u) || !password.equals(p)) {
            throw new BusinessException("账号或密码不正确");
        }
        String token = UUID.randomUUID().toString().replace("-", "");
        tokens.put(token, System.currentTimeMillis() + TTL_MILLIS);
        return token;
    }

    /** token 是否有效 */
    public boolean check(String token) {
        if (token == null || token.isBlank()) return false;
        Long expire = tokens.get(token);
        if (expire == null) return false;
        if (expire < System.currentTimeMillis()) {
            tokens.remove(token);
            return false;
        }
        return true;
    }

    public void logout(String token) {
        if (token != null) tokens.remove(token);
    }

    public static class BusinessException extends RuntimeException {
        public BusinessException(String msg) { super(msg); }
    }
}
