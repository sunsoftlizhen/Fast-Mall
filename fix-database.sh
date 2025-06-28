#!/bin/bash

# AWMS 数据库问题一键修复脚本
# 适用于 macOS 和 Linux 系统

echo "🚀 AWMS 数据库问题一键修复脚本"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo -e "${BLUE}🔍 检测到操作系统: ${MACHINE}${NC}"
echo ""

# 1. 检查 MySQL 是否安装
echo -e "${BLUE}📋 步骤 1: 检查 MySQL 安装状态${NC}"
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✅ MySQL 已安装${NC}"
    mysql --version
else
    echo -e "${RED}❌ MySQL 未安装${NC}"
    echo -e "${YELLOW}💡 请先安装 MySQL:${NC}"
    if [ "$MACHINE" = "Mac" ]; then
        echo "   brew install mysql"
    elif [ "$MACHINE" = "Linux" ]; then
        echo "   sudo apt-get install mysql-server  # Ubuntu/Debian"
        echo "   sudo yum install mysql-server      # CentOS/RHEL"
    fi
    exit 1
fi
echo ""

# 2. 检查 MySQL 服务状态
echo -e "${BLUE}📋 步骤 2: 检查 MySQL 服务状态${NC}"
if pgrep mysql > /dev/null; then
    echo -e "${GREEN}✅ MySQL 服务正在运行${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL 服务未运行，尝试启动...${NC}"
    
    if [ "$MACHINE" = "Mac" ]; then
        if command -v brew &> /dev/null; then
            brew services start mysql
        else
            sudo /usr/local/mysql/support-files/mysql.server start
        fi
    elif [ "$MACHINE" = "Linux" ]; then
        if command -v systemctl &> /dev/null; then
            sudo systemctl start mysql
        else
            sudo service mysql start
        fi
    fi
    
    # 等待服务启动
    echo "等待 MySQL 服务启动..."
    sleep 3
    
    if pgrep mysql > /dev/null; then
        echo -e "${GREEN}✅ MySQL 服务启动成功${NC}"
    else
        echo -e "${RED}❌ MySQL 服务启动失败${NC}"
        echo -e "${YELLOW}💡 请手动启动 MySQL 服务${NC}"
        exit 1
    fi
fi
echo ""

# 3. 测试 MySQL 基础连接
echo -e "${BLUE}📋 步骤 3: 测试 MySQL 基础连接${NC}"
echo "请输入 MySQL root 用户密码（如果没有设置密码，直接按回车）:"
read -s mysql_password

# 测试连接
if [ -z "$mysql_password" ]; then
    # 无密码连接
    if mysql -u root -e "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ MySQL 连接成功（无密码）${NC}"
        MYSQL_CMD="mysql -u root"
    else
        echo -e "${RED}❌ MySQL 连接失败${NC}"
        echo -e "${YELLOW}💡 请检查 root 用户是否需要密码${NC}"
        exit 1
    fi
else
    # 带密码连接
    if mysql -u root -p"$mysql_password" -e "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ MySQL 连接成功（带密码）${NC}"
        MYSQL_CMD="mysql -u root -p$mysql_password"
    else
        echo -e "${RED}❌ MySQL 连接失败，密码可能不正确${NC}"
        exit 1
    fi
fi
echo ""

# 4. 检查并创建数据库
echo -e "${BLUE}📋 步骤 4: 检查并创建数据库${NC}"
if $MYSQL_CMD -e "USE emsp;" &> /dev/null; then
    echo -e "${GREEN}✅ 数据库 'emsp' 已存在${NC}"
else
    echo -e "${YELLOW}⚠️  数据库 'emsp' 不存在，正在创建...${NC}"
    $MYSQL_CMD -e "CREATE DATABASE emsp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库 'emsp' 创建成功${NC}"
    else
        echo -e "${RED}❌ 数据库创建失败${NC}"
        exit 1
    fi
fi
echo ""

# 5. 检查并导入数据表
echo -e "${BLUE}📋 步骤 5: 检查并导入数据表${NC}"
if $MYSQL_CMD -e "USE emsp; SHOW TABLES LIKE 'users';" | grep -q users; then
    echo -e "${GREEN}✅ 数据表已存在${NC}"
    
    # 检查用户数量
    user_count=$($MYSQL_CMD -e "USE emsp; SELECT COUNT(*) FROM users;" | tail -n 1)
    echo -e "${BLUE}📊 当前用户数量: ${user_count}${NC}"
else
    echo -e "${YELLOW}⚠️  数据表不存在，正在导入初始化脚本...${NC}"
    
    if [ -f "database/init.sql" ]; then
        $MYSQL_CMD emsp < database/init.sql
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 数据表导入成功${NC}"
            
            # 显示导入的用户
            echo -e "${BLUE}📋 默认用户账号:${NC}"
            $MYSQL_CMD -e "USE emsp; SELECT username, email, role_name FROM users u JOIN roles r ON u.role_id = r.id;" | column -t
        else
            echo -e "${RED}❌ 数据表导入失败${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ 找不到 database/init.sql 文件${NC}"
        exit 1
    fi
fi
echo ""

# 6. 运行连接测试
echo -e "${BLUE}📋 步骤 6: 运行连接测试${NC}"
if [ -f "backend/test-db-connection.js" ]; then
    cd backend
    
    # 设置环境变量
    export DB_HOST="localhost"
    export DB_USER="root"
    export DB_PASSWORD="$mysql_password"
    export DB_NAME="emsp"
    
    echo -e "${BLUE}🔍 运行数据库连接测试...${NC}"
    node test-db-connection.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库连接测试通过${NC}"
    else
        echo -e "${YELLOW}⚠️  测试脚本运行完成，请查看上述结果${NC}"
    fi
    
    cd ..
else
    echo -e "${YELLOW}⚠️  找不到测试脚本，跳过连接测试${NC}"
fi
echo ""

# 7. 生成配置文件
echo -e "${BLUE}📋 步骤 7: 生成配置文件${NC}"
if [ ! -f "backend/config.js" ]; then
    if [ -f "backend/config.example.js" ]; then
        cp backend/config.example.js backend/config.js
        echo -e "${GREEN}✅ 配置文件已生成: backend/config.js${NC}"
        echo -e "${YELLOW}💡 请根据需要修改配置文件中的数据库密码${NC}"
    else
        echo -e "${YELLOW}⚠️  配置模板文件不存在${NC}"
    fi
else
    echo -e "${GREEN}✅ 配置文件已存在${NC}"
fi
echo ""

# 8. 创建环境变量文件
echo -e "${BLUE}📋 步骤 8: 创建环境变量文件${NC}"
if [ ! -f ".env" ]; then
    cat > .env << EOF
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=$mysql_password
DB_NAME=emsp

# JWT 配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=3000
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ 环境变量文件已创建: .env${NC}"
else
    echo -e "${GREEN}✅ 环境变量文件已存在${NC}"
fi
echo ""

# 9. 最终检查
echo -e "${BLUE}📋 步骤 9: 最终检查${NC}"
echo -e "${GREEN}🎉 数据库修复完成！${NC}"
echo ""
echo -e "${BLUE}📋 系统信息摘要:${NC}"
echo -e "   💾 数据库: emsp"
echo -e "   👤 用户: root"
echo -e "   🔗 连接: localhost:3306"
echo -e "   📁 配置文件: backend/config.js"
echo -e "   🌐 环境变量: .env"
echo ""
echo -e "${BLUE}🚀 启动应用:${NC}"
echo -e "   chmod +x start.sh"
echo -e "   ./start.sh"
echo ""
echo -e "${BLUE}🔍 如果还有问题:${NC}"
echo -e "   1. 查看详细文档: database/troubleshooting.md"
echo -e "   2. 运行测试脚本: cd backend && node test-db-connection.js"
echo -e "   3. 检查 MySQL 错误日志"
echo ""
echo -e "${GREEN}✨ 修复脚本执行完成！${NC}" 