const Joi = require("joi");
const db = require("../utils/database");

class RoleController {
  // 获取角色列表
  static async getRoles(ctx) {
    const { page = 1, pageSize = 10, keyword = "" } = ctx.query;

    // 确保参数为数字类型
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = "WHERE 1=1";
    let countWhereClause = "WHERE 1=1";
    const params = [];
    const countParams = [];

    if (keyword && keyword.trim()) {
      whereClause += " AND (name LIKE ? OR description LIKE ?)";
      countWhereClause += " AND (name LIKE ? OR description LIKE ?)";
      params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
      countParams.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
    }

    // 获取角色列表
    const [roles] = await db.execute(
      `
      SELECT id, name, description, created_at, updated_at
      FROM roles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pageSizeNum + "", offset + ""]
    );

    // 为每个角色获取权限信息
    for (let role of roles) {
      const [permissions] = await db.execute(
        `
        SELECT p.id, p.name, p.code, p.description
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `,
        [role.id]
      );
      role.permissions = permissions;
    }

    // 获取总数
    const [countResult] = await db.execute(
      `
      SELECT COUNT(*) as total FROM roles ${countWhereClause}
    `,
      countParams
    );

    const total = countResult[0].total;

    ctx.body = {
      success: true,
      message: "获取角色列表成功",
      data: {
        roles,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      },
    };
  }

  // 获取所有角色（用于下拉选择）
  static async getAllRoles(ctx) {
    const [roles] = await db.execute(`
      SELECT id, name, description
      FROM roles
      ORDER BY id ASC
    `);

    ctx.body = {
      success: true,
      message: "获取角色列表成功",
      data: roles,
    };
  }

  // 创建角色
  static async createRole(ctx) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).required().messages({
        "string.min": "角色名称至少2个字符",
        "string.max": "角色名称最多50个字符",
        "any.required": "角色名称不能为空",
      }),
      description: Joi.string().max(200).optional(),
      permission_ids: Joi.array().items(Joi.number().integer()).optional(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      throw new Error(`验证失败: ${error.details[0].message}`);
    }

    const { name, description, permission_ids = [] } = value;

    // 检查角色名是否已存在
    const [existingRoles] = await db.execute(
      "SELECT id FROM roles WHERE name = ?",
      [name]
    );

    if (existingRoles.length > 0) {
      throw new Error("角色名称已存在");
    }

    // 开始事务
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 创建角色
      const [result] = await connection.execute(
        "INSERT INTO roles (name, description) VALUES (?, ?)",
        [name, description]
      );

      const roleId = result.insertId;

      // 分配权限
      if (permission_ids.length > 0) {
        const permissionValues = permission_ids.map((pid) => [roleId, pid]);
        await connection.execute(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
          [permissionValues]
        );
      }

      await connection.commit();

      ctx.body = {
        success: true,
        message: "创建角色成功",
        data: {
          roleId,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 更新角色
  static async updateRole(ctx) {
    const roleId = ctx.params.id;

    const schema = Joi.object({
      name: Joi.string().min(2).max(50).optional(),
      description: Joi.string().max(200).optional(),
      permission_ids: Joi.array().items(Joi.number().integer()).optional(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      throw new Error(`验证失败: ${error.details[0].message}`);
    }

    // 检查角色是否存在
    const [roles] = await db.execute("SELECT id FROM roles WHERE id = ?", [
      roleId,
    ]);

    if (roles.length === 0) {
      throw new Error("角色不存在");
    }

    const { name, description, permission_ids } = value;

    // 检查角色名是否已被其他角色使用
    if (name) {
      const [existingRoles] = await db.execute(
        "SELECT id FROM roles WHERE name = ? AND id != ?",
        [name, roleId]
      );
      if (existingRoles.length > 0) {
        throw new Error("角色名称已存在");
      }
    }

    // 开始事务
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 更新角色基本信息
      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(description);
      }

      if (updateFields.length > 0) {
        updateValues.push(roleId);
        await connection.execute(
          `UPDATE roles SET ${updateFields.join(
            ", "
          )}, updated_at = NOW() WHERE id = ?`,
          updateValues
        );
      }

      // 更新权限
      if (permission_ids !== undefined) {
        // 删除原有权限
        await connection.execute(
          "DELETE FROM role_permissions WHERE role_id = ?",
          [roleId]
        );

        // 添加新权限
        if (permission_ids.length > 0) {
          const permissionValues = permission_ids.map((pid) => [roleId, pid]);
          await connection.execute(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
            [permissionValues]
          );
        }
      }

      await connection.commit();

      ctx.body = {
        success: true,
        message: "更新角色成功",
        data: null,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除角色
  static async deleteRole(ctx) {
    const roleId = ctx.params.id;

    // 检查角色是否存在
    const [roles] = await db.execute("SELECT id FROM roles WHERE id = ?", [
      roleId,
    ]);

    if (roles.length === 0) {
      throw new Error("角色不存在");
    }

    // 检查是否有用户使用此角色
    const [users] = await db.execute("SELECT id FROM users WHERE role_id = ?", [
      roleId,
    ]);

    if (users.length > 0) {
      throw new Error("该角色下还有用户，无法删除");
    }

    // 删除角色及相关权限
    await db.execute("DELETE FROM roles WHERE id = ?", [roleId]);

    ctx.body = {
      success: true,
      message: "删除角色成功",
      data: null,
    };
  }

  // 获取角色详情
  static async getRoleById(ctx) {
    const roleId = ctx.params.id;

    const [roles] = await db.execute(
      `
      SELECT id, name, description, created_at, updated_at
      FROM roles
      WHERE id = ?
    `,
      [roleId]
    );

    if (roles.length === 0) {
      throw new Error("角色不存在");
    }

    const role = roles[0];

    // 获取角色权限
    const [permissions] = await db.execute(
      `
      SELECT p.id, p.name, p.code, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `,
      [roleId]
    );

    role.permissions = permissions;

    ctx.body = {
      success: true,
      message: "获取角色详情成功",
      data: role,
    };
  }
}

module.exports = RoleController;
