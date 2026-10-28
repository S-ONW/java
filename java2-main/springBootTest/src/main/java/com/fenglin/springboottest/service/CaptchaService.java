package com.fenglin.springboottest.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 图形验证码服务
 *
 * 设计要点：
 * 1. 不依赖 HttpSession / Cookie，避免跨域（前端 vite 与后端端口不同）下 session 失效问题；
 * 2. 生成时返回一次性 token + base64 图片（data URL），答案存于服务端内存；
 * 3. token 一次性消费：注册提交校验成功后即删除，可防重复提交与重放；
 * 4. 自带 5 分钟过期与定期清理，避免内存泄漏。
 */
@Service
public class CaptchaService {

    // 去掉易混淆字符 0/O/1/l/I
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int WIDTH = 108;
    private static final int HEIGHT = 42;
    private static final int LENGTH = 4;
    private static final long TTL_MS = 5 * 60 * 1000; // 5 分钟有效期

    private final Map<String, Item> store = new ConcurrentHashMap<>();

    private static class Item {
        final String code;
        final long expireAt;
        Item(String code, long expireAt) {
            this.code = code;
            this.expireAt = expireAt;
        }
    }

    /** 生成验证码，返回 token 与 base64 图片（data URL） */
    public Captcha generate() {
        cleanup();
        String code = randomCode();
        String token = UUID.randomUUID().toString().replace("-", "");
        store.put(token, new Item(code, Instant.now().toEpochMilli() + TTL_MS));
        return new Captcha(token, draw(code));
    }

    /** 仅校验（不消费），用于输入框失焦时的实时提示 */
    public boolean check(String token, String code) {
        if (token == null || code == null) return false;
        Item item = store.get(token);
        if (item == null) return false;
        if (item.expireAt < Instant.now().toEpochMilli()) {
            store.remove(token);
            return false;
        }
        return item.code.equalsIgnoreCase(code.trim());
    }

    /** 校验并消费（一次性），用于注册提交 */
    public boolean validate(String token, String code) {
        if (token == null || code == null) return false;
        Item item = store.remove(token);
        if (item == null) return false;
        if (item.expireAt < Instant.now().toEpochMilli()) return false;
        return item.code.equalsIgnoreCase(code.trim());
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < LENGTH; i++) {
            sb.append(CHARS.charAt((int) (Math.random() * CHARS.length())));
        }
        return sb.toString();
    }

    /** 使用原生 Graphics2D 绘制验证码图片，返回 base64 的 PNG data URL */
    private String draw(String code) {
        BufferedImage img = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // 背景
        g.setColor(new Color(0xFA, 0xFA, 0xFB));
        g.fillRect(0, 0, WIDTH, HEIGHT);

        // 干扰线
        for (int i = 0; i < 4; i++) {
            g.setColor(new Color((int) (Math.random() * 255), (int) (Math.random() * 255), (int) (Math.random() * 255), 180));
            g.drawLine((int) (Math.random() * WIDTH), (int) (Math.random() * HEIGHT),
                    (int) (Math.random() * WIDTH), (int) (Math.random() * HEIGHT));
        }

        // 逐字符：随机颜色 + 轻微旋转 + 偏移
        g.setFont(new Font("Arial", Font.BOLD, 22));
        for (int i = 0; i < code.length(); i++) {
            g.setColor(new Color((int) (Math.random() * 150), (int) (Math.random() * 150), (int) (Math.random() * 150)));
            int x = 15 + i * 24 + (int) (Math.random() * 6 - 3);
            int y = HEIGHT / 2 + (int) (Math.random() * 6 - 3);
            g.translate(x, y);
            double angle = (Math.random() * 44 - 22) * Math.PI / 180;
            g.rotate(angle);
            g.drawString(String.valueOf(code.charAt(i)), 0, 0);
            g.rotate(-angle);
            g.translate(-x, -y);
        }

        // 噪点
        for (int i = 0; i < 26; i++) {
            g.setColor(new Color((int) (Math.random() * 200), (int) (Math.random() * 200), (int) (Math.random() * 200), 120));
            g.fillRect((int) (Math.random() * WIDTH), (int) (Math.random() * HEIGHT), 2, 2);
        }
        g.dispose();

        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", os);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(os.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("生成验证码图片失败", e);
        }
    }

    /** 清理过期条目，防止内存泄漏 */
    private void cleanup() {
        long now = Instant.now().toEpochMilli();
        store.entrySet().removeIf(e -> e.getValue().expireAt < now);
    }

    /** 验证码返回体 */
    public static class Captcha {
        public String token;
        public String image;
        public Captcha(String token, String image) {
            this.token = token;
            this.image = image;
        }
    }
}
