#!/bin/bash

# EMSP 数据库名称迁移脚本
# 将现有的 awms 数据库迁移到新的 emsp 数据库

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 脚本信息
echo -e "${PURPLE}🔄 EMSP 数据库名称迁移脚本${NC}"
echo -e "${PURPLE}=================================${NC}"
echo ""
echo -e "${BLUE}📋 此脚本将执行以下操作：${NC}"
echo -e "   1. 检查现有 awms 数据库"
echo -e "   2. 备份 awms 数据库"
echo -e "   3. 创建新的 emsp 数据库"
echo -e "   4. 迁移数据到 emsp 数据库"
echo -e "   5. 验证数据迁移"
echo -e "   6. 可选：删除旧的 awms 数据库"
echo ""

# 检查操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo -e "${BLUE}🔍 检测到操作系统: ${MACHINE}${NC}"
echo ""

# 检查 MySQL 是否安装
echo -e "${BLUE}📋 步骤 1: 检查 MySQL 环境${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL 未安装或未添加到 PATH${NC}"
    echo -e "${YELLOW}💡 请先安装 MySQL${NC}"
    exit 1
fi

if ! command -v mysqldump &> /dev/null; then
    echo -e "${RED}❌ mysqldump 未找到${NC}"
    echo -e "${YELLOW}💡 请确保 MySQL 完整安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MySQL 环境检查通过${NC}"
mysql --version
echo ""

# 检查 MySQL 服务状态
echo -e "${BLUE}📋 步骤 2: 检查 MySQL 服务状态${NC}"
if ! pgrep mysql > /dev/null; then
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
    
    sleep 3
    
    if ! pgrep mysql > /dev/null; then
        echo -e "${RED}❌ MySQL 服务启动失败${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ MySQL 服务正在运行${NC}"
echo ""

# 获取 MySQL 认证信息
echo -e "${BLUE}📋 步骤 3: 配置数据库连接${NC}"
echo -n "请输入 MySQL root 用户密码 (如无密码直接按回车): "
read -s mysql_password
echo ""

# 测试连接
if [ -z "$mysql_password" ]; then
    MYSQL_CMD="mysql -u root"
    MYSQLDUMP_CMD="mysqldump -u root"
else
    MYSQL_CMD="mysql -u root -p$mysql_password"
    MYSQLDUMP_CMD="mysqldump -u root -p$mysql_password"
fi

# 验证连接
if ! $MYSQL_CMD -e "SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ MySQL 连接失败，请检查密码${NC}"
    exit 1
fi

echo -e "${GREEN}✅ MySQL 连接成功${NC}"
echo ""

# 检查源数据库是否存在
echo -e "${BLUE}📋 步骤 4: 检查源数据库 (awms)${NC}"
if ! $MYSQL_CMD -e "USE awms;" &> /dev/null; then
    echo -e "${YELLOW}⚠️  源数据库 'awms' 不存在${NC}"
    echo -e "${BLUE}💡 可能的原因：${NC}"
    echo -e "   - 数据库已经是 emsp 名称"
    echo -e "   - 数据库从未创建"
    echo -e "   - 数据库名称不同"
    echo ""
    echo -e "${BLUE}📋 当前存在的数据库：${NC}"
    $MYSQL_CMD -e "SHOW DATABASES;" | grep -E "(awms|emsp)" || echo "   未找到相关数据库"
    echo ""
    
    read -p "是否继续检查 emsp 数据库? (y/n): " continue_check
    if [[ $continue_check =~ ^[Yy]$ ]]; then
        if $MYSQL_CMD -e "USE emsp;" &> /dev/null; then
            echo -e "${GREEN}✅ emsp 数据库已存在，无需迁移${NC}"
            
            # 显示数据库信息
            echo -e "${BLUE}📊 emsp 数据库信息：${NC}"
            table_count=$($MYSQL_CMD -e "USE emsp; SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'emsp';" | tail -n 1)
            echo -e "   数据表数量: ${table_count}"
            
            if $MYSQL_CMD -e "USE emsp; SHOW TABLES LIKE 'users';" | grep -q users; then
                user_count=$($MYSQL_CMD -e "USE emsp; SELECT COUNT(*) FROM users;" | tail -n 1)
                echo -e "   用户数量: ${user_count}"
            fi
            
            echo -e "${GREEN}🎉 数据库已经是正确的名称 (emsp)${NC}"
            exit 0
        else
            echo -e "${YELLOW}⚠️  emsp 数据库也不存在${NC}"
            echo -e "${BLUE}💡 建议运行初始化脚本创建数据库${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi

echo -e "${GREEN}✅ 找到源数据库 'awms'${NC}"

# 显示源数据库信息
echo -e "${BLUE}📊 awms 数据库信息：${NC}"
table_count=$($MYSQL_CMD -e "USE awms; SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'awms';" | tail -n 1)
echo -e "   数据表数量: ${table_count}"

if $MYSQL_CMD -e "USE awms; SHOW TABLES LIKE 'users';" | grep -q users; then
    user_count=$($MYSQL_CMD -e "USE awms; SELECT COUNT(*) FROM users;" | tail -n 1)
    echo -e "   用户数量: ${user_count}"
fi

db_size=$($MYSQL_CMD -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='awms';" | tail -n 1)
echo -e "   数据库大小: ${db_size} MB"
echo ""

# 确认迁移
echo -e "${YELLOW}⚠️  重要提醒：${NC}"
echo -e "   - 此操作将创建数据库备份"
echo -e "   - 原数据库在确认后可以保留或删除"
echo -e "   - 建议在非生产环境先测试"
echo ""

read -p "确认开始迁移? (y/n): " confirm_migration
if [[ ! $confirm_migration =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 用户取消迁移${NC}"
    exit 0
fi

echo ""

# 创建备份目录
echo -e "${BLUE}📋 步骤 5: 创建备份${NC}"
BACKUP_DIR="./database_backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/awms_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}🔄 正在备份 awms 数据库...${NC}"
if $MYSQLDUMP_CMD --single-transaction --routines --triggers awms > "$BACKUP_FILE"; then
    echo -e "${GREEN}✅ 数据库备份成功${NC}"
    echo -e "   备份文件: $BACKUP_FILE"
    
    # 显示备份文件大小
    if [ -f "$BACKUP_FILE" ]; then
        backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "   备份大小: $backup_size"
    fi
else
    echo -e "${RED}❌ 数据库备份失败${NC}"
    exit 1
fi
echo ""

# 检查目标数据库
echo -e "${BLUE}📋 步骤 6: 检查目标数据库 (emsp)${NC}"
if $MYSQL_CMD -e "USE emsp;" &> /dev/null; then
    echo -e "${YELLOW}⚠️  目标数据库 'emsp' 已存在${NC}"
    
    # 显示现有数据
    existing_tables=$($MYSQL_CMD -e "USE emsp; SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'emsp';" | tail -n 1)
    echo -e "   现有数据表数量: ${existing_tables}"
    
    if [ "$existing_tables" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  目标数据库包含数据，继续将覆盖现有数据${NC}"
        read -p "确认覆盖现有 emsp 数据库? (y/n): " confirm_overwrite
        if [[ ! $confirm_overwrite =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}❌ 用户取消覆盖${NC}"
            exit 0
        fi
        
        # 备份现有的 emsp 数据库
        echo -e "${BLUE}🔄 备份现有的 emsp 数据库...${NC}"
        EMSP_BACKUP_FILE="$BACKUP_DIR/emsp_existing_backup_$TIMESTAMP.sql"
        $MYSQLDUMP_CMD --single-transaction --routines --triggers emsp > "$EMSP_BACKUP_FILE"
        echo -e "${GREEN}✅ 现有 emsp 数据库已备份到: $EMSP_BACKUP_FILE${NC}"
    fi
else
    echo -e "${BLUE}🔄 创建目标数据库 'emsp'...${NC}"
    $MYSQL_CMD -e "CREATE DATABASE emsp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo -e "${GREEN}✅ 目标数据库 'emsp' 创建成功${NC}"
fi
echo ""

# 执行数据迁移
echo -e "${BLUE}📋 步骤 7: 执行数据迁移${NC}"
echo -e "${BLUE}🔄 正在将数据导入到 emsp 数据库...${NC}"

if $MYSQL_CMD emsp < "$BACKUP_FILE"; then
    echo -e "${GREEN}✅ 数据迁移成功${NC}"
else
    echo -e "${RED}❌ 数据迁移失败${NC}"
    exit 1
fi
echo ""

# 验证迁移结果
echo -e "${BLUE}📋 步骤 8: 验证迁移结果${NC}"

# 比较表数量
awms_tables=$($MYSQL_CMD -e "USE awms; SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'awms';" | tail -n 1)
emsp_tables=$($MYSQL_CMD -e "USE emsp; SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'emsp';" | tail -n 1)

echo -e "${BLUE}📊 数据库对比：${NC}"
echo -e "   awms 数据表数量: ${awms_tables}"
echo -e "   emsp 数据表数量: ${emsp_tables}"

if [ "$awms_tables" -eq "$emsp_tables" ]; then
    echo -e "${GREEN}✅ 数据表数量匹配${NC}"
else
    echo -e "${YELLOW}⚠️  数据表数量不匹配${NC}"
fi

# 比较用户数量（如果存在用户表）
if $MYSQL_CMD -e "USE awms; SHOW TABLES LIKE 'users';" | grep -q users; then
    awms_users=$($MYSQL_CMD -e "USE awms; SELECT COUNT(*) FROM users;" | tail -n 1)
    emsp_users=$($MYSQL_CMD -e "USE emsp; SELECT COUNT(*) FROM users;" | tail -n 1)
    
    echo -e "   awms 用户数量: ${awms_users}"
    echo -e "   emsp 用户数量: ${emsp_users}"
    
    if [ "$awms_users" -eq "$emsp_users" ]; then
        echo -e "${GREEN}✅ 用户数据匹配${NC}"
    else
        echo -e "${YELLOW}⚠️  用户数据不匹配${NC}"
    fi
fi

# 测试新数据库连接
echo -e "${BLUE}🔄 测试新数据库连接...${NC}"
if $MYSQL_CMD -e "USE emsp; SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✅ emsp 数据库连接正常${NC}"
else
    echo -e "${RED}❌ emsp 数据库连接失败${NC}"
fi
echo ""

# 更新配置文件建议
echo -e "${BLUE}📋 步骤 9: 配置文件更新建议${NC}"
echo -e "${YELLOW}💡 请手动更新以下配置文件中的数据库名称：${NC}"
echo -e "   1. backend/config.js - 将 database: 'awms' 改为 'emsp'"
echo -e "   2. .env 文件 - 将 DB_NAME=awms 改为 DB_NAME=emsp"
echo -e "   3. Docker 配置文件中的数据库名称"
echo ""

# 生成配置更新脚本
CONFIG_UPDATE_SCRIPT="update-config-files.sh"
cat > "$CONFIG_UPDATE_SCRIPT" << 'EOF'
#!/bin/bash
echo "🔧 更新配置文件中的数据库名称..."

# 更新 backend/config.js
if [ -f "backend/config.js" ]; then
    sed -i.bak 's/database: "awms"/database: "emsp"/g' backend/config.js
    sed -i.bak 's/database: '\''awms'\''/database: '\''emsp'\''/g' backend/config.js
    echo "✅ 已更新 backend/config.js"
else
    echo "⚠️  backend/config.js 不存在"
fi

# 更新 .env 文件
if [ -f ".env" ]; then
    sed -i.bak 's/DB_NAME=awms/DB_NAME=emsp/g' .env
    echo "✅ 已更新 .env"
else
    echo "⚠️  .env 文件不存在"
fi

echo "🎉 配置文件更新完成"
EOF

chmod +x "$CONFIG_UPDATE_SCRIPT"
echo -e "${GREEN}✅ 已生成配置更新脚本: $CONFIG_UPDATE_SCRIPT${NC}"
echo -e "${BLUE}💡 运行 ./$CONFIG_UPDATE_SCRIPT 可自动更新配置文件${NC}"
echo ""

# 询问是否删除原数据库
echo -e "${BLUE}📋 步骤 10: 清理原数据库${NC}"
echo -e "${YELLOW}⚠️  是否删除原来的 awms 数据库?${NC}"
echo -e "   - 建议先测试新数据库功能正常后再删除"
echo -e "   - 已创建备份文件，可以随时恢复"
echo ""

read -p "现在删除 awms 数据库? (y/n): " delete_old_db
if [[ $delete_old_db =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔄 删除原数据库 'awms'...${NC}"
    $MYSQL_CMD -e "DROP DATABASE awms;"
    echo -e "${GREEN}✅ 原数据库 'awms' 已删除${NC}"
else
    echo -e "${BLUE}ℹ️  保留原数据库 'awms'${NC}"
    echo -e "${YELLOW}💡 确认新数据库正常后，可手动删除：${NC}"
    echo -e "   mysql -u root -p -e \"DROP DATABASE awms;\""
fi
echo ""

# 迁移完成总结
echo -e "${GREEN}🎉 数据库迁移完成！${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}📋 迁移总结：${NC}"
echo -e "   ✅ 源数据库: awms"
echo -e "   ✅ 目标数据库: emsp"
echo -e "   ✅ 备份文件: $BACKUP_FILE"
echo -e "   ✅ 配置更新脚本: $CONFIG_UPDATE_SCRIPT"
echo ""
echo -e "${BLUE}📝 后续步骤：${NC}"
echo -e "   1. 运行配置更新脚本: ./$CONFIG_UPDATE_SCRIPT"
echo -e "   2. 重启应用服务"
echo -e "   3. 测试应用功能"
echo -e "   4. 确认无误后删除备份文件（可选）"
echo ""
echo -e "${BLUE}🔗 测试新数据库：${NC}"
echo -e "   mysql -u root -p emsp"
echo ""
echo -e "${GREEN}🚀 EMSP 数据库迁移成功完成！${NC}" 