const JWTUtil = require("../utils/jwt");
const db = require("../utils/database");

module.exports = async (ctx, next) => {
  try {
    const token = ctx.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "未提供认证令牌",
      };
      return;
    }

    let payload;
    try {
      payload = JWTUtil.verifyToken(token);
    } catch (jwtError) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "认证令牌无效或已过期",
      };
      return;
    }

    // 获取用户信息和权限
    const [users] = await db.execute(
      `
      SELECT u.*, r.name as role_name, 
             GROUP_CONCAT(p.code) as permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND u.status = 1
      GROUP BY u.id
    `,
      [payload.userId]
    );

    if (users.length === 0) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "用户不存在或已被禁用",
      };
      return;
    }

    const user = users[0];
    user.permissions = user.permissions ? user.permissions.split(",") : [];

    ctx.state.user = user;
    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "服务器内部错误",
    };
  }
};
