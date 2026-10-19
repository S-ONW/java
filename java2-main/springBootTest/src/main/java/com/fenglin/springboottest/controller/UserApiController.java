package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.service.UserService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 用户接口（供 Vue 前端调用的 REST API）
 *
 * POST /api/user/register  注册  { email, nick, pwd }
 * POST /api/user/login     登录  { email, pwd }
 */
@RestController
@RequestMapping("/api/user")
public class UserApiController {

    private final UserService userService;

    public UserApiController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public Result<User> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String nick = body.get("nick");
        String pwd = body.get("pwd");

        // 参数校验
        if (email == null || email.isBlank() || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return Result.error(400, "邮箱格式不正确");
        }
        if (nick == null || nick.trim().length() < 2) {
            return Result.error(400, "昵称至少 2 个字符");
        }
        if (pwd == null || pwd.length() < 6) {
            return Result.error(400, "密码至少 6 位");
        }
        try {
            User u = userService.register(email.trim(), nick.trim(), pwd);
            return Result.ok("注册成功", u);
        } catch (UserService.BusinessException e) {
            return Result.error(409, e.getMessage());
        }
    }

    @PostMapping("/login")
    public Result<User> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String pwd = body.get("pwd");
        if (email == null || email.isBlank() || pwd == null || pwd.isEmpty()) {
            return Result.error(400, "请输入邮箱和密码");
        }
        try {
            User u = userService.login(email.trim(), pwd);
            return Result.ok("登录成功", u);
        } catch (UserService.BusinessException e) {
            return Result.error(401, e.getMessage());
        }
    }
}
