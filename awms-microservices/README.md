# AWMS 微服务架构后端系统

基于 Spring Boot + Spring Cloud 的微服务架构实现，提供完整的电商和社交功能。

## 系统架构

```
awms-microservices/
├── gateway/                 # API网关服务
├── auth-service/           # 认证授权服务
├── user-service/           # 用户管理服务
├── product-service/        # 商品管理服务
├── order-service/          # 订单管理服务
├── moment-service/         # 朋友圈服务
├── common/                 # 公共模块
├── config/                 # 配置中心
├── docker/                 # Docker部署文件
└── docs/                   # 文档
```

## 服务说明

| 服务名称        | 端口 | 描述               |
| --------------- | ---- | ------------------ |
| gateway         | 8080 | API 网关，统一入口 |
| auth-service    | 8081 | 认证授权服务       |
| user-service    | 8082 | 用户管理服务       |
| product-service | 8083 | 商品管理服务       |
| order-service   | 8084 | 订单管理服务       |
| moment-service  | 8085 | 朋友圈服务         |

## 技术栈

- **框架**: Spring Boot 2.7.x
- **微服务**: Spring Cloud 2021.x
- **服务注册**: Nacos
- **配置中心**: Nacos Config
- **API 网关**: Spring Cloud Gateway
- **负载均衡**: Spring Cloud LoadBalancer
- **熔断器**: Resilience4j
- **数据库**: MySQL 8.0
- **缓存**: Redis 6.x
- **消息队列**: RabbitMQ
- **认证**: JWT + Spring Security
- **API 文档**: Swagger/OpenAPI 3
- **监控**: Spring Boot Actuator + Micrometer
- **日志**: Logback + ELK Stack
- **容器化**: Docker + Docker Compose

## 快速开始

### 环境要求

- JDK 11+
- Maven 3.6+
- MySQL 8.0
- Redis 6.x
- Nacos 2.x
- Docker & Docker Compose (可选)

### 本地开发

1. 启动基础服务

```bash
# 启动MySQL、Redis、Nacos
docker-compose -f docker/docker-compose-dev.yml up -d

# 或者手动启动各个服务
```

2. 初始化数据库

```bash
# 执行数据库初始化脚本
mysql -u root -p < scripts/init-database.sql
```

3. 启动微服务

```bash
# 按顺序启动服务
cd auth-service && mvn spring-boot:run
cd user-service && mvn spring-boot:run
cd product-service && mvn spring-boot:run
cd order-service && mvn spring-boot:run
cd moment-service && mvn spring-boot:run
cd gateway && mvn spring-boot:run
```

### Docker 部署

```bash
# 构建所有服务镜像
docker-compose -f docker/docker-compose.yml build

# 启动所有服务
docker-compose -f docker/docker-compose.yml up -d
```

### Kubernetes 部署

```bash
# 应用Kubernetes配置
kubectl apply -f k8s/
```

## API 文档

启动服务后访问：

- 网关 Swagger UI: http://localhost:8080/swagger-ui.html
- 各服务 API 文档: http://localhost:{port}/swagger-ui.html

## 监控

- 服务监控: http://localhost:8080/actuator
- Nacos 控制台: http://localhost:8848/nacos

## 开发指南

详见 [开发指南](docs/development-guide.md)

## 部署指南

详见 [部署指南](docs/deployment-guide.md)

## 贡献指南

详见 [贡献指南](docs/contributing.md)

## 许可证

MIT License
