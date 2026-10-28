package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.entity.Product;
import com.fenglin.springboottest.mapper.ProductMapper;
import com.fenglin.springboottest.service.AdminService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 商品接口：后台管理系统对首页购物数据的增删改查
 *
 * GET    /api/product/list          商品列表（公开，首页/后台都读它）
 * POST   /api/product/save          新增或保存商品（需 Header: X-Admin-Token）
 * DELETE /api/product/{id}          删除商品（需 Header: X-Admin-Token）
 *
 * 前端商品字段（与 data.js 一致）：
 * { id, name, desc, price, old, cat, icon, hot, rate, stock, tag, g[] }
 */
@RestController
@RequestMapping("/api/product")
public class ProductController {

    private final ProductMapper productMapper;
    private final AdminService adminService;

    public ProductController(ProductMapper productMapper, AdminService adminService) {
        this.productMapper = productMapper;
        this.adminService = adminService;
    }

    /** 商品列表：按 id 升序，转成前端使用的字段格式 */
    @GetMapping("/list")
    public Result<List<Map<String, Object>>> list() {
        try {
            List<Product> list = productMapper.selectList(null);
            List<Map<String, Object>> vo = new ArrayList<>();
            for (Product p : list) vo.add(toVO(p));
            return Result.ok("ok", vo);
        } catch (Exception e) {
            // 常见原因：product 表尚未创建
            return Result.error(500, "读取商品失败，请确认已创建 product 表（见 resources/db/schema.sql）");
        }
    }

    /** 新增或修改商品（携带 id 视为修改） */
    @PostMapping("/save")
    public Result<Map<String, Object>> save(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @RequestBody Map<String, Object> body) {
        if (!adminService.check(token)) {
            return Result.error(401, "登录已失效，请重新登录后台");
        }
        if (body == null) return Result.error(400, "参数为空");

        String name = str(body.get("name"));
        if (name.isEmpty()) return Result.error(400, "商品名称不能为空");

        Product p = new Product();
        Object id = body.get("id");
        if (id != null && !str(id).isEmpty()) {
            p.setId(Long.valueOf(str(id)));
        }
        p.setName(name);
        p.setDescp(str(body.get("desc")));
        p.setPrice(intOf(body.get("price"), 0));
        p.setOldPrice(intOf(body.get("old"), 0));
        p.setCat(str(body.get("cat")).isEmpty() ? "其他" : str(body.get("cat")));
        p.setIcon(str(body.get("icon")).isEmpty() ? "📦" : str(body.get("icon")));
        p.setHot(intOf(body.get("hot"), 50));
        p.setRate(doubleOf(body.get("rate"), 4.5));
        p.setStock(intOf(body.get("stock"), 0));
        p.setTag(str(body.get("tag")));
        p.setGallery(joinGallery(body.get("g")));

        try {
            if (p.getId() == null) {
                productMapper.insert(p);
            } else {
                Product exist = productMapper.selectById(p.getId());
                if (exist == null) productMapper.insert(p);
                else productMapper.updateById(p);
            }
            return Result.ok("保存成功", toVO(p));
        } catch (Exception e) {
            return Result.error(500, "保存商品失败，请确认 product 表已创建");
        }
    }

    /** 删除商品 */
    @DeleteMapping("/{id}")
    public Result<String> delete(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @PathVariable("id") Long id) {
        if (!adminService.check(token)) {
            return Result.error(401, "登录已失效，请重新登录后台");
        }
        try {
            Product exist = productMapper.selectById(id);
            if (exist == null) return Result.error(404, "商品不存在或已删除");
            productMapper.deleteById(id);
            return Result.ok("删除成功");
        } catch (Exception e) {
            return Result.error(500, "删除商品失败，请确认 product 表已创建");
        }
    }

    // ---------- 工具方法 ----------

    /** 数据库实体 → 前端字段格式 */
    private Map<String, Object> toVO(Product p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("name", p.getName());
        m.put("desc", p.getDescp());
        m.put("price", p.getPrice());
        m.put("old", p.getOldPrice());
        m.put("cat", p.getCat());
        m.put("icon", p.getIcon());
        m.put("hot", p.getHot());
        m.put("rate", p.getRate());
        m.put("stock", p.getStock());
        m.put("tag", p.getTag());
        m.put("g", splitGallery(p.getGallery()));
        return m;
    }

    private List<String> splitGallery(String gallery) {
        List<String> g = new ArrayList<>();
        if (gallery == null || gallery.isEmpty()) return g;
        for (String s : gallery.split(",")) {
            if (!s.isEmpty()) g.add(s);
        }
        return g;
    }

    @SuppressWarnings("unchecked")
    private String joinGallery(Object g) {
        if (g == null) return "";
        if (g instanceof List) {
            StringBuilder sb = new StringBuilder();
            for (Object o : (List<Object>) g) {
                if (o == null) continue;
                if (sb.length() > 0) sb.append(",");
                sb.append(o.toString());
            }
            return sb.toString();
        }
        return g.toString();
    }

    private String str(Object o) {
        return o == null ? "" : o.toString().trim();
    }

    private Integer intOf(Object o, int def) {
        if (o == null) return def;
        try {
            return (int) Math.round(Double.parseDouble(o.toString()));
        } catch (Exception e) {
            return def;
        }
    }

    private Double doubleOf(Object o, double def) {
        if (o == null) return def;
        try {
            return Double.parseDouble(o.toString());
        } catch (Exception e) {
            return def;
        }
    }
}
