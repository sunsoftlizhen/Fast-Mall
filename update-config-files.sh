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
