-- 移动端应用数据表结构

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    user_id INT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单总金额',
    payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '实付金额',
    payment_method ENUM('balance', 'alipay', 'wechat', 'cash') DEFAULT 'balance' COMMENT '支付方式',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' COMMENT '支付状态',
    order_status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
    delivery_address TEXT COMMENT '配送地址',
    delivery_phone VARCHAR(20) COMMENT '配送电话',
    delivery_name VARCHAR(50) COMMENT '收货人姓名',
    remark TEXT COMMENT '订单备注',
    paid_at TIMESTAMP NULL COMMENT '支付时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_status (order_status),
    INDEX idx_created_at (created_at)
) COMMENT='订单表';

-- 订单商品表
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    product_id INT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
    product_image VARCHAR(500) COMMENT '商品图片',
    spec_name VARCHAR(50) COMMENT '规格名称',
    unit_name VARCHAR(50) COMMENT '单位名称',
    price DECIMAL(10,2) NOT NULL COMMENT '商品单价',
    quantity INT NOT NULL COMMENT '商品数量',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '小计金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) COMMENT='订单商品表';

-- 用户钱包表
CREATE TABLE IF NOT EXISTS user_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE COMMENT '用户ID',
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '钱包余额',
    total_income DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '总收入',
    total_expense DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '总支出',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id)
) COMMENT='用户钱包表';

-- 钱包流水表
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    type ENUM('income', 'expense') NOT NULL COMMENT '流水类型：收入/支出',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    balance_before DECIMAL(10,2) NOT NULL COMMENT '操作前余额',
    balance_after DECIMAL(10,2) NOT NULL COMMENT '操作后余额',
    source ENUM('recharge', 'payment', 'refund', 'reward') NOT NULL COMMENT '来源：充值/支付/退款/奖励',
    reference_type ENUM('order', 'recharge', 'system') DEFAULT NULL COMMENT '关联类型',
    reference_id INT DEFAULT NULL COMMENT '关联ID',
    description VARCHAR(200) COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_source (source),
    INDEX idx_created_at (created_at)
) COMMENT='钱包流水表';

-- 朋友圈发布表
CREATE TABLE IF NOT EXISTS moments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    product_id INT DEFAULT NULL COMMENT '关联商品ID（如果是商品评论）',
    content TEXT NOT NULL COMMENT '发布内容',
    images JSON COMMENT '图片列表（JSON格式）',
    location VARCHAR(100) COMMENT '位置信息',
    type ENUM('normal', 'product_review') DEFAULT 'normal' COMMENT '类型：普通/商品评论',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-隐藏',
    likes_count INT DEFAULT 0 COMMENT '点赞数',
    comments_count INT DEFAULT 0 COMMENT '评论数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) COMMENT='朋友圈发布表';

-- 朋友圈评论表
CREATE TABLE IF NOT EXISTS moment_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moment_id INT NOT NULL COMMENT '朋友圈ID',
    user_id INT NOT NULL COMMENT '评论用户ID',
    parent_id INT DEFAULT NULL COMMENT '父评论ID（回复）',
    content TEXT NOT NULL COMMENT '评论内容',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-隐藏',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES moment_comments(id) ON DELETE CASCADE,
    INDEX idx_moment_id (moment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_created_at (created_at)
) COMMENT='朋友圈评论表';

-- 朋友圈点赞表
CREATE TABLE IF NOT EXISTS moment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moment_id INT NOT NULL COMMENT '朋友圈ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_moment_like (moment_id, user_id),
    INDEX idx_moment_id (moment_id),
    INDEX idx_user_id (user_id)
) COMMENT='朋友圈点赞表';

-- 用户地址表
CREATE TABLE IF NOT EXISTS user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(50) NOT NULL COMMENT '收货人姓名',
    phone VARCHAR(20) NOT NULL COMMENT '收货人电话',
    province VARCHAR(50) NOT NULL COMMENT '省份',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    district VARCHAR(50) NOT NULL COMMENT '区县',
    address VARCHAR(200) NOT NULL COMMENT '详细地址',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认地址：1-是，0-否',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default)
) COMMENT='用户地址表';

-- 购物车表
CREATE TABLE IF NOT EXISTS shopping_cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    product_id INT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '商品数量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id)
) COMMENT='购物车表';

-- 为移动端用户创建钱包记录的触发器
DELIMITER $$
CREATE TRIGGER create_user_wallet_after_insert 
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_wallets (user_id, balance) VALUES (NEW.id, 0.00);
END$$
DELIMITER ;

-- 扩展产品权限
INSERT IGNORE INTO permissions (name, code, description) VALUES 
('产品管理', 'product:manage', '产品增删改查权限'),
('产品查看', 'product:view', '产品查看权限'),
('产品添加', 'product:add', '产品添加权限'),
('产品编辑', 'product:edit', '产品编辑权限'),
('产品删除', 'product:delete', '产品删除权限'),
('订单管理', 'order:manage', '订单管理权限'),
('订单查看', 'order:view', '订单查看权限'),
('朋友圈管理', 'moment:manage', '朋友圈管理权限'),
('朋友圈查看', 'moment:view', '朋友圈查看权限');

-- 为管理员角色分配新权限
INSERT IGNORE INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions WHERE code IN (
    'product:manage', 'product:view', 'product:add', 'product:edit', 'product:delete',
    'order:manage', 'order:view', 'moment:manage', 'moment:view'
); 