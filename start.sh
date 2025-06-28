#!/bin/bash

# EMSP 电商与朋友圈社交平台启动脚本

echo "🚀 启动 EMSP 管理后台..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查MySQL是否运行
if ! command -v mysql &> /dev/null; then
    echo "⚠️  警告：MySQL 未找到，请确保 MySQL 已安装并运行"
fi

echo "📦 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "📦 安装前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🔧 配置数据库..."
echo "请确保已完成以下步骤："
echo "1. 创建MySQL数据库"
echo "2. 执行 database/init.sql 初始化表结构"
echo "3. 修改后端数据库连接配置（如需要）"

# 启动后端服务
echo "🌐 启动后端服务..."
cd ../backend
npm start &
BACKEND_PID=$!

# 等待后端服务启动
sleep 5

# 启动前端开发服务器
echo "🎨 启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo ""
echo "📖 访问地址："
echo "前端地址: http://localhost:8080"
echo "后端地址: http://localhost:3000"
echo ""
echo "🔑 默认账号："
echo "管理员: admin / admin123"
echo "普通用户: testuser / user123"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
wait $BACKEND_PID $FRONTEND_PID 