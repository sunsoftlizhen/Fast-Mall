package com.awms.common.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 统一返回结果类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> {
    
    /**
     * 是否成功
     */
    private Boolean success;
    
    /**
     * 返回码
     */
    private Integer code;
    
    /**
     * 返回消息
     */
    private String message;
    
    /**
     * 返回数据
     */
    private T data;
    
    /**
     * 时间戳
     */
    private Long timestamp;
    
    public Result(Boolean success, Integer code, String message, T data) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }
    
    /**
     * 成功返回
     */
    public static <T> Result<T> success() {
        return new Result<>(true, 200, "操作成功", null);
    }
    
    public static <T> Result<T> success(T data) {
        return new Result<>(true, 200, "操作成功", data);
    }
    
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(true, 200, message, data);
    }
    
    /**
     * 失败返回
     */
    public static <T> Result<T> error() {
        return new Result<>(false, 500, "操作失败", null);
    }
    
    public static <T> Result<T> error(String message) {
        return new Result<>(false, 500, message, null);
    }
    
    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(false, code, message, null);
    }
    
    public static <T> Result<T> error(Integer code, String message, T data) {
        return new Result<>(false, code, message, data);
    }
    
    /**
     * 根据布尔值返回结果
     */
    public static <T> Result<T> result(boolean success) {
        return success ? success() : error();
    }
    
    public static <T> Result<T> result(boolean success, String message) {
        return success ? success(message, null) : error(message);
    }
} 