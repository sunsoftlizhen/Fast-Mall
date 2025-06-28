package com.emsp.auth.service.impl;

import com.emsp.auth.dto.LoginRequest;
import com.emsp.auth.dto.RegisterRequest;
import com.emsp.auth.entity.User;
import com.emsp.auth.repository.UserRepository;
import com.emsp.auth.service.AuthService;
import com.emsp.common.dto.Result;
import com.emsp.common.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    @Override
    public Result<?> login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (!userOpt.isPresent()) {
            return Result.error("用户不存在");
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return Result.error("密码错误");
        }
        
        if (user.getStatus() != 1) {
            return Result.error("账户已被禁用");
        }
        
        // 更新登录时间
        user.setLastLoginTime(LocalDateTime.now());
        userRepository.save(user);
        
        // 生成token
        String token = jwtUtil.generateToken(user.getId().toString());
        
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);
        
        return Result.success(data);
    }
    
    @Override
    public Result<?> register(RegisterRequest request) {
        // 检查用户名是否存在
        if (userRepository.existsByUsername(request.getUsername())) {
            return Result.error("用户名已存在");
        }
        
        // 检查邮箱是否存在
        if (userRepository.existsByEmail(request.getEmail())) {
            return Result.error("邮箱已存在");
        }
        
        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setNickname(request.getNickname());
        user.setStatus(1);
        
        userRepository.save(user);
        
        return Result.success("注册成功");
    }
    
    @Override
    public Result<?> logout(String token) {
        // 实现token黑名单逻辑
        return Result.success("退出成功");
    }
    
    @Override
    public Result<?> verifyToken(String token) {
        try {
            String userId = jwtUtil.getUserIdFromToken(token);
            Optional<User> userOpt = userRepository.findById(Long.valueOf(userId));
            
            if (!userOpt.isPresent()) {
                return Result.error("用户不存在");
            }
            
            User user = userOpt.get();
            if (user.getStatus() != 1) {
                return Result.error("账户已被禁用");
            }
            
            return Result.success(user);
        } catch (Exception e) {
            return Result.error("Token无效");
        }
    }
} 