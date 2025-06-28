# 移动端商城应用

## 项目介绍

基于 Vue3 + Vant4 开发的移动端商城应用，包含商品浏览、购物车、订单管理、朋友圈等功能。

## 主要功能

### 首页

- 商品列表展示
- 搜索功能（右侧滑出）
- 添加购物车
- 商品详情查看

### 逛一逛（朋友圈）

- 类似微信朋友圈
- 发布动态和图片
- 点赞和评论功能
- 商品评价展示

### 我的

- 个人信息管理
- 钱包余额查看
- 订单管理
- 发布动态入口

## 技术栈

- Vue 3 + Composition API
- Vant 4 移动端 UI 组件
- Vue Router 4 路由管理
- Pinia 状态管理
- Axios HTTP 请求
- Vite 构建工具

## 快速开始

### 1. 安装依赖

```bash
cd mobile
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问应用

打开浏览器访问 http://localhost:3001

## 测试账号

- 用户名：testuser
- 密码：user123

## 项目结构

```
mobile/
├── src/
│   ├── components/     # 公共组件
│   ├── views/         # 页面组件
│   ├── stores/        # 状态管理
│   ├── utils/         # 工具函数
│   ├── router/        # 路由配置
│   └── assets/        # 静态资源
├── public/            # 公共资源
└── dist/             # 构建输出
```

## 构建部署

```bash
npm run build
```

构建完成后，将 `dist` 目录部署到 Web 服务器即可。
