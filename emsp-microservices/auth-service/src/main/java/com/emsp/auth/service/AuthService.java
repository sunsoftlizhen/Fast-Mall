package com.emsp.auth.service;

import com.emsp.auth.dto.LoginRequest;
import com.emsp.auth.dto.RegisterRequest;
import com.emsp.common.dto.Result;

public interface AuthService {
    Result<?> login(LoginRequest request);
    Result<?> register(RegisterRequest request);
    Result<?> logout(String token);
    Result<?> verifyToken(String token);
} 