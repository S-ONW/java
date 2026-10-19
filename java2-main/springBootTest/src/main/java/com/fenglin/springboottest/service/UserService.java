package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * 用户服务：注册 / 登录
 */
@Service
public class UserService {

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /** 密码 MD5 加密 */
    private String md5(String pwd) {
        return DigestUtils.md5DigestAsHex(pwd.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 注册：邮箱唯一性校验后入库
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
        u.setPassword(md5(pwd));
        u.setCreateTime(LocalDateTime.now());
        userMapper.insert(u);
        u.setPassword(null); // 不返回密码
        return u;
    }

    /**
     * 登录：校验邮箱 + 密码
     */
    public User login(String email, String pwd) {
        User u = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, email));
        if (u == null) {
            throw new BusinessException("账号不存在，请先注册");
        }
        if (!u.getPassword().equals(md5(pwd))) {
            throw new BusinessException("密码错误");
        }
        u.setPassword(null);
        return u;
    }

    /** 业务异常 */
    public static class BusinessException extends RuntimeException {
        public BusinessException(String msg) { super(msg); }
    }
}
