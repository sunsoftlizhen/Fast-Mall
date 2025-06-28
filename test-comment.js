const mysql = require("mysql2/promise");

async function testComment() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "awms",
    });

    console.log("数据库连接成功");

    // 测试插入评论
    const [result] = await connection.execute(
      "INSERT INTO moment_comments (moment_id, user_id, content) VALUES (?, ?, ?)",
      [2, 1, "测试评论API"]
    );

    console.log("评论插入成功，ID:", result.insertId);

    // 查询评论
    const [comments] = await connection.execute(
      "SELECT * FROM moment_comments WHERE moment_id = ?",
      [2]
    );

    console.log("朋友圈评论列表:", comments);

    await connection.end();
  } catch (error) {
    console.error("测试失败:", error);
  }
}

testComment();
