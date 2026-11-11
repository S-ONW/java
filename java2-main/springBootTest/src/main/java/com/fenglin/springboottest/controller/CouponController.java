package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.service.AdminService;
import com.fenglin.springboottest.service.CouponService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 优惠券接口（供 Vue 前端调用）
 *
 * —— 券池（公开）——
 * GET  /api/coupon/pool           优惠券池列表（领券中心 / 结算 / 后台都读它）
 * GET  /api/coupon/list           查询已领取  ?email=xxx
 * POST /api/coupon/claim          领取优惠券  { email, code }
 *
 * —— 后台管理（需 Header: X-Admin-Token）——
 * POST   /api/coupon/admin/save     新增或修改优惠券  { id?, code, title, desc, type, val, min }
 * DELETE /api/coupon/admin/delete   从券池删除优惠券  ?code=XXX
 * POST   /api/coupon/admin/grant    管理员发放券给用户  { email, code }
 * DELETE /api/coupon/admin/remove   管理员删除用户的券  { email, code }
 *
 * 前端登录后以 email（如 nick@shop.local）标识用户。
 */
@RestController
@RequestMapping("/api/coupon")
public class CouponController {

    private final CouponService couponService;
    private final AdminService adminService;

    public CouponController(CouponService couponService, AdminService adminService) {
        this.couponService = couponService;
        this.adminService = adminService;
    }

    /** 优惠券池列表（公开接口：领券中心、结算抵扣、后台管理都读它） */
    @GetMapping("/pool")
    public Result<List<Map<String, Object>>> pool() {
        try {
            return Result.ok("ok", couponService.listPoolVO());
        } catch (Exception e) {
            // 常见原因：coupon 表尚未创建
            return Result.error(500, "读取优惠券失败，请确认已创建 coupon 表（见 sql/shop.sql）");
        }
    }

    /** 新增或修改优惠券（后台管理，携带 id 视为修改） */
    @PostMapping("/admin/save")
    public Result<Map<String, Object>> adminSave(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @RequestBody Map<String, Object> body) {
        if (!adminService.check(token)) {
            return Result.error(401, "登录已失效，请重新登录后台");
        }
        try {
            return Result.ok("保存成功", couponService.toVO(couponService.save(body)));
        } catch (CouponService.BusinessException e) {
            return Result.error(409, e.getMessage());
        } catch (Exception e) {
            return Result.error(500, "保存优惠券失败，请确认 coupon 表已创建（见 sql/shop.sql）");
        }
    }

    /** 从券池删除优惠券（后台管理）：已领取用户的券记录不受影响 */
    @DeleteMapping("/admin/delete")
    public Result<Void> adminDelete(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @RequestParam(value = "code") String code) {
        if (!adminService.check(token)) {
            return Result.error(401, "登录已失效，请重新登录后台");
        }
        try {
            boolean removed = couponService.delete(code);
            return removed ? Result.ok("已删除") : Result.error(404, "未找到该优惠券");
        } catch (Exception e) {
            return Result.error(500, "删除失败，请确认 coupon 表已创建（见 sql/shop.sql）");
        }
    }

    /** 每张券的领取人数统计（后台优惠券概览用）：{ "SAVE20": 3, ... } */
    @GetMapping("/admin/stats")
    public Result<Map<String, Long>> adminStats(
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        if (!adminService.check(token)) {
            return Result.error(401, "登录已失效，请重新登录后台");
        }
        try {
            return Result.ok("ok", couponService.claimStats());
        } catch (Exception e) {
            return Result.error(500, "统计失败，请确认 coupon / user_coupon 表已创建（见 sql/shop.sql）");
        }
    }

    /** 领取优惠券 */
    @PostMapping("/claim")
    public Result<Map<String, Object>> claim(@RequestBody Map<String, String> body) {
        String email = body == null ? null : body.get("email");
        String code = body == null ? null : body.get("code");
        try {
            couponService.claim(email, code);
            return Result.ok("领取成功");
        } catch (CouponService.BusinessException e) {
            return Result.error(409, e.getMessage());
        } catch (Exception e) {
            // 常见原因：user_coupon 表尚未创建
            return Result.error(500, "领取失败，请确认已创建 user_coupon 表（见 sql/shop.sql）");
        }
    }

    /** 查询某用户已领取的优惠券 code 列表 */
    @GetMapping("/list")
    public Result<List<String>> list(@RequestParam(value = "email", required = false) String email) {
        try {
            return Result.ok("ok", couponService.listCodes(email));
        } catch (Exception e) {
            return Result.error(500, "查询失败，请确认已创建 user_coupon 表（见 sql/shop.sql）");
        }
    }

    /** 管理员发放优惠券给某个用户（后台管理） */
    @PostMapping("/admin/grant")
    public Result<Void> adminGrant(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                   @RequestBody Map<String, String> body) {
        if (!adminService.check(token)) {
            return Result.error(401, "登录已失效，请重新登录后台");
        }
        String email = body == null ? null : body.get("email");
        String code = body == null ? null : body.get("code");
        try {
            couponService.grant(email, code);
            return Result.ok("发放成功");
        } catch (CouponService.BusinessException e) {
            return Result.error(409, e.getMessage());
        } catch (Exception e) {
            return Result.error(500, "发放失败，请确认已创建 user_coupon 表（见 sql/shop.sql）");
        }
    }

    /** 管理员删除某个用户的某张优惠券（后台管理） */
    @DeleteMapping("/admin/remove")
    public Result<Void> adminRemove(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                    @RequestParam(value = "email") String email,
                                    @RequestParam(value = "code") String code) {
        if (!adminService.check(token)) {
            return Result.error(401, "登录已失效，请重新登录后台");
        }
        try {
            boolean removed = couponService.remove(email, code);
            return removed ? Result.ok("已删除") : Result.error(404, "未找到该用户的该张优惠券");
        } catch (Exception e) {
            return Result.error(500, "删除失败，请稍后再试");
        }
    }
}
