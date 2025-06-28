# EMSP 微服务部署指南

本文档详细介绍了 EMSP 微服务系统的部署方式，包括本地开发环境、Docker 容器化部署和 Kubernetes 集群部署。

## 目录

- [环境要求](#环境要求)
- [本地开发部署](#本地开发部署)
- [Docker 部署](#docker部署)
- [Kubernetes 部署](#kubernetes部署)
- [配置说明](#配置说明)
- [监控和日志](#监控和日志)
- [故障排查](#故障排查)

## 环境要求

### 基础环境

- **操作系统**: Linux/macOS/Windows
- **JDK**: 11 或更高版本
- **Maven**: 3.6+ 或 Gradle 7+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Kubernetes**: 1.20+ (可选)

### 基础设施组件

- **MySQL**: 8.0+
- **Redis**: 6.0+
- **Nacos**: 2.2+
- **RabbitMQ**: 3.11+ (可选)

## 本地开发部署

### 1. 环境准备

#### 安装基础软件

```bash
# 安装JDK 11
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk

# CentOS/RHEL
sudo yum install java-11-openjdk-devel

# macOS
brew install openjdk@11

# 安装Maven
# Ubuntu/Debian
sudo apt install maven

# CentOS/RHEL
sudo yum install maven

# macOS
brew install maven
```

#### 启动基础服务

```bash
# 方式1: 使用Docker启动基础服务
cd docker
docker-compose -f docker-compose-dev.yml up -d mysql redis nacos

# 方式2: 手动安装和启动
# MySQL
sudo systemctl start mysql

# Redis
sudo systemctl start redis

# Nacos (下载并启动)
wget https://github.com/alibaba/nacos/releases/download/2.2.3/nacos-server-2.2.3.tar.gz
tar -xzf nacos-server-2.2.3.tar.gz
cd nacos/bin
./startup.sh -m standalone
```

### 2. 数据库初始化

```bash
# 连接MySQL并创建数据库
mysql -u root -p

# 创建数据库和用户
CREATE DATABASE emsp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE nacos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'emsp'@'%' IDENTIFIED BY 'emsp123456';
GRANT ALL PRIVILEGES ON emsp.* TO 'emsp'@'%';
GRANT ALL PRIVILEGES ON nacos.* TO 'emsp'@'%';
FLUSH PRIVILEGES;

# 导入初始化脚本
mysql -u emsp -p emsp < scripts/init-database.sql
mysql -u emsp -p nacos < scripts/nacos-mysql.sql
```

### 3. 配置 Nacos

访问 http://localhost:8848/nacos (用户名/密码: nacos/nacos)

#### 创建命名空间

- 开发环境: `dev`
- 测试环境: `test`
- 生产环境: `prod`

#### 导入配置

在对应命名空间中创建以下配置文件：

1. **公共配置** (`common.yml`)
2. **数据库配置** (`datasource.yml`)
3. **Redis 配置** (`redis.yml`)
4. **各服务配置** (如 `auth-service.yml`)

### 4. 编译和启动服务

```bash
# 编译公共模块
cd common
mvn clean install

# 按顺序启动服务
# 1. 认证服务
cd ../auth-service
mvn spring-boot:run

# 2. 用户服务
cd ../user-service
mvn spring-boot:run

# 3. 商品服务
cd ../product-service
mvn spring-boot:run

# 4. 订单服务
cd ../order-service
mvn spring-boot:run

# 5. 朋友圈服务
cd ../moment-service
mvn spring-boot:run

# 6. API网关
cd ../gateway
mvn spring-boot:run
```

### 5. 验证部署

```bash
# 检查服务注册情况
curl http://localhost:8848/nacos/v1/ns/instance/list?serviceName=auth-service

# 测试网关
curl http://localhost:8080/actuator/health

# 测试认证服务
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Docker 部署

### 1. 构建镜像

```bash
# 构建公共模块
cd common
mvn clean install

# 构建所有服务镜像
docker-compose -f docker/docker-compose.yml build

# 或者单独构建
cd auth-service
docker build -t emsp/auth-service:1.0.0 .
```

### 2. 启动服务

```bash
# 启动所有服务
cd docker
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f auth-service
```

### 3. 服务配置

#### Dockerfile 示例 (auth-service)

```dockerfile
FROM openjdk:11-jre-slim

LABEL maintainer="emsp-team"

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用目录
WORKDIR /app

# 复制jar包
COPY target/auth-service-1.0.0.jar app.jar

# 暴露端口
EXPOSE 8081

# 启动应用
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

### 4. 环境变量配置

```bash
# .env文件
MYSQL_ROOT_PASSWORD=emsp123456
MYSQL_DATABASE=emsp
MYSQL_USER=emsp
MYSQL_PASSWORD=emsp123456

REDIS_PASSWORD=emsp123456

NACOS_USERNAME=nacos
NACOS_PASSWORD=nacos

RABBITMQ_USER=emsp
RABBITMQ_PASSWORD=emsp123456
```

## Kubernetes 部署

### 1. 准备工作

```bash
# 创建命名空间
kubectl create namespace emsp

# 创建配置映射
kubectl create configmap emsp-config \
  --from-file=config/ \
  --namespace=emsp

# 创建密钥
kubectl create secret generic emsp-secret \
  --from-literal=mysql-password=emsp123456 \
  --from-literal=redis-password=emsp123456 \
  --namespace=emsp
```

### 2. 部署基础服务

#### MySQL 部署

```yaml
# k8s/mysql-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: awms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: awms-secret
                  key: mysql-password
            - name: MYSQL_DATABASE
              value: awms
          ports:
            - containerPort: 3306
          volumeMounts:
            - name: mysql-storage
              mountPath: /var/lib/mysql
      volumes:
        - name: mysql-storage
          persistentVolumeClaim:
            claimName: mysql-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: awms
spec:
  selector:
    app: mysql
  ports:
    - port: 3306
      targetPort: 3306
```

### 3. 部署微服务

```bash
# 应用所有配置
kubectl apply -f k8s/

# 查看部署状态
kubectl get pods -n awms

# 查看服务
kubectl get svc -n awms

# 查看日志
kubectl logs -f deployment/auth-service -n awms
```

### 4. 配置 Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: awms-ingress
  namespace: awms
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: api.awms.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: gateway
                port:
                  number: 8080
```

## 配置说明

### 应用配置文件

#### bootstrap.yml

```yaml
spring:
  application:
    name: auth-service
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
        namespace: ${NACOS_NAMESPACE:dev}
      config:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
        namespace: ${NACOS_NAMESPACE:dev}
        file-extension: yml
        shared-configs:
          - data-id: common.yml
            refresh: true
          - data-id: datasource.yml
            refresh: true
          - data-id: redis.yml
            refresh: true
```

#### application.yml

```yaml
server:
  port: 8081

management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    health:
      show-details: always

logging:
  level:
    com.awms: debug
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

### Nacos 配置中心

#### common.yml

```yaml
# 公共配置
spring:
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: GMT+8
    default-property-inclusion: non_null

# MyBatis Plus配置
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

# JWT配置
jwt:
  secret: awms-secret-key-2024
  expiration: 86400000
```

#### datasource.yml

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://${MYSQL_HOST:localhost}:${MYSQL_PORT:3306}/${MYSQL_DATABASE:awms}?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: ${MYSQL_USER:awms}
    password: ${MYSQL_PASSWORD:awms123456}
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      idle-timeout: 300000
      connection-timeout: 20000
      max-lifetime: 1200000
```

#### redis.yml

```yaml
spring:
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:awms123456}
    database: 0
    timeout: 5000
    lettuce:
      pool:
        max-active: 20
        max-wait: -1
        max-idle: 8
        min-idle: 0
```

## 监控和日志

### 1. 应用监控

#### Spring Boot Actuator

访问监控端点：

- 健康检查: http://localhost:8080/actuator/health
- 指标信息: http://localhost:8080/actuator/metrics
- 环境信息: http://localhost:8080/actuator/env

#### Prometheus + Grafana

```yaml
# docker-compose-monitoring.yml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
```

### 2. 日志管理

#### ELK Stack

```yaml
# docker-compose-elk.yml
version: "3.8"

services:
  elasticsearch:
    image: elasticsearch:7.17.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"

  logstash:
    image: logstash:7.17.0
    container_name: logstash
    volumes:
      - ./elk/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"

  kibana:
    image: kibana:7.17.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
```

## 故障排查

### 1. 常见问题

#### 服务启动失败

```bash
# 查看日志
docker logs awms-auth-service

# 检查配置
kubectl describe pod auth-service-xxx -n awms

# 检查网络连接
kubectl exec -it auth-service-xxx -n awms -- ping mysql
```

#### 服务注册失败

```bash
# 检查Nacos连接
curl http://localhost:8848/nacos/v1/ns/operator/metrics

# 查看服务列表
curl http://localhost:8848/nacos/v1/ns/instance/list?serviceName=auth-service
```

#### 数据库连接问题

```bash
# 测试数据库连接
mysql -h localhost -u awms -p awms

# 检查数据库状态
kubectl exec -it mysql-xxx -n awms -- mysql -u root -p -e "SHOW PROCESSLIST;"
```

### 2. 性能调优

#### JVM 参数优化

```bash
# 生产环境JVM参数
JAVA_OPTS="-Xms2g -Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -Xloggc:/app/logs/gc.log"
```

#### 数据库优化

```sql
-- MySQL配置优化
SET GLOBAL innodb_buffer_pool_size = 1073741824;  -- 1GB
SET GLOBAL max_connections = 1000;
SET GLOBAL query_cache_size = 268435456;  -- 256MB
```

### 3. 备份和恢复

#### 数据库备份

```bash
# 备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mysql"
mkdir -p $BACKUP_DIR

mysqldump -h localhost -u awms -p awms > $BACKUP_DIR/awms_$DATE.sql
gzip $BACKUP_DIR/awms_$DATE.sql

# 保留最近7天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

#### 应用备份

```bash
# 备份配置
kubectl get configmap awms-config -n awms -o yaml > backup/configmap.yaml
kubectl get secret awms-secret -n awms -o yaml > backup/secret.yaml

# 备份部署配置
kubectl get deployment -n awms -o yaml > backup/deployments.yaml
```

## 安全配置

### 1. 网络安全

```yaml
# 网络策略示例
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: awms-network-policy
  namespace: awms
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: awms
```

### 2. 访问控制

```yaml
# RBAC配置
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: awms
  name: awms-role
rules:
  - apiGroups: [""]
    resources: ["pods", "services"]
    verbs: ["get", "list", "watch"]
```

## 扩展和升级

### 1. 水平扩展

```bash
# 扩展服务实例
kubectl scale deployment auth-service --replicas=3 -n awms

# 自动扩展
kubectl autoscale deployment auth-service --cpu-percent=70 --min=2 --max=10 -n awms
```

### 2. 滚动更新

```bash
# 更新镜像
kubectl set image deployment/auth-service auth-service=awms/auth-service:1.1.0 -n awms

# 查看更新状态
kubectl rollout status deployment/auth-service -n awms

# 回滚
kubectl rollout undo deployment/auth-service -n awms
```

---

如有问题，请参考 [故障排查指南](troubleshooting.md) 或联系运维团队。
