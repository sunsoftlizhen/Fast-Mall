package com.emsp.auth.controller;

import com.emsp.auth.dto.LoginRequest;
import com.emsp.auth.dto.RegisterRequest;
import com.emsp.auth.service.AuthService;
import com.emsp.common.dto.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public Result<?> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
    
    @PostMapping("/register")
    public Result<?> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }
    
    @PostMapping("/logout")
    public Result<?> logout(@RequestHeader("Authorization") String token) {
        return authService.logout(token);
    }
    
    @GetMapping("/verify")
    public Result<?> verifyToken(@RequestHeader("Authorization") String token) {
        return authService.verifyToken(token);
    }
} 