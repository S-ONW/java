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
 * POST /api/admin/check   校验后台登录态（Header: X-Admin-Token）
 *
 * 说明：后台不开放注册。账号直接使用 user 表中的记录，只有 permission = 0（管理员权限）
 * 且明文密码正确的账号才能登录；permission = 1 的注册用户返回 403 拒绝。
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
            AdminService.AdminSession session = adminService.login(u.trim(), p);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("token", session.getToken());
            data.put("username", u.trim());
            data.put("nick", session.getUser().getNick() == null
                    ? u.trim() : session.getUser().getNick());
            data.put("permission", AdminService.PERMISSION_ADMIN);
            return Result.ok("登录成功", data);
        } catch (AdminService.BusinessException e) {
            return Result.error(e.getStatus(), e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Result<String> logout(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        adminService.logout(token);
        return Result.ok("已退出登录");
    }

    /**
     * 校验后台登录态是否仍然有效：token 为内存态，服务重启或过期（4h）后失效；
     * 同时会复核该账号在 user 表中仍是 permission = 0 的管理员。
     */
    @PostMapping("/check")
    public Result<Void> check(@RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (adminService.check(token)) return Result.ok("ok");
        return Result.error(401, "登录已失效或账号无管理员权限，请重新登录后台");
    }
}
