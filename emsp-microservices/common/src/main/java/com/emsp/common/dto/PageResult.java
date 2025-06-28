package com.emsp.common.dto;

import lombok.Data;
import java.util.List;

@Data
public class PageResult<T> {
    private List<T> records;
    private Long total;
    private Long size;
    private Long current;
    private Long pages;
    
    public PageResult() {}
    
    public PageResult(List<T> records, Long total, Long size, Long current) {
        this.records = records;
        this.total = total;
        this.size = size;
        this.current = current;
        this.pages = (total + size - 1) / size;
    }
} 