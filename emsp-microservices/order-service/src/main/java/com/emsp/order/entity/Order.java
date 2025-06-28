package com.emsp.order.entity;

import com.emsp.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "orders")
public class Order extends BaseEntity {
    
    @Column(name = "order_no", unique = true, nullable = false)
    private String orderNo;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(nullable = false)
    private Integer status;
    
    @Column(name = "payment_method")
    private String paymentMethod;
    
    @Column(name = "payment_time")
    private LocalDateTime paymentTime;
    
    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;
    
    @Column(name = "remark")
    private String remark;
} 