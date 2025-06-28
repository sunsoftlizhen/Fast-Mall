# AWMS 系统部署指南

本文档详细介绍了 AWMS 全栈电商与社交管理系统的完整部署方案，包括开发环境、测试环境和生产环境的部署步骤。

## 📋 目录

- [系统架构](#系统架构)
- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker 容器化部署](#docker-容器化部署)
- [微服务架构部署](#微服务架构部署)
- [监控与维护](#监控与维护)
- [故障排查](#故障排查)

## 🏗️ 系统架构

```
AWMS 系统架构
├── 前端应用
│   ├── 管理后台 (Vue3 + Element Plus) - 端口 8081
│   └── 移动端商城 (Vue3 + Vant4) - 端口 3001
├── 后端服务
│   ├── Node.js 单体服务 (Koa2) - 端口 3000
│   └── 微服务架构 (Spring Boot + Spring Cloud)
│       ├── API 网关 - 端口 8080
│       ├── 认证服务 - 端口 8081
│       ├── 用户服务 - 端口 8082
│       ├── 商品服务 - 端口 8083
│       ├── 订单服务 - 端口 8084
│       └── 朋友圈服务 - 端口 8085
└── 基础设施
    ├── MySQL 8.0 - 端口 3306
    ├── Redis 6.x - 端口 6379
    ├── Nacos - 端口 8848 (微服务)
    └── RabbitMQ - 端口 5672 (可选)
```

## 🔧 环境要求

### 基础环境

| 组件               | 版本要求            | 说明                |
| ------------------ | ------------------- | ------------------- |
| **操作系统**       | Linux/macOS/Windows | 推荐 Ubuntu 20.04+  |
| **Node.js**        | 16.x+               | 前端和 Node.js 后端 |
| **Java**           | 11+                 | 微服务架构          |
| **MySQL**          | 8.0+                | 主数据库            |
| **Redis**          | 6.x+                | 缓存和会话存储      |
| **Docker**         | 20.10+              | 容器化部署          |
| **Docker Compose** | 2.0+                | 容器编排            |

### 硬件要求

#### 开发环境

- **CPU**: 2 核心+
- **内存**: 4GB+
- **存储**: 20GB+

#### 生产环境

- **CPU**: 4 核心+
- **内存**: 8GB+
- **存储**: 100GB+

## ⚡ 快速部署

### 一键启动（推荐新手）

```bash
# 1. 克隆项目
git clone <repository-url>
cd awms

# 2. 配置数据库
mysql -u root -p -e "CREATE DATABASE awms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p awms < database/init.sql
mysql -u root -p awms < database/mobile-app.sql
mysql -u root -p awms < database/products.sql
mysql -u root -p awms < database/product-permissions.sql

# 3. 配置后端
cd backend
cp config.example.js config.js
# 编辑 config.js 修改数据库连接信息
npm install

# 4. 启动管理后台
cd ..
chmod +x start.sh
./start.sh

# 5. 启动移动端（新终端）
chmod +x start-mobile.sh
./start-mobile.sh
```

### 访问地址

- **管理后台**: http://localhost:8081
- **移动端商城**: http://localhost:3001
- **后端 API**: http://localhost:3000

### 默认账号

- **管理员**: admin / admin123
- **普通用户**: testuser / user123

## 🔨 开发环境部署

### 1. 环境准备

#### 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# macOS
brew install node@18

# Windows
# 下载并安装: https://nodejs.org/
```

#### 安装 MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# macOS
brew install mysql

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### 安装 Redis（可选）

```bash
# Ubuntu/Debian
sudo apt install redis-server

# CentOS/RHEL
sudo yum install redis

# macOS
brew install redis

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. 数据库初始化

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE awms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'awms'@'localhost' IDENTIFIED BY 'awms123456';
GRANT ALL PRIVILEGES ON awms.* TO 'awms'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 导入数据库结构和数据
mysql -u awms -p awms < database/init.sql
mysql -u awms -p awms < database/mobile-app.sql
mysql -u awms -p awms < database/products.sql
mysql -u awms -p awms < database/product-permissions.sql
```

### 3. 后端服务配置

```bash
cd backend

# 复制配置文件
cp config.example.js config.js

# 编辑配置文件
nano config.js
```

**config.js 配置示例**:

```javascript
module.exports = {
  port: 3000,
  database: {
    host: "localhost",
    user: "awms",
    password: "awms123456",
    database: "awms",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  jwt: {
    secret: "your-secret-key-change-in-production",
    expiresIn: "24h",
  },
  env: "development",
};
```

### 4. 安装依赖并启动

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install

# 移动端依赖
cd ../mobile
npm install
```

### 5. 分别启动服务

```bash
# 终端1: 启动后端
cd backend
npm run dev  # 或 npm start

# 终端2: 启动管理前端
cd frontend
npm run dev

# 终端3: 启动移动端
cd mobile
npm run dev
```

## 🚀 生产环境部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y nginx mysql-server redis-server git curl

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 进程管理器
sudo npm install -g pm2
```

### 2. 数据库配置

```bash
# 安全配置 MySQL
sudo mysql_secure_installation

# 创建生产数据库
mysql -u root -p
CREATE DATABASE awms_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'awms_prod'@'localhost' IDENTIFIED BY 'strong-password-here';
GRANT ALL PRIVILEGES ON awms_prod.* TO 'awms_prod'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 导入数据
mysql -u awms_prod -p awms_prod < database/init.sql
mysql -u awms_prod -p awms_prod < database/mobile-app.sql
mysql -u awms_prod -p awms_prod < database/products.sql
mysql -u awms_prod -p awms_prod < database/product-permissions.sql
```

### 3. 应用部署

```bash
# 创建应用目录
sudo mkdir -p /var/www/awms
sudo chown $USER:$USER /var/www/awms

# 克隆代码
cd /var/www/awms
git clone <repository-url> .

# 后端配置
cd backend
cp config.example.js config.js
# 编辑生产配置
npm install --production

# 构建前端
cd ../frontend
npm install
npm run build

# 构建移动端
cd ../mobile
npm install
npm run build
```

### 4. PM2 进程管理

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "awms-backend",
      script: "./backend/app.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_file: "./logs/backend.log",
      time: true,
    },
  ],
};
```

```bash
# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 5. Nginx 配置

创建 `/etc/nginx/sites-available/awms`:

```nginx
# 管理后台
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/awms/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 移动端
server {
    listen 80;
    server_name mobile.yourdomain.com;
    root /var/www/awms/mobile/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/awms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL 证书（推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d admin.yourdomain.com -d mobile.yourdomain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 Docker 容器化部署

### 1. 创建 Docker 网络

```bash
docker network create awms-network
```

### 2. 启动基础服务

```bash
# MySQL
docker run -d \
  --name awms-mysql \
  --network awms-network \
  -e MYSQL_ROOT_PASSWORD=awms123456 \
  -e MYSQL_DATABASE=awms \
  -e MYSQL_USER=awms \
  -e MYSQL_PASSWORD=awms123456 \
  -p 3306:3306 \
  -v awms-mysql-data:/var/lib/mysql \
  mysql:8.0

# Redis
docker run -d \
  --name awms-redis \
  --network awms-network \
  -p 6379:6379 \
  redis:6.2-alpine redis-server --requirepass awms123456
```

### 3. 构建应用镜像

**后端 Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**前端 Dockerfile**:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### 4. Docker Compose 部署

创建 `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    container_name: awms-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: awms
      MYSQL_USER: awms
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database:/docker-entrypoint-initdb.d
    networks:
      - awms-network

  redis:
    image: redis:6.2-alpine
    container_name: awms-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - awms-network

  backend:
    build: ./backend
    container_name: awms-backend
    restart: always
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: awms
      DB_PASSWORD: ${MYSQL_PASSWORD}
      DB_NAME: awms
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      - mysql
      - redis
    networks:
      - awms-network

  frontend:
    build: ./frontend
    container_name: awms-frontend
    restart: always
    ports:
      - "8081:80"
    depends_on:
      - backend
    networks:
      - awms-network

  mobile:
    build: ./mobile
    container_name: awms-mobile
    restart: always
    ports:
      - "3001:80"
    depends_on:
      - backend
    networks:
      - awms-network

volumes:
  mysql_data:
  redis_data:

networks:
  awms-network:
    driver: bridge
```

创建 `.env` 文件:

```bash
MYSQL_ROOT_PASSWORD=your-strong-root-password
MYSQL_PASSWORD=your-strong-password
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-jwt-secret-key
```

启动服务:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 微服务架构部署

### 1. 环境准备

```bash
# 安装 Java 11
sudo apt install openjdk-11-jdk

# 安装 Maven
sudo apt install maven

# 验证安装
java -version
mvn -version
```

### 2. 启动基础服务

```bash
cd awms-microservices/docker

# 启动基础设施
docker-compose -f docker-compose-infrastructure.yml up -d

# 等待服务启动
sleep 30

# 检查服务状态
docker-compose ps
```

### 3. 编译微服务

```bash
cd awms-microservices

# 使用构建脚本
chmod +x build.sh
./build.sh all prod

# 或手动编译
mvn clean install -DskipTests
```

### 4. 启动微服务

```bash
# 使用 Docker Compose
docker-compose up -d

# 或使用 Kubernetes
kubectl apply -f k8s/
```

### 5. 验证部署

```bash
# 检查服务注册
curl http://localhost:8848/nacos/v1/ns/instance/list?serviceName=auth-service

# 测试网关
curl http://localhost:8080/actuator/health

# 测试API
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📊 监控与维护

### 1. 日志管理

```bash
# PM2 日志
pm2 logs awms-backend

# Docker 日志
docker logs awms-backend

# 系统日志
sudo journalctl -u nginx
sudo journalctl -u mysql
```

### 2. 性能监控

```bash
# 系统监控
htop
iostat -x 1
netstat -tlnp

# 数据库监控
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# Redis 监控
redis-cli info stats
```

### 3. 备份策略

**数据库备份**:

```bash
#!/bin/bash
# 创建备份脚本 backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/awms"
mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u awms_prod -p awms_prod > $BACKUP_DIR/awms_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/awms_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: awms_$DATE.sql.gz"
```

**定时备份**:

```bash
# 添加到 crontab
sudo crontab -e

# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

### 4. 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建前端
cd frontend && npm run build
cd ../mobile && npm run build

# 重启后端服务
pm2 restart awms-backend

# 重新加载 Nginx
sudo nginx -s reload
```

## 🔍 故障排查

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查 MySQL 状态
sudo systemctl status mysql

# 检查端口占用
netstat -tlnp | grep 3306

# 检查配置文件
cat backend/config.js

# 测试连接
mysql -u awms -p awms
```

#### 2. 前端访问 404

```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查文件权限
ls -la /var/www/awms/frontend/dist/

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

#### 3. API 请求失败

```bash
# 检查后端服务
pm2 status
pm2 logs awms-backend

# 检查端口占用
netstat -tlnp | grep 3000

# 测试 API
curl http://localhost:3000/api/health
```

#### 4. 内存不足

```bash
# 检查内存使用
free -h
ps aux --sort=-%mem | head

# 优化 PM2 配置
pm2 restart awms-backend --max-memory-restart 1G
```

### 日志分析

```bash
# 后端错误日志
tail -f logs/backend-error.log

# Nginx 访问日志
tail -f /var/log/nginx/access.log

# 系统日志
sudo journalctl -f
```

### 性能优化

#### 数据库优化

```sql
-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- 分析查询
EXPLAIN SELECT * FROM users WHERE username = 'admin';

-- 添加索引
CREATE INDEX idx_username ON users(username);
```

#### 应用优化

```bash
# Node.js 内存优化
NODE_OPTIONS="--max-old-space-size=2048" npm start

# PM2 集群模式
pm2 start ecosystem.config.js --instances max
```

## 📞 技术支持

如遇到部署问题，请：

1. 查看相关日志文件
2. 检查系统资源使用情况
3. 参考故障排查章节
4. 提交 Issue 并附上详细错误信息

---

**注意**: 生产环境部署前请务必修改所有默认密码和密钥，确保系统安全。
