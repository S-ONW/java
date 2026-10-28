package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

/**
 * 商品实体，对应数据库 shop 库的 product 表。
 * 后台管理系统管理的就是这张表，首页展示的商品数据来源于此。
 */
@TableName("product")
public class Product {

    /** 主键自增 */
    @TableId(type = IdType.AUTO)
    private Long id;

    /** 商品名称 */
    private String name;

    /** 商品描述（列名避开 SQL 关键字 desc） */
    private String descp;

    /** 现价 */
    private Integer price;

    /** 原价 */
    private Integer oldPrice;

    /** 分类：数码 / 家居 / 美妆 / 食品 / 运动 … */
    private String cat;

    /** 商品图标（emoji） */
    private String icon;

    /** 热度 */
    private Integer hot;

    /** 评分 */
    private Double rate;

    /** 库存 */
    private Integer stock;

    /** 角标：热销 / 新品 / 折扣 */
    private String tag;

    /** 图集（多个 emoji，英文逗号分隔） */
    private String gallery;

    public Product() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescp() { return descp; }
    public void setDescp(String descp) { this.descp = descp; }
    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }
    public Integer getOldPrice() { return oldPrice; }
    public void setOldPrice(Integer oldPrice) { this.oldPrice = oldPrice; }
    public String getCat() { return cat; }
    public void setCat(String cat) { this.cat = cat; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public Integer getHot() { return hot; }
    public void setHot(Integer hot) { this.hot = hot; }
    public Double getRate() { return rate; }
    public void setRate(Double rate) { this.rate = rate; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
    public String getGallery() { return gallery; }
    public void setGallery(String gallery) { this.gallery = gallery; }
}
