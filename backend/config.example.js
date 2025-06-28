// 配置文件示例
// 复制此文件为 config.js 并修改相应配置

module.exports = {
  // 服务器配置
  port: process.env.PORT || 3000,

  // 数据库配置
  database: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "emsp",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || "emsp-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // 环境配置
  env: process.env.NODE_ENV || "development",
};
