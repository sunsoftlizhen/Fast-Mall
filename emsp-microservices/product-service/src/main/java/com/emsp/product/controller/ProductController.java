package com.emsp.product.controller;

import com.emsp.common.dto.Result;
import com.emsp.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    
    private final ProductService productService;
    
    @GetMapping
    public Result<?> getProducts(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword) {
        return productService.getProducts(page, size, keyword);
    }
    
    @GetMapping("/{id}")
    public Result<?> getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }
    
    @PostMapping
    public Result<?> createProduct(@RequestBody Object product) {
        return productService.createProduct(product);
    }
    
    @PutMapping("/{id}")
    public Result<?> updateProduct(@PathVariable Long id, @RequestBody Object product) {
        return productService.updateProduct(id, product);
    }
    
    @DeleteMapping("/{id}")
    public Result<?> deleteProduct(@PathVariable Long id) {
        return productService.deleteProduct(id);
    }
} 