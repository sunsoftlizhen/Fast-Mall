-- 商品管理相关表结构

-- 商品单位枚举表
CREATE TABLE IF NOT EXISTS product_units (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE COMMENT '单位代码',
  name VARCHAR(50) NOT NULL COMMENT '单位名称',
  description VARCHAR(200) COMMENT '描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='商品单位表';

-- 商品规格枚举表
CREATE TABLE IF NOT EXISTS product_specs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) NOT NULL UNIQUE COMMENT '规格代码',
  name VARCHAR(50) NOT NULL COMMENT '规格名称',
  description VARCHAR(200) COMMENT '描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='商品规格表';

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT '商品名称',
  image VARCHAR(500) COMMENT '商品图片URL',
  spec_id INT NOT NULL COMMENT '规格ID',
  unit_id INT NOT NULL COMMENT '单位ID',
  description TEXT COMMENT '商品描述',
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '进货价',
  discount_price DECIMAL(10,2) DEFAULT NULL COMMENT '折扣价',
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '售价',
  shelf_life INT DEFAULT NULL COMMENT '保质期(天)',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-下架, 1-上架',
  stock_quantity INT DEFAULT 0 COMMENT '库存数量',
  created_by INT NOT NULL COMMENT '创建人ID',
  updated_by INT COMMENT '更新人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (spec_id) REFERENCES product_specs(id),
  FOREIGN KEY (unit_id) REFERENCES product_units(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  
  INDEX idx_name (name),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) COMMENT='商品表';

-- 插入默认单位数据
INSERT IGNORE INTO product_units (code, name, description) VALUES
('kg', '千克', '重量单位'),
('g', '克', '重量单位'),
('l', '升', '容量单位'),
('ml', '毫升', '容量单位'),
('pcs', '个', '计数单位'),
('box', '盒', '包装单位'),
('bottle', '瓶', '包装单位'),
('bag', '袋', '包装单位'),
('pack', '包', '包装单位'),
('set', '套', '组合单位');

-- 插入默认规格数据
INSERT IGNORE INTO product_specs (code, name, description) VALUES
('small', '小规格', '小包装规格'),
('medium', '中规格', '中等包装规格'),
('large', '大规格', '大包装规格'),
('xl', '特大规格', '特大包装规格'),
('mini', '迷你规格', '迷你包装规格'),
('family', '家庭装', '家庭装规格'),
('bulk', '散装', '散装规格'),
('gift', '礼盒装', '礼品包装规格'),
('travel', '便携装', '便携包装规格'),
('economy', '经济装', '经济实惠装规格'); 