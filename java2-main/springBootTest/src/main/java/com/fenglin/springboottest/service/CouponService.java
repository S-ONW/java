package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fenglin.springboottest.entity.UserCoupon;
import com.fenglin.springboottest.mapper.UserCouponMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 领券中心服务：领取 / 查询用户已领取的优惠券。
 *
 * 优惠券池由前端 COUPON_POOL 静态定义，本服务只负责持久化「谁领了哪张券」。
 * 唯一约束 (user_email, coupon_code) 在数据库层面拦截重复领取。
 */
@Service
public class CouponService {

    private final UserCouponMapper userCouponMapper;

    public CouponService(UserCouponMapper userCouponMapper) {
        this.userCouponMapper = userCouponMapper;
    }

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
        // 先查重，给出更友好的提示（数据库唯一约束作为第二道防线）
        Long count = userCouponMapper.selectCount(
                new LambdaQueryWrapper<UserCoupon>()
                        .eq(UserCoupon::getUserEmail, userEmail)
                        .eq(UserCoupon::getCouponCode, couponCode));
        if (count != null && count > 0) {
            throw new BusinessException("这张优惠券你已经领过啦");
        }
        UserCoupon uc = new UserCoupon();
        uc.setUserEmail(userEmail);
        uc.setCouponCode(couponCode);
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

    /** 业务异常 */
    public static class BusinessException extends RuntimeException {
        public BusinessException(String msg) { super(msg); }
    }
}
