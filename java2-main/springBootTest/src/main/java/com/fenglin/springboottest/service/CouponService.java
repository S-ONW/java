package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fenglin.springboottest.entity.Coupon;
import com.fenglin.springboottest.entity.UserCoupon;
import com.fenglin.springboottest.mapper.CouponMapper;
import com.fenglin.springboottest.mapper.UserCouponMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 优惠券服务，管理两块数据：
 *
 * 1）coupon 表 —— 优惠券池（领券中心展示、结算抵扣、后台增删改的数据来源）；
 * 2）user_coupon 表 —— 「谁领了哪张券」，唯一约束 (user_email, coupon_code) 拦截重复领取。
 *
 * 券池原本写死在前端 data.js 的 COUPON_POOL，现已全部改由 coupon 表提供。
 */
@Service
public class CouponService {

    private final CouponMapper couponMapper;
    private final UserCouponMapper userCouponMapper;

    public CouponService(CouponMapper couponMapper, UserCouponMapper userCouponMapper) {
        this.couponMapper = couponMapper;
        this.userCouponMapper = userCouponMapper;
    }

    // ==================== 优惠券池 ====================

    /** 券池列表：按 id 升序（保持后台维护的顺序） */
    public List<Coupon> listPool() {
        return couponMapper.selectList(
                new LambdaQueryWrapper<Coupon>().orderByAsc(Coupon::getId));
    }

    /** 券池列表（前端字段格式） */
    public List<Map<String, Object>> listPoolVO() {
        List<Map<String, Object>> vo = new ArrayList<>();
        for (Coupon c : listPool()) vo.add(toVO(c));
        return vo;
    }

    /** 按券码查券，不存在返回 null */
    public Coupon findByCode(String code) {
        if (code == null || code.isBlank()) return null;
        return couponMapper.selectOne(
                new LambdaQueryWrapper<Coupon>().eq(Coupon::getCode, code.trim().toUpperCase()));
    }

    /**
     * 新增或修改优惠券（携带 id 视为修改；未带 id 但券码已存在也按修改处理）。
     * 字段会先做归一化 + 校验，非法输入抛 BusinessException。
     */
    public Coupon save(Map<String, Object> body) {
        if (body == null) throw new BusinessException("参数为空");

        String code = str(body.get("code")).toUpperCase();
        if (code.isEmpty()) throw new BusinessException("券码（code）不能为空");
        if (!code.matches("^[A-Z0-9_]+$")) throw new BusinessException("券码只能由字母、数字、下划线组成");

        String title = str(body.get("title"));
        if (title.isEmpty()) throw new BusinessException("券名称不能为空");

        String type = str(body.get("type")).toLowerCase();
        if (!"pct".equals(type) && !"fix".equals(type)) throw new BusinessException("券类型需为 pct（折扣）或 fix（立减）");

        double val = num(body.get("val"), 0);
        if (val <= 0) throw new BusinessException("面值 / 折扣需为大于 0 的数字");
        if ("pct".equals(type) && (val > 1 || val < 0.01)) {
            throw new BusinessException("折扣需在 0.01 ~ 1 之间（如 0.2 表示减 20%）");
        }

        int min = (int) Math.round(num(body.get("min"), 0));
        if (min < 0) throw new BusinessException("使用门槛需为不小于 0 的数字");

        Coupon c = new Coupon();
        Object id = body.get("id");
        if (id != null && !str(id).isEmpty()) {
            try {
                c.setId(Long.valueOf(str(id)));
            } catch (NumberFormatException e) {
                throw new BusinessException("券 id 非法");
            }
        }
        c.setCode(code);
        c.setTitle(title);
        c.setDescp(str(body.get("desc")));
        c.setType(type);
        c.setVal(val);
        c.setMinAmount(min);

        // 券码唯一：编辑时排除自身
        Coupon same = findByCode(code);
        if (same != null && (c.getId() == null || !same.getId().equals(c.getId()))) {
            throw new BusinessException("该券码已存在");
        }

        if (c.getId() == null || couponMapper.selectById(c.getId()) == null) {
            c.setId(null);              // 券码已存在时上面已拦截，这里必定是新增
            c.setCreateTime(LocalDateTime.now());
            couponMapper.insert(c);
        } else {
            couponMapper.updateById(c);
        }
        return findByCode(code);
    }

    /** 从券池删除某张券（已领取用户的 user_coupon 记录保持不动） */
    public boolean delete(String code) {
        if (code == null || code.isBlank()) return false;
        int rows = couponMapper.delete(
                new LambdaQueryWrapper<Coupon>().eq(Coupon::getCode, code.trim().toUpperCase()));
        return rows > 0;
    }

    /**
     * 每张券的领取人数统计（后台概览用）：coupon_code → 已领取条数。
     * 数据来自 user_coupon 表；已从券池删除但用户还留着的券也会出现在结果里，前端按券池过滤展示。
     */
    public Map<String, Long> claimStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        for (UserCoupon uc : userCouponMapper.selectList(null)) {
            String code = uc.getCouponCode();
            if (code == null) continue;
            stats.merge(code, 1L, Long::sum);
        }
        return stats;
    }

    /** 券 → 前端字段格式（amount / cond 为展示文案，由 type/val/min 推导） */
    public Map<String, Object> toVO(Coupon c) {
        Map<String, Object> m = new LinkedHashMap<>();
        double val = c.getVal() == null ? 0 : c.getVal();
        int min = c.getMinAmount() == null ? 0 : c.getMinAmount();
        boolean pct = "pct".equals(c.getType());
        m.put("id", c.getId());
        m.put("code", c.getCode());
        m.put("title", c.getTitle());
        m.put("desc", c.getDescp());
        m.put("type", c.getType());
        m.put("val", val);
        m.put("min", min);
        // val 统一按「减免比例」存：pct 0.2 → 减 20% →「8 折」；fix 30 →「¥30」
        m.put("amount", pct ? trimNum(Math.round((1 - val) * 100) / 10.0) + " 折" : "¥" + trimNum(val));
        m.put("cond", min > 0 ? "满 " + min + " 可用" : "无门槛");
        return m;
    }

    // ==================== 领券 / 我的优惠券 ====================

    /**
     * 领取优惠券：重复领取抛业务异常。
     * @return 领取成功的记录
     */
    public UserCoupon claim(String userEmail, String couponCode) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new BusinessException("请先登录后再领取优惠券");
        }
        if (couponCode == null || couponCode.isBlank()) {
            throw new BusinessException("优惠券信息缺失");
        }
        String code = couponCode.trim().toUpperCase();
        // 券必须真实存在于券池（coupon 表还没数据时不拦，兼容未建表的旧库）
        if (!listPool().isEmpty() && findByCode(code) == null) {
            throw new BusinessException("这张优惠券不存在或已下架");
        }
        // 先查重，给出更友好的提示（数据库唯一约束作为第二道防线）
        Long count = userCouponMapper.selectCount(
                new LambdaQueryWrapper<UserCoupon>()
                        .eq(UserCoupon::getUserEmail, userEmail)
                        .eq(UserCoupon::getCouponCode, code));
        if (count != null && count > 0) {
            throw new BusinessException("这张优惠券你已经领过啦");
        }
        UserCoupon uc = new UserCoupon();
        uc.setUserEmail(userEmail);
        uc.setCouponCode(code);
        uc.setCreateTime(LocalDateTime.now());
        try {
            userCouponMapper.insert(uc);
        } catch (DuplicateKeyException e) {
            // 并发下唯一约束兜底
            throw new BusinessException("这张优惠券你已经领过啦");
        }
        return uc;
    }

    /** 查询某用户已领取的优惠券 code 列表 */
    public List<String> listCodes(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return new ArrayList<>();
        }
        List<UserCoupon> list = userCouponMapper.selectList(
                new LambdaQueryWrapper<UserCoupon>()
                        .eq(UserCoupon::getUserEmail, userEmail)
                        .orderByAsc(UserCoupon::getCreateTime));
        List<String> codes = new ArrayList<>();
        for (UserCoupon uc : list) codes.add(uc.getCouponCode());
        return codes;
    }

    /**
     * 管理员发放优惠券：直接给某个用户写入一条已领取记录（重复发放拦截）。
     * 与普通领券区别：走后台 token 鉴权，不要求「用户本人已登录」。
     */
    public UserCoupon grant(String userEmail, String couponCode) {
        return claim(userEmail, couponCode);
    }

    /**
     * 管理员删除某个用户的某张优惠券（回收）。
     * @return 是否真的删除了记录
     */
    public boolean remove(String userEmail, String couponCode) {
        if (userEmail == null || userEmail.isBlank() || couponCode == null || couponCode.isBlank()) {
            return false;
        }
        int rows = userCouponMapper.delete(
                new LambdaQueryWrapper<UserCoupon>()
                        .eq(UserCoupon::getUserEmail, userEmail)
                        .eq(UserCoupon::getCouponCode, couponCode.trim().toUpperCase()));
        return rows > 0;
    }

    // ---------- 工具方法 ----------

    private String str(Object o) {
        return o == null ? "" : o.toString().trim();
    }

    private double num(Object o, double def) {
        if (o == null) return def;
        try {
            return Double.parseDouble(o.toString().trim());
        } catch (Exception e) {
            return def;
        }
    }

    /** 去掉多余的 .0：30.0 → 30，8.5 → 8.5 */
    private String trimNum(double d) {
        return d == Math.floor(d) && !Double.isInfinite(d)
                ? String.valueOf((long) d)
                : String.valueOf(d);
    }

    /** 业务异常 */
    public static class BusinessException extends RuntimeException {
        public BusinessException(String msg) { super(msg); }
    }
}
