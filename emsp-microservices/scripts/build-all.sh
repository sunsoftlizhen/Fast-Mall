#!/bin/bash

echo "🚀 开始构建EMSP微服务..."

# 设置变量
SERVICES=("common" "auth-service" "user-service" "product-service" "order-service" "moment-service" "gateway")
BASE_DIR=$(dirname "$0")/..

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 构建公共模块
echo -e "${YELLOW}📦 构建公共模块...${NC}"
cd "$BASE_DIR/common"
if mvn clean install -DskipTests; then
    echo -e "${GREEN}✅ 公共模块构建成功${NC}"
else
    echo -e "${RED}❌ 公共模块构建失败${NC}"
    exit 1
fi

# 构建各个服务
for service in "${SERVICES[@]:1}"; do
    echo -e "${YELLOW}📦 构建 $service...${NC}"
    cd "$BASE_DIR/$service"
    
    if mvn clean package -DskipTests; then
        echo -e "${GREEN}✅ $service 构建成功${NC}"
    else
        echo -e "${RED}❌ $service 构建失败${NC}"
        exit 1
    fi
done

echo -e "${GREEN}🎉 所有服务构建完成！${NC}"

# 构建Docker镜像
echo -e "${YELLOW}🐳 构建Docker镜像...${NC}"
cd "$BASE_DIR"

for service in "${SERVICES[@]:1}"; do
    echo -e "${YELLOW}🔨 构建 $service 镜像...${NC}"
    cd "$service"
    
    if docker build -t "emsp/$service:latest" .; then
        echo -e "${GREEN}✅ $service 镜像构建成功${NC}"
    else
        echo -e "${RED}❌ $service 镜像构建失败${NC}"
        exit 1
    fi
    
    cd ..
done

echo -e "${GREEN}🎉 所有Docker镜像构建完成！${NC}"
echo -e "${YELLOW}💡 使用 'docker-compose up -d' 启动所有服务${NC}" 