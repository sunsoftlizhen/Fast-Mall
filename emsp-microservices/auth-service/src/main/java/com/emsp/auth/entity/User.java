package com.emsp.auth.entity;

import com.emsp.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "phone")
    private String phone;
    
    @Column(name = "avatar")
    private String avatar;
    
    @Column(name = "nickname")
    private String nickname;
    
    @Column(name = "gender")
    private Integer gender;
    
    @Column(name = "birthday")
    private LocalDateTime birthday;
    
    @Column(name = "status", nullable = false)
    private Integer status = 1;
    
    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;
    
    @Column(name = "last_login_ip")
    private String lastLoginIp;
} 