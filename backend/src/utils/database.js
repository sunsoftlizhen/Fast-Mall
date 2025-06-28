const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "emsp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 移除可能不兼容的配置
  charset: "utf8mb4",
  timezone: "+00:00",
};

const pool = mysql.createPool(dbConfig);

// 测试数据库连接
pool
  .getConnection()
  .then((connection) => {
    console.log("数据库连接成功");
    connection.release();
  })
  .catch((err) => {
    console.error("数据库连接失败:", err.message);
  });

module.exports = pool;
