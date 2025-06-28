package com.emsp.product.service;

import com.emsp.common.dto.Result;

public interface ProductService {
    Result<?> getProducts(Integer page, Integer size, String keyword);
    Result<?> getProduct(Long id);
    Result<?> createProduct(Object product);
    Result<?> updateProduct(Long id, Object product);
    Result<?> deleteProduct(Long id);
} 