# 后台管理系统

一个基于 Vue3 + Koa + MySQL 的后台管理系统

## 项目结构

```
awms/
├── frontend/           # Vue3前端项目
│   ├── src/
│   │   ├── components/ # 组件
│   │   ├── views/      # 页面
│   │   ├── router/     # 路由
│   │   ├── store/      # 状态管理
│   │   └── utils/      # 工具函数
│   ├── package.json
│   └── vite.config.js
├── backend/            # Koa后端项目
│   ├── src/
│   │   ├── controllers/ # 控制器
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由
│   │   ├── middleware/  # 中间件
│   │   └── utils/       # 工具函数
│   ├── package.json
│   └── app.js
└── database/           # 数据库相关
    └── init.sql        # 数据库初始化脚本
```

## 功能特性

- 用户登录/注册
- 用户管理（增删改查）
- 权限管理
- 数据统计首页
- 响应式设计

## 安装运行

### 后端

```bash
cd backend
npm install
npm start
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

### 数据库

1. 创建 MySQL 数据库
2. 执行 `database/init.sql` 初始化表结构

## 技术栈

- 前端：Vue3 + Vite + Element Plus + Vue Router + Pinia
- 后端：Node.js + Koa + MySQL2 + JWT
- 数据库：MySQL
