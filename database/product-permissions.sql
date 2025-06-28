-- 添加商品管理权限
INSERT IGNORE INTO permissions (name, code, description) VALUES
('商品查看', 'product:view', '查看商品列表和详情'),
('商品添加', 'product:add', '添加新商品'),
('商品编辑', 'product:edit', '编辑商品信息'),
('商品删除', 'product:delete', '删除商品');

-- 为管理员角色分配商品权限
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p WHERE p.code IN (
  'product:view', 'product:add', 'product:edit', 'product:delete'
); 