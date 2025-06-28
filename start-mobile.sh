#!/bin/bash

echo "🚀 启动移动端商城应用..."

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v 2>/dev/null || echo "未安装")
if [ "$node_version" = "未安装" ]; then
    echo "❌ 请先安装 Node.js (v14 或更高版本)"
    exit 1
fi

echo "✅ Node.js 版本: $node_version"

# 检查数据库连接
echo "🔌 检查数据库连接..."
cd backend
npm run test-db || {
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
}

echo "✅ 数据库连接正常"

# 启动后端服务
echo "🔧 启动后端服务..."
npm start &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动移动端应用
echo "📱 启动移动端应用..."
cd ../mobile

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动开发服务器
npm run dev &
MOBILE_PID=$!

echo ""
echo "🎉 启动完成!"
echo ""
echo "📱 移动端应用: http://localhost:3001"
echo "🔧 后端API: http://localhost:3000"
echo ""
echo "💡 使用以下测试账号："
echo "   用户名: testuser"
echo "   密码: user123"
echo ""
echo "🛑 按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $MOBILE_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
wait 