# EMSP 开发文档

## 项目概述

EMSP (E-commerce & Moments Social Platform) 是一个基于 Vue3 + Koa + MySQL 的现代化电商与社交平台，支持用户管理、角色权限管理、商品管理、朋友圈社交等核心功能。

## 技术栈

### 前端

- **Vue 3** - 渐进式 JavaScript 框架
- **Element Plus** - Vue 3 组件库
- **Vue Router** - 路由管理
- **Pinia** - 状态管理
- **Axios** - HTTP 客户端
- **ECharts** - 数据可视化
- **Vite** - 构建工具

### 后端

- **Node.js** - JavaScript 运行时
- **Koa** - Web 框架
- **MySQL** - 关系型数据库
- **JWT** - 身份验证
- **bcrypt** - 密码加密
- **Joi** - 数据验证

## 功能特性

### 🔐 认证授权

- JWT Token 身份验证
- 基于角色的权限管理 (RBAC)
- 登录/注册功能
- 权限路由守卫

### 👥 用户管理

- 用户列表查看（支持分页、搜索）
- 添加/编辑/删除用户
- 用户状态管理
- 个人信息管理
- 密码修改

### 🛡️ 角色权限

- 角色管理
- 权限分配
- 动态菜单显示
- 按钮级权限控制

### 📊 数据统计

- 用户数据统计
- 图表可视化展示
- 实时数据更新

### 🛍️ 商品管理

- 商品列表管理（支持分页、搜索、筛选）
- 添加/编辑/删除商品
- 商品规格和单位管理
- 价格信息管理（进货价、售价、折扣价）
- 库存数量管理
- 商品状态控制
- 保质期管理

## 数据库设计

### 核心表结构

#### 用户相关

- `users` - 用户基本信息
- `roles` - 角色信息
- `permissions` - 权限信息
- `role_permissions` - 角色权限关联

#### 商品相关

- `products` - 商品基本信息
- `product_specs` - 商品规格枚举
- `product_units` - 商品单位枚举

### 权限系统

系统内置以下权限：

- **用户管理**: `user:view`, `user:add`, `user:edit`, `user:delete`
- **角色管理**: `role:manage`
- **权限管理**: `permission:manage`
- **系统设置**: `system:setting`
- **商品管理**: `product:view`, `product:add`, `product:edit`, `product:delete`

## 项目结构

```
emsp/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   │   ├── authController.js      # 认证控制器
│   │   │   ├── userController.js      # 用户管理
│   │   │   ├── roleController.js      # 角色管理
│   │   │   ├── permissionController.js # 权限管理
│   │   │   ├── dashboardController.js # 仪表板
│   │   │   └── productController.js   # 商品管理
│   │   ├── middleware/       # 中间件
│   │   │   ├── auth.js       # 身份验证
│   │   │   ├── permission.js # 权限检查
│   │   │   └── errorHandler.js # 错误处理
│   │   ├── routes/          # 路由
│   │   └── utils/           # 工具类
│   ├── app.js               # 应用入口
│   └── package.json
├── frontend/                # 前端代码
│   ├── src/
│   │   ├── components/      # 公共组件
│   │   ├── views/           # 页面组件
│   │   │   ├── users/       # 用户管理页面
│   │   │   ├── roles/       # 角色管理页面
│   │   │   ├── permissions/ # 权限管理页面
│   │   │   └── products/    # 商品管理页面
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # 状态管理
│   │   └── utils/           # 工具类
│   └── package.json
├── database/                # 数据库脚本
│   ├── init.sql            # 初始化脚本
│   ├── products.sql        # 商品表脚本
│   └── product-permissions.sql # 商品权限脚本
└── README.md
```

## 快速开始

### 1. 环境准备

```bash
# 安装 Node.js (推荐 v16+)
# 安装 MySQL (推荐 v8.0+)
```

### 2. 数据库初始化

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE emsp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入初始化脚本
mysql -u root -p emsp < database/init.sql
mysql -u root -p emsp < database/products.sql
mysql -u root -p emsp < database/product-permissions.sql
```

### 3. 启动项目

```bash
# 一键启动（推荐）
chmod +x start.sh
./start.sh

# 或者分别启动
# 后端
cd backend && npm install && npm start

# 前端
cd frontend && npm install && npm run dev
```

### 4. 访问系统

- 前端地址: http://localhost:8081
- 后端地址: http://localhost:3000

### 5. 默认账号

- **管理员**: admin / admin123
- **普通用户**: testuser / user123

## API 接口

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/current` - 获取当前用户信息

### 用户管理接口

- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `GET /api/users/profile` - 获取个人信息
- `PUT /api/users/profile` - 更新个人信息

### 角色管理接口

- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色

### 商品管理接口

- `GET /api/products` - 获取商品列表
- `POST /api/products` - 创建商品
- `GET /api/products/:id` - 获取商品详情
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 删除商品
- `GET /api/products/specs/list` - 获取商品规格列表
- `GET /api/products/units/list` - 获取商品单位列表

### 统计接口

- `GET /api/dashboard/stats` - 获取统计数据

## 开发规范

### 代码规范

- 使用 ESLint 进行代码检查
- 统一的错误处理机制
- RESTful API 设计
- 组件化开发

### 安全规范

- JWT Token 验证
- bcrypt 密码加密
- SQL 注入防护
- XSS 攻击防护
- 权限验证中间件

### 数据库规范

- 统一字段命名（下划线命名）
- 创建时间/更新时间自动维护
- 软删除机制
- 索引优化

## 部署说明

### 生产环境配置

1. 修改数据库连接配置
2. 设置环境变量
3. 构建前端项目
4. 配置反向代理（Nginx）
5. 启用 HTTPS

### Docker 部署

```bash
# 构建镜像
docker build -t emsp-backend ./backend
docker build -t emsp-frontend ./frontend

# 运行容器
docker-compose up -d
```

## 常见问题

### 1. 数据库连接失败

- 检查 MySQL 服务是否启动
- 确认数据库连接配置
- 检查防火墙设置

### 2. 权限问题

- 确认用户角色分配
- 检查权限配置
- 验证 JWT Token

### 3. 前端页面空白

- 检查后端服务状态
- 确认 API 接口正常
- 查看浏览器控制台错误

## 更新日志

### v1.2.0 (2025-06-23)

- ✨ 新增商品管理功能
- ✨ 新增商品规格和单位管理
- ✨ 新增价格信息管理
- ✨ 新增库存管理
- 🐛 修复 JWT Token 解析问题
- 🐛 修复 SQL 参数绑定问题
- 📝 完善开发文档

### v1.1.0 (2025-06-22)

- ✨ 新增个人信息管理
- ✨ 新增密码修改功能
- 🐛 修复用户权限获取问题
- 🐛 修复分页参数验证问题

### v1.0.0 (2025-06-21)

- 🎉 项目初始化
- ✨ 用户管理功能
- ✨ 角色权限管理
- ✨ 数据统计展示
- ✨ JWT 身份验证

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 发起 Pull Request

## 许可证

MIT License
