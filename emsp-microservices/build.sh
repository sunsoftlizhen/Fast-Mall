#!/bin/bash

# EMSP微服务自动化构建脚本
# 使用方法: ./build.sh [all|service-name] [dev|test|prod]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
VERSION="1.0.0"
REGISTRY="registry.cn-hangzhou.aliyuncs.com/emsp"
SERVICES=("auth-service" "user-service" "product-service" "order-service" "moment-service" "gateway")

# 函数定义
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查构建环境..."
    
    # 检查Java
    if ! command -v java &> /dev/null; then
        log_error "Java未安装或未配置到PATH"
        exit 1
    fi
    
    # 检查Maven
    if ! command -v mvn &> /dev/null; then
        log_error "Maven未安装或未配置到PATH"
        exit 1
    fi
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装或未配置到PATH"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 编译公共模块
build_common() {
    log_info "编译公共模块..."
    cd common
    mvn clean install -DskipTests
    cd ..
    log_success "公共模块编译完成"
}

# 编译单个服务
build_service() {
    local service=$1
    local env=${2:-dev}
    
    log_info "编译服务: $service (环境: $env)"
    
    if [ ! -d "$service" ]; then
        log_error "服务目录不存在: $service"
        return 1
    fi
    
    cd $service
    
    # Maven编译
    mvn clean package -DskipTests -Dspring.profiles.active=$env
    
    # 构建Docker镜像
    if [ -f "Dockerfile" ]; then
        log_info "构建Docker镜像: $service"
        docker build -t $REGISTRY/$service:$VERSION .
        docker tag $REGISTRY/$service:$VERSION $REGISTRY/$service:latest
        log_success "Docker镜像构建完成: $service"
    else
        log_warning "Dockerfile不存在，跳过镜像构建: $service"
    fi
    
    cd ..
    log_success "服务编译完成: $service"
}

# 推送镜像
push_images() {
    local service=$1
    
    log_info "推送镜像: $service"
    
    docker push $REGISTRY/$service:$VERSION
    docker push $REGISTRY/$service:latest
    
    log_success "镜像推送完成: $service"
}

# 创建Dockerfile
create_dockerfile() {
    local service=$1
    
    if [ ! -f "$service/Dockerfile" ]; then
        log_info "创建Dockerfile: $service"
        cat > $service/Dockerfile << EOF
FROM openjdk:11-jre-slim

LABEL maintainer="emsp-team"
LABEL version="$VERSION"
LABEL description="EMSP $service"

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/\$TZ /etc/localtime && echo \$TZ > /etc/timezone

# 安装必要工具
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 创建应用目录
WORKDIR /app

# 创建日志目录
RUN mkdir -p /app/logs

# 复制jar包
COPY target/$service-$VERSION.jar app.jar

# 暴露端口
EXPOSE 808\${service: -1}

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \\
  CMD curl -f http://localhost:808\${service: -1}/actuator/health || exit 1

# JVM参数
ENV JAVA_OPTS="-Xms512m -Xmx1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# 启动应用
ENTRYPOINT ["sh", "-c", "java \$JAVA_OPTS -jar /app/app.jar"]
EOF
        log_success "Dockerfile创建完成: $service"
    fi
}

# 生成Kubernetes配置
generate_k8s_config() {
    local service=$1
    local port=${service: -1}
    port="808$port"
    
    log_info "生成Kubernetes配置: $service"
    
    mkdir -p k8s
    
    cat > k8s/$service-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $service
  namespace: emsp
  labels:
    app: $service
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: $service
      version: v1
  template:
    metadata:
      labels:
        app: $service
        version: v1
    spec:
      containers:
      - name: $service
        image: $REGISTRY/$service:$VERSION
        ports:
        - containerPort: $port
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "k8s"
        - name: NACOS_SERVER_ADDR
          value: "nacos:8848"
        - name: MYSQL_HOST
          value: "mysql"
        - name: REDIS_HOST
          value: "redis"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /actuator/health
            port: $port
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: $port
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: $service
  namespace: emsp
  labels:
    app: $service
spec:
  selector:
    app: $service
  ports:
  - port: $port
    targetPort: $port
    name: http
  type: ClusterIP
EOF
    
    log_success "Kubernetes配置生成完成: $service"
}

# 部署到Kubernetes
deploy_to_k8s() {
    local service=$1
    
    log_info "部署到Kubernetes: $service"
    
    if [ ! -f "k8s/$service-deployment.yaml" ]; then
        generate_k8s_config $service
    fi
    
    kubectl apply -f k8s/$service-deployment.yaml
    
    log_success "部署完成: $service"
}

# 清理资源
cleanup() {
    log_info "清理构建资源..."
    
    # 清理Maven缓存
    find . -name "target" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理Docker悬空镜像
    docker image prune -f
    
    log_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "EMSP微服务构建脚本"
    echo ""
    echo "用法:"
    echo "  $0 [命令] [服务名] [环境]"
    echo ""
    echo "命令:"
    echo "  build     - 构建服务"
    echo "  push      - 推送镜像"
    echo "  deploy    - 部署到Kubernetes"
    echo "  cleanup   - 清理资源"
    echo "  help      - 显示帮助"
    echo ""
    echo "服务名:"
    echo "  all                - 所有服务"
    echo "  auth-service       - 认证服务"
    echo "  user-service       - 用户服务"
    echo "  product-service    - 商品服务"
    echo "  order-service      - 订单服务"
    echo "  moment-service     - 朋友圈服务"
    echo "  gateway           - API网关"
    echo ""
    echo "环境:"
    echo "  dev       - 开发环境 (默认)"
    echo "  test      - 测试环境"
    echo "  prod      - 生产环境"
    echo ""
    echo "示例:"
    echo "  $0 build all dev              # 构建所有服务(开发环境)"
    echo "  $0 build auth-service prod    # 构建认证服务(生产环境)"
    echo "  $0 push auth-service          # 推送认证服务镜像"
    echo "  $0 deploy gateway             # 部署网关到Kubernetes"
}

# 主函数
main() {
    local command=${1:-help}
    local service=${2:-all}
    local env=${3:-dev}
    
    case $command in
        "build")
            check_environment
            build_common
            
            if [ "$service" = "all" ]; then
                for svc in "${SERVICES[@]}"; do
                    create_dockerfile $svc
                    build_service $svc $env
                done
            else
                create_dockerfile $service
                build_service $service $env
            fi
            ;;
        "push")
            if [ "$service" = "all" ]; then
                for svc in "${SERVICES[@]}"; do
                    push_images $svc
                done
            else
                push_images $service
            fi
            ;;
        "deploy")
            if [ "$service" = "all" ]; then
                for svc in "${SERVICES[@]}"; do
                    deploy_to_k8s $svc
                done
            else
                deploy_to_k8s $service
            fi
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@" 