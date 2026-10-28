package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.service.CaptchaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 图形验证码接口
 *
 * GET  /api/captcha        -> { "token": "...", "image": "data:image/png;base64,..." }
 * POST /api/captcha/check  -> { "ok": true/false }   （输入框失焦实时校验，不消费 token）
 */
@RestController
@RequestMapping("/api/captcha")
public class CaptchaController {

    private final CaptchaService captchaService;

    public CaptchaController(CaptchaService captchaService) {
        this.captchaService = captchaService;
    }

    @GetMapping
    public Map<String, String> get() {
        CaptchaService.Captcha c = captchaService.generate();
        Map<String, String> m = new HashMap<>();
        m.put("token", c.token);
        m.put("image", c.image);
        return m;
    }

    @PostMapping("/check")
    public Map<String, Boolean> check(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String code = body.get("code");
        boolean ok = captchaService.check(token, code);
        Map<String, Boolean> m = new HashMap<>();
        m.put("ok", ok);
        return m;
    }
}
