const db = require("../utils/database");

class PermissionController {
  // 获取所有权限列表
  static async getPermissions(ctx) {
    const [permissions] = await db.execute(`
      SELECT id, name, code, description, created_at, updated_at
      FROM permissions
      ORDER BY id ASC
    `);

    ctx.body = {
      success: true,
      message: "获取权限列表成功",
      data: permissions,
    };
  }

  // 获取用户权限
  static async getUserPermissions(ctx) {
    const userId = ctx.params.userId;

    const [permissions] = await db.execute(
      `
      SELECT DISTINCT p.id, p.name, p.code, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = ? AND u.status = 1
    `,
      [userId]
    );

    ctx.body = {
      success: true,
      message: "获取用户权限成功",
      data: permissions,
    };
  }
}

module.exports = PermissionController;
