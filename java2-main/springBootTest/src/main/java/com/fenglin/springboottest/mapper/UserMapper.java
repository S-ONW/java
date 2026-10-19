package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.User;

/**
 * 用户 Mapper：继承 MyBatis-Plus 的 BaseMapper 即拥有常规 CRUD，无需手写 SQL
 */
public interface UserMapper extends BaseMapper<User> {
}
