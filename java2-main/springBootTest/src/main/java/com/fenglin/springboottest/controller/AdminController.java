package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.service.AdminService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 后台管理接口
 *
 * POST /api/admin/login   管理员登录 { username, pwd }
 * POST /api/admin/logout  退出登录（Header: X-Admin-Token）
 *
 * 说明：后台只有登录功能，不开放注册；管理员账号配置在 application-*.properties。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String u = body.get("username");
        String p = body.get("pwd");
        if (u == null || u.isBlank() || p == null || p.isEmpty()) {
            return Result.error(400, "请输入账号和密码");
        }
        try {
            String token = adminService.login(u.trim(), p);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("token", token);
            data.put("username", u.trim());
            data.put("nick", "管理员");
            return Result.ok("登录成功", data);
        } catch (AdminService.BusinessException e) {
            return Result.error(401, e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Result<String> logout(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        adminService.logout(token);
        return Result.ok("已退出登录");
    }
}
