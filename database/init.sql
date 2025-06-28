-- 创建数据库
CREATE DATABASE IF NOT EXISTS awms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE awms;

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
    description VARCHAR(200) COMMENT '角色描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '电话',
    avatar VARCHAR(255) COMMENT '头像',
    role_id INT DEFAULT 2 COMMENT '角色ID',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '权限名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '权限代码',
    description VARCHAR(200) COMMENT '权限描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- 插入初始角色数据
INSERT INTO roles (name, description) VALUES 
('管理员', '系统管理员，拥有所有权限'),
('普通用户', '普通用户，拥有基本权限');

-- 插入初始权限数据
INSERT INTO permissions (name, code, description) VALUES 
('用户管理', 'user:manage', '用户增删改查权限'),
('用户查看', 'user:view', '用户查看权限'),
('用户添加', 'user:add', '用户添加权限'),
('用户编辑', 'user:edit', '用户编辑权限'),
('用户删除', 'user:delete', '用户删除权限'),
('角色管理', 'role:manage', '角色管理权限'),
('权限管理', 'permission:manage', '权限管理权限'),
('系统设置', 'system:setting', '系统设置权限');

-- 为管理员角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions;

-- 为普通用户角色分配基本权限
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 2, id FROM permissions WHERE code IN ('user:view');

-- 插入初始管理员用户 (密码: admin123)
INSERT INTO users (username, password, email, role_id, status) VALUES 
('admin', '$2b$10$eAPsiCDiRuL3sPNTcmcjreOda5oSdnBgfPKO3J5DvQ.7Pw.mf2znC', 'admin@example.com', 1, 1);

-- 插入测试普通用户 (密码: user123)
INSERT INTO users (username, password, email, role_id, status) VALUES 
('testuser', '$2b$10$XbOiJ5Qt.ojBpaIsYirjz.lJ6.mdk8WFG84lsa5pXnfHGaigHKumm', 'user@example.com', 2, 1); 