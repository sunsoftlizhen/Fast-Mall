package com.emsp.moment.entity;

import com.emsp.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "moments")
public class Moment extends BaseEntity {
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;
    
    @Column(name = "like_count")
    private Integer likeCount = 0;
    
    @Column(name = "comment_count")
    private Integer commentCount = 0;
    
    @Column(name = "status")
    private Integer status = 1;
} 