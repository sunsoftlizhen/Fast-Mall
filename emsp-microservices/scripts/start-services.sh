#!/bin/bash

echo "🚀 启动EMSP微服务集群..."

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker未运行，请先启动Docker${NC}"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose未安装${NC}"
    exit 1
fi

# 进入docker目录
cd "$(dirname "$0")/../docker"

echo -e "${BLUE}📋 启动基础设施服务...${NC}"
docker-compose up -d mysql redis eureka

echo -e "${YELLOW}⏳ 等待基础设施服务启动...${NC}"
sleep 30

echo -e "${BLUE}📋 启动业务服务...${NC}"
docker-compose up -d auth-service user-service product-service order-service moment-service

echo -e "${YELLOW}⏳ 等待业务服务启动...${NC}"
sleep 20

echo -e "${BLUE}📋 启动网关服务...${NC}"
docker-compose up -d gateway

echo -e "${GREEN}🎉 所有服务启动完成！${NC}"
echo ""
echo -e "${BLUE}📊 服务状态：${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}🔗 访问地址：${NC}"
echo -e "   API网关: http://localhost:8080"
echo -e "   Eureka注册中心: http://localhost:8761"
echo -e "   认证服务: http://localhost:8081"
echo -e "   用户服务: http://localhost:8082"
echo -e "   商品服务: http://localhost:8083"
echo -e "   订单服务: http://localhost:8084"
echo -e "   动态服务: http://localhost:8085"

echo ""
echo -e "${YELLOW}💡 使用 'docker-compose logs -f [service-name]' 查看日志${NC}"
echo -e "${YELLOW}💡 使用 'docker-compose down' 停止所有服务${NC}" 