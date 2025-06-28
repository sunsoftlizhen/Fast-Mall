const mysql = require("mysql2/promise");

async function testConnection() {
  console.log("🔍 开始测试数据库连接...\n");

  // 测试配置
  const configs = [
    {
      name: "默认配置（无密码）",
      config: {
        host: "localhost",
        user: "root",
        password: "",
        database: "awms",
      },
    },
    {
      name: "环境变量配置",
      config: {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "awms",
      },
    },
  ];

  for (let i = 0; i < configs.length; i++) {
    const { name, config } = configs[i];
    console.log(`📋 测试 ${name}:`);
    console.log(`   主机: ${config.host}`);
    console.log(`   用户: ${config.user}`);
    console.log(`   数据库: ${config.database}`);
    console.log(`   密码: ${config.password ? "***" : "(空)"}`);

    try {
      // 首先测试基本连接（不指定数据库）
      const basicConfig = { ...config };
      delete basicConfig.database;

      const basicConnection = await mysql.createConnection(basicConfig);
      console.log("   ✅ MySQL服务连接成功！");

      // 检查数据库是否存在
      const [databases] = await basicConnection.execute(
        `SHOW DATABASES LIKE '${config.database}'`
      );

      if (databases.length === 0) {
        console.log(`   ❌ 数据库 '${config.database}' 不存在`);
        console.log("   💡 请先创建数据库：");
        console.log(`      CREATE DATABASE ${config.database};`);
        await basicConnection.end();
        continue;
      }

      await basicConnection.end();

      // 测试完整连接（包含数据库）
      const connection = await mysql.createConnection(config);
      console.log("   ✅ 数据库连接成功！");

      // 测试查询用户表
      try {
        const [rows] = await connection.execute(
          "SELECT COUNT(*) as count FROM users"
        );
        console.log(`   📊 用户表记录数: ${rows[0].count}`);

        // 检查默认管理员账号
        const [adminRows] = await connection.execute(
          "SELECT username, email FROM users WHERE username = ?",
          ["admin"]
        );
        if (adminRows.length > 0) {
          console.log(
            `   👤 管理员账号: ${adminRows[0].username} (${adminRows[0].email})`
          );
        }
      } catch (tableError) {
        console.log("   ❌ 用户表不存在或查询失败");
        console.log("   💡 请运行初始化脚本：");
        console.log(
          `      mysql -u ${config.user} -p ${config.database} < database/init.sql`
        );
      }

      await connection.end();
      console.log("   🎉 所有测试通过！\n");
      return true;
    } catch (error) {
      console.log("   ❌ 连接失败:", error.message);
      console.log("   🔍 错误码:", error.code);

      // 提供针对性的解决建议
      switch (error.code) {
        case "ECONNREFUSED":
          console.log("   💡 建议: MySQL服务未启动，请启动MySQL服务");
          console.log("      macOS: brew services start mysql");
          console.log("      Linux: sudo systemctl start mysql");
          break;
        case "ER_ACCESS_DENIED_ERROR":
          console.log("   💡 建议: 用户名或密码错误");
          console.log("      请检查用户名和密码是否正确");
          break;
        case "ER_BAD_DB_ERROR":
          console.log("   💡 建议: 数据库不存在");
          console.log(
            `      请先创建数据库: CREATE DATABASE ${config.database};`
          );
          break;
        case "ER_NOT_SUPPORTED_AUTH_MODE":
          console.log("   💡 建议: 认证模式不支持");
          console.log("      请更改认证方式为 mysql_native_password");
          break;
        default:
          console.log("   💡 建议: 请查看详细错误信息");
      }
      console.log("");
    }
  }

  return false;
}

// 检查MySQL服务状态
async function checkMySQLService() {
  console.log("🔍 检查MySQL服务状态...");

  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  try {
    // 检查MySQL进程
    await execAsync("pgrep mysql");
    console.log("✅ MySQL进程正在运行\n");
  } catch (error) {
    console.log("❌ MySQL进程未运行");
    console.log("💡 请启动MySQL服务：");
    console.log("   macOS: brew services start mysql");
    console.log("   Linux: sudo systemctl start mysql");
    console.log("   Windows: net start MySQL80\n");
  }
}

// 主函数
async function main() {
  console.log("🚀 AWMS 数据库连接诊断工具\n");
  console.log("=".repeat(50));

  await checkMySQLService();

  const success = await testConnection();

  if (success) {
    console.log("🎉 数据库连接测试通过！可以启动应用了。");
  } else {
    console.log("❌ 数据库连接测试失败，请根据上述建议进行修复。");
  }

  console.log("\n📖 更多帮助请查看: database/troubleshooting.md");
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testConnection, checkMySQLService };
