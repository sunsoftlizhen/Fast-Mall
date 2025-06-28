package com.emsp.product.entity;

import com.emsp.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "products")
public class Product extends BaseEntity {
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(nullable = false)
    private Integer stock;
    
    @Column(name = "category_id")
    private Long categoryId;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(nullable = false)
    private Integer status = 1;
    
    @Column(name = "sales_count")
    private Integer salesCount = 0;
} 