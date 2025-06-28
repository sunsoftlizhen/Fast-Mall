# 数据库连接问题排查指南

## 常见数据库连接错误及解决方案

### 1. 检查 MySQL 服务状态

#### macOS:

```bash
# 检查MySQL服务状态
brew services list | grep mysql

# 启动MySQL服务
brew services start mysql

# 停止MySQL服务
brew services stop mysql
```

#### Windows:

```bash
# 检查MySQL服务状态
net start | findstr MySQL

# 启动MySQL服务
net start MySQL80  # 根据你的MySQL版本调整

# 停止MySQL服务
net stop MySQL80
```

#### Linux (Ubuntu/Debian):

```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 启动MySQL服务
sudo systemctl start mysql

# 停止MySQL服务
sudo systemctl stop mysql

# 开机自启动
sudo systemctl enable mysql
```

### 2. 验证数据库连接信息

#### 测试 MySQL 连接

```bash
# 使用命令行测试连接
mysql -h localhost -u root -p

# 如果连接成功，检查数据库是否存在
mysql -u root -p -e "SHOW DATABASES;"
```

#### 创建数据库和用户（如果需要）

```sql
-- 登录MySQL后执行
CREATE DATABASE IF NOT EXISTS awms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（可选，更安全）
CREATE USER 'awms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON awms.* TO 'awms_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 配置数据库连接

#### 方法一：使用环境变量

在项目根目录创建 `.env` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=awms

# 或者使用专用用户
# DB_USER=awms_user
# DB_PASSWORD=your_password
```

#### 方法二：修改配置文件

复制并修改配置文件：

```bash
cd backend
cp config.example.js config.js
```

然后编辑 `config.js` 文件中的数据库配置部分。

### 4. 常见错误解决方案

#### 错误：ER_ACCESS_DENIED_ERROR

```
Access denied for user 'root'@'localhost'
```

**解决方案：**

1. 检查用户名和密码是否正确
2. 重置 MySQL root 密码：

```bash
# macOS (Homebrew)
mysqld_safe --skip-grant-tables &
mysql -u root
mysql> UPDATE mysql.user SET authentication_string=PASSWORD('new_password') WHERE User='root';
mysql> FLUSH PRIVILEGES;

# 或使用较新的MySQL版本
mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
mysql> FLUSH PRIVILEGES;
```

#### 错误：ER_BAD_DB_ERROR

```
Unknown database 'awms'
```

**解决方案：**

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE awms;"

# 导入初始化脚本
mysql -u root -p awms < database/init.sql
```

#### 错误：ECONNREFUSED

```
connect ECONNREFUSED 127.0.0.1:3306
```

**解决方案：**

1. 确认 MySQL 服务正在运行
2. 检查端口是否正确（默认 3306）
3. 检查防火墙设置

#### 错误：ER_NOT_SUPPORTED_AUTH_MODE

```
Client does not support authentication protocol
```

**解决方案：**

```sql
-- 更改认证方式
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### 5. 测试连接脚本

创建一个测试脚本来验证数据库连接：

```javascript
// test-db-connection.js
const mysql = require("mysql2/promise");

async function testConnection() {
  const config = {
    host: "localhost",
    user: "root",
    password: "", // 输入你的密码
    database: "awms",
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log("✅ 数据库连接成功！");

    // 测试查询
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as count FROM users"
    );
    console.log("📊 用户表记录数:", rows[0].count);

    await connection.end();
  } catch (error) {
    console.error("❌ 数据库连接失败:", error.message);
    console.error("错误码:", error.code);
  }
}

testConnection();
```

运行测试：

```bash
cd backend
node test-db-connection.js
```

### 6. Docker 方式运行 MySQL（可选）

如果本地安装 MySQL 有问题，可以使用 Docker：

```bash
# 拉取MySQL镜像
docker pull mysql:8.0

# 运行MySQL容器
docker run --name awms-mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=awms \
  -p 3306:3306 \
  -d mysql:8.0

# 等待容器启动后，导入初始数据
docker exec -i awms-mysql mysql -uroot -proot123 awms < database/init.sql
```

对应的连接配置：

```javascript
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root123",
  database: "awms",
};
```

### 7. 调试步骤

1. **检查 MySQL 服务**

```bash
# 检查MySQL进程
ps aux | grep mysql
# 或
pgrep mysql
```

2. **检查端口占用**

```bash
# 检查3306端口
netstat -an | grep 3306
# 或
lsof -i :3306
```

3. **查看 MySQL 错误日志**

```bash
# macOS (Homebrew)
tail -f /usr/local/var/mysql/$(hostname).err

# Linux
tail -f /var/log/mysql/error.log

# Windows
# 查看 MySQL 安装目录下的 data 文件夹中的 .err 文件
```

4. **检查 MySQL 配置**

```bash
mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
mysql -u root -p -e "SHOW VARIABLES LIKE 'bind_address';"
```

### 8. 快速修复脚本

创建一个快速修复脚本：

```bash
#!/bin/bash
# fix-database.sh

echo "🔍 检查数据库连接问题..."

# 检查MySQL服务
if ! pgrep mysql > /dev/null; then
    echo "❌ MySQL服务未运行，尝试启动..."

    # 根据系统启动MySQL
    if command -v brew > /dev/null; then
        brew services start mysql
    elif command -v systemctl > /dev/null; then
        sudo systemctl start mysql
    else
        echo "请手动启动MySQL服务"
    fi
fi

# 检查数据库是否存在
if mysql -u root -p -e "USE awms;" 2>/dev/null; then
    echo "✅ 数据库 awms 存在"
else
    echo "📝 创建数据库..."
    mysql -u root -p -e "CREATE DATABASE awms;"
    mysql -u root -p awms < database/init.sql
    echo "✅ 数据库创建完成"
fi

echo "🚀 尝试重新启动后端服务..."
```

运行修复脚本：

```bash
chmod +x fix-database.sh
./fix-database.sh
```
