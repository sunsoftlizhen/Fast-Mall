# EMSP 微服务架构

EMSP (E-commerce & Moments Social Platform) 微服务架构，基于 Spring Boot + Spring Cloud 构建。

## 🏗️ 架构概述

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Mobile App     │    │  Admin Panel    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │      API Gateway            │
                    │     (Port: 8080)            │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼─────────┐ ┌───────▼───────┐ ┌─────────▼─────────┐
    │   Auth Service    │ │  User Service │ │ Product Service   │
    │   (Port: 8081)    │ │ (Port: 8082)  │ │  (Port: 8083)     │
    └───────────────────┘ └───────────────┘ └───────────────────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼─────────┐ ┌───────▼───────┐ ┌─────────▼─────────┐
    │  Order Service    │ │ Moment Service│ │   Eureka Server   │
    │  (Port: 8084)     │ │ (Port: 8085)  │ │  (Port: 8761)     │
    └───────────────────┘ └───────────────┘ └───────────────────┘
              │                   │
              └───────────────────┼───────────────────┐
                                  │                   │
                    ┌─────────────▼─────────┐ ┌───────▼───────┐
                    │      MySQL            │ │     Redis     │
                    │    (Port: 3306)       │ │ (Port: 6379)  │
                    └───────────────────────┘ └───────────────┘
```

## 📦 服务清单

| 服务名称        | 端口 | 描述         | 技术栈               |
| --------------- | ---- | ------------ | -------------------- |
| gateway         | 8080 | API 网关     | Spring Cloud Gateway |
| eureka          | 8761 | 服务注册中心 | Spring Cloud Eureka  |
| auth-service    | 8081 | 认证授权服务 | Spring Boot + JWT    |
| user-service    | 8082 | 用户管理服务 | Spring Boot + JPA    |
| product-service | 8083 | 商品管理服务 | Spring Boot + JPA    |
| order-service   | 8084 | 订单管理服务 | Spring Boot + JPA    |
| moment-service  | 8085 | 动态社交服务 | Spring Boot + JPA    |

## 🚀 快速开始

### 前置要求

- Java 11+
- Maven 3.6+
- Docker & Docker Compose
- MySQL 8.0+

### 1. 构建所有服务

```bash
cd emsp-microservices
./scripts/build-all.sh
```

### 2. 启动服务集群

```bash
./scripts/start-services.sh
```

### 3. 验证服务状态

```bash
# 查看所有服务状态
docker-compose ps

# 查看Eureka注册中心
open http://localhost:8761

# 测试API网关
curl http://localhost:8080/actuator/health
```

## 🛠️ 开发指南

### 本地开发环境

```bash
# 启动基础设施
docker-compose up -d mysql redis eureka

# 启动单个服务（以认证服务为例）
cd auth-service
mvn spring-boot:run
```

### 服务配置

每个服务支持以下配置文件：

- `application.yml` - 默认配置
- `application-dev.yml` - 开发环境
- `application-docker.yml` - Docker 环境
- `application-prod.yml` - 生产环境

### API 文档

各服务启动后可访问 Swagger 文档：

- 认证服务: http://localhost:8081/swagger-ui.html
- 用户服务: http://localhost:8082/swagger-ui.html
- 商品服务: http://localhost:8083/swagger-ui.html
- 订单服务: http://localhost:8084/swagger-ui.html
- 动态服务: http://localhost:8085/swagger-ui.html

## 🔧 技术栈

### 核心框架

- **Spring Boot 2.7.0** - 微服务框架
- **Spring Cloud 2021.0.3** - 微服务治理
- **Spring Cloud Gateway** - API 网关
- **Spring Cloud Eureka** - 服务注册发现
- **Spring Data JPA** - 数据访问层
- **Spring Security** - 安全框架

### 数据存储

- **MySQL 8.0** - 关系型数据库
- **Redis 7** - 缓存数据库

### 工具库

- **Lombok** - 简化代码
- **JWT** - 令牌认证
- **Maven** - 项目构建

## 📊 监控运维

### 健康检查

```bash
# 检查所有服务健康状态
curl http://localhost:8080/actuator/health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health
```

### 日志查看

```bash
# 查看特定服务日志
docker-compose logs -f auth-service

# 查看所有服务日志
docker-compose logs -f
```

### 服务扩容

```bash
# 扩容用户服务到3个实例
docker-compose up -d --scale user-service=3
```

## 🚀 部署指南

### Docker 部署

```bash
# 构建并启动所有服务
./scripts/build-all.sh
./scripts/start-services.sh

# 停止所有服务
docker-compose down
```

### 生产环境部署

1. 修改生产环境配置文件
2. 构建生产镜像
3. 使用 Kubernetes 或 Docker Swarm 部署
4. 配置负载均衡和监控

## 🔐 安全配置

### JWT 配置

- 密钥: 在生产环境中请修改`jwt.secret`
- 过期时间: 默认 24 小时
- 刷新机制: 支持令牌刷新

### 数据库安全

- 使用专用数据库用户
- 启用 SSL 连接
- 定期备份数据

## 📈 性能优化

### 缓存策略

- Redis 缓存热点数据
- 数据库连接池优化
- JVM 参数调优

### 监控指标

- 服务响应时间
- 数据库连接数
- 内存使用率
- CPU 使用率

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 创建 Pull Request

## �� 许可证

MIT License
