const bcrypt = require("bcrypt");
const Joi = require("joi");
const db = require("../utils/database");

class UserController {
  // 获取用户列表
  static async getUsers(ctx) {
    const { page = 1, pageSize = 10, keyword = "", status = "" } = ctx.query;

    // 确保参数为数字类型
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * pageSizeNum;

    let whereClause = "WHERE 1=1";
    let countWhereClause = "WHERE 1=1";
    const params = [];
    const countParams = [];

    if (keyword && keyword.trim()) {
      whereClause += " AND (u.username LIKE ? OR u.email LIKE ?)";
      countWhereClause += " AND (username LIKE ? OR email LIKE ?)";
      params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
      countParams.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
    }

    if (status !== "" && status !== undefined) {
      whereClause += " AND u.status = ?";
      countWhereClause += " AND status = ?";
      params.push(parseInt(status));
      countParams.push(parseInt(status));
    }

    // 获取用户列表
    const [users] = await db.execute(
      `
      SELECT u.id, u.username, u.email, u.phone, u.avatar, u.status, 
             u.last_login_at, u.created_at, u.updated_at,
             r.name as role_name, r.id as role_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pageSizeNum + "", offset + ""]
    );

    // 获取总数
    const [countResult] = await db.execute(
      `
      SELECT COUNT(*) as total FROM users ${countWhereClause}
    `,
      countParams
    );

    const total = countResult[0].total;

    ctx.body = {
      success: true,
      message: "获取用户列表成功",
      data: {
        users,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      },
    };
  }

  // 创建用户
  static async createUser(ctx) {
    const schema = Joi.object({
      username: Joi.string().min(3).max(50).required().messages({
        "string.min": "用户名至少3个字符",
        "string.max": "用户名最多50个字符",
        "any.required": "用户名不能为空",
      }),
      password: Joi.string().min(6).required().messages({
        "string.min": "密码至少6个字符",
        "any.required": "密码不能为空",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "邮箱格式不正确",
        "any.required": "邮箱不能为空",
      }),
      phone: Joi.string().optional(),
      role_id: Joi.number().integer().required().messages({
        "any.required": "角色不能为空",
      }),
      status: Joi.number().integer().valid(0, 1).default(1),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      throw new Error(`验证失败: ${error.details[0].message}`);
    }

    const { username, password, email, phone, role_id, status } = value;

    // 检查用户名是否已存在
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUsers.length > 0) {
      throw new Error("用户名已存在");
    }

    // 检查邮箱是否已存在
    const [existingEmails] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingEmails.length > 0) {
      throw new Error("邮箱已存在");
    }

    // 检查角色是否存在
    const [roles] = await db.execute("SELECT id FROM roles WHERE id = ?", [
      role_id,
    ]);

    if (roles.length === 0) {
      throw new Error("角色不存在");
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await db.execute(
      "INSERT INTO users (username, password, email, phone, role_id, status) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hashedPassword, email, phone, role_id, status]
    );

    ctx.body = {
      success: true,
      message: "创建用户成功",
      data: {
        userId: result.insertId,
      },
    };
  }

  // 更新用户
  static async updateUser(ctx) {
    const userId = ctx.params.id;

    const schema = Joi.object({
      username: Joi.string().min(3).max(50).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      role_id: Joi.number().integer().optional(),
      status: Joi.number().integer().valid(0, 1).optional(),
      password: Joi.string().min(6).optional(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      throw new Error(`验证失败: ${error.details[0].message}`);
    }

    // 检查用户是否存在
    const [users] = await db.execute("SELECT id FROM users WHERE id = ?", [
      userId,
    ]);

    if (users.length === 0) {
      throw new Error("用户不存在");
    }

    const updateFields = [];
    const updateValues = [];

    // 构建更新语句
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        if (key === "username") {
          // 检查用户名是否已被其他用户使用
          const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE username = ? AND id != ?",
            [val, userId]
          );
          if (existingUsers.length > 0) {
            throw new Error("用户名已存在");
          }
        }

        if (key === "email") {
          // 检查邮箱是否已被其他用户使用
          const [existingEmails] = await db.execute(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            [val, userId]
          );
          if (existingEmails.length > 0) {
            throw new Error("邮箱已存在");
          }
        }

        if (key === "role_id") {
          // 检查角色是否存在
          const [roles] = await db.execute(
            "SELECT id FROM roles WHERE id = ?",
            [val]
          );
          if (roles.length === 0) {
            throw new Error("角色不存在");
          }
        }

        if (key === "password") {
          // 加密密码
          const hashedPassword = await bcrypt.hash(val, 10);
          updateFields.push("password = ?");
          updateValues.push(hashedPassword);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(val);
        }
      }
    }

    if (updateFields.length === 0) {
      throw new Error("没有需要更新的字段");
    }

    updateValues.push(userId);

    await db.execute(
      `UPDATE users SET ${updateFields.join(
        ", "
      )}, updated_at = NOW() WHERE id = ?`,
      updateValues
    );

    ctx.body = {
      success: true,
      message: "更新用户成功",
      data: null,
    };
  }

  // 删除用户
  static async deleteUser(ctx) {
    const userId = ctx.params.id;

    // 检查是否为管理员
    const [user] = await db.execute("SELECT role_id FROM users WHERE id = ?", [
      userId,
    ]);

    if (user.length === 0) {
      throw new Error("用户不存在");
    }

    if (user[0].role_id === 1) {
      throw new Error("不能删除管理员用户");
    }

    await db.execute("DELETE FROM users WHERE id = ?", [userId]);

    ctx.body = {
      success: true,
      message: "用户删除成功",
    };
  }

  // 获取用户详情
  static async getUserById(ctx) {
    // 从URL参数获取用户ID，如果没有则使用当前登录用户的ID
    const userId = ctx.state.user.id;
    console.log("userId", userId);
    console.log("当前登录用户ID:", ctx.state.user.id);

    const [users] = await db.execute(
      `
      SELECT u.id, u.username, u.email, u.phone, u.avatar, u.status, 
             u.last_login_at, u.created_at, u.updated_at,
             r.name as role_name, r.id as role_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `,
      [userId]
    );

    if (users.length === 0) {
      throw new Error("用户不存在");
    }

    ctx.body = {
      success: true,
      message: "获取用户详情成功",
      data: users[0],
    };
  }

  // 获取个人信息
  static async getProfile(ctx) {
    const userId = ctx.state.user.id;

    const [users] = await db.execute(
      `
      SELECT u.id, u.username, u.email, u.phone, u.avatar, u.status,
             u.last_login_at, u.created_at, u.updated_at,
             r.name as role_name, r.id as role_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `,
      [userId]
    );

    if (users.length === 0) {
      throw new Error("用户不存在");
    }

    const user = users[0];
    // 不返回敏感信息
    delete user.password;

    ctx.body = {
      success: true,
      message: "获取个人信息成功",
      data: user,
    };
  }

  // 更新个人信息
  static async updateProfile(ctx) {
    const userId = ctx.state.user.id;

    const schema = Joi.object({
      username: Joi.string().min(3).max(50).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      avatar: Joi.string().optional(),
      current_password: Joi.string().optional(),
      new_password: Joi.string().min(6).optional(),
      confirm_password: Joi.string().optional(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      throw new Error(`验证失败: ${error.details[0].message}`);
    }

    const {
      username,
      email,
      phone,
      avatar,
      current_password,
      new_password,
      confirm_password,
    } = value;

    // 检查用户是否存在
    const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    if (users.length === 0) {
      throw new Error("用户不存在");
    }

    const user = users[0];

    // 如果要修改密码，需要验证当前密码
    if (new_password) {
      if (!current_password) {
        throw new Error("修改密码需要提供当前密码");
      }

      if (new_password !== confirm_password) {
        throw new Error("新密码和确认密码不匹配");
      }

      // 验证当前密码
      const isValidPassword = await bcrypt.compare(
        current_password,
        user.password
      );
      if (!isValidPassword) {
        throw new Error("当前密码不正确");
      }
    }

    const updateFields = [];
    const updateValues = [];

    // 构建更新语句
    if (username !== undefined) {
      // 检查用户名是否已被其他用户使用
      const [existingUsers] = await db.execute(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, userId]
      );
      if (existingUsers.length > 0) {
        throw new Error("用户名已存在");
      }
      updateFields.push("username = ?");
      updateValues.push(username);
    }

    if (email !== undefined) {
      // 检查邮箱是否已被其他用户使用
      const [existingEmails] = await db.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId]
      );
      if (existingEmails.length > 0) {
        throw new Error("邮箱已存在");
      }
      updateFields.push("email = ?");
      updateValues.push(email);
    }

    if (phone !== undefined) {
      updateFields.push("phone = ?");
      updateValues.push(phone);
    }

    if (avatar !== undefined) {
      updateFields.push("avatar = ?");
      updateValues.push(avatar);
    }

    if (new_password) {
      // 加密新密码
      const hashedPassword = await bcrypt.hash(new_password, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      throw new Error("没有需要更新的字段");
    }

    // 添加更新时间
    updateFields.push("updated_at = NOW()");

    // 执行更新
    await db.execute(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      [...updateValues, userId]
    );

    ctx.body = {
      success: true,
      message: "更新个人信息成功",
    };
  }

  // ==================== 用户地址管理 ====================

  // 获取用户地址列表
  static async getUserAddresses(ctx) {
    try {
      const userId = ctx.params.userId;
      const { page = 1, pageSize = 10 } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;

      // 检查用户是否存在
      const [user] = await db.execute(
        "SELECT id, username FROM users WHERE id = ?",
        [userId]
      );

      if (user.length === 0) {
        throw new Error("用户不存在");
      }

      const [addresses] = await db.execute(
        `SELECT * FROM user_addresses 
         WHERE user_id = ? 
         ORDER BY is_default DESC, created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, String(pageSizeNum), String(offset)]
      );

      const [countResult] = await db.execute(
        "SELECT COUNT(*) as total FROM user_addresses WHERE user_id = ?",
        [userId]
      );

      ctx.body = {
        success: true,
        data: {
          user: user[0],
          addresses,
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / pageSizeNum),
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取所有用户地址（管理后台）
  static async getAllUserAddresses(ctx) {
    try {
      const {
        page = 1,
        pageSize = 10,
        username = "",
        province = "",
        city = "",
      } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;

      let whereConditions = [];
      let whereParams = [];

      if (username) {
        whereConditions.push("u.username LIKE ?");
        whereParams.push(`%${username}%`);
      }

      if (province) {
        whereConditions.push("ua.province LIKE ?");
        whereParams.push(`%${province}%`);
      }

      if (city) {
        whereConditions.push("ua.city LIKE ?");
        whereParams.push(`%${city}%`);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const [addresses] = await db.execute(
        `SELECT ua.*, u.username, u.email, u.phone as user_phone
         FROM user_addresses ua
         JOIN users u ON ua.user_id = u.id
         ${whereClause}
         ORDER BY ua.created_at DESC
         LIMIT ? OFFSET ?`,
        [...whereParams, String(pageSizeNum), String(offset)]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total
         FROM user_addresses ua
         JOIN users u ON ua.user_id = u.id
         ${whereClause}`,
        whereParams
      );

      ctx.body = {
        success: true,
        data: {
          addresses,
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / pageSizeNum),
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 删除用户地址（管理后台）
  static async deleteUserAddress(ctx) {
    try {
      const addressId = ctx.params.addressId;

      // 检查地址是否存在
      const [existingAddress] = await db.execute(
        "SELECT id, user_id FROM user_addresses WHERE id = ?",
        [addressId]
      );

      if (existingAddress.length === 0) {
        throw new Error("地址不存在");
      }

      await db.execute("DELETE FROM user_addresses WHERE id = ?", [addressId]);

      ctx.body = {
        success: true,
        message: "地址删除成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取地址详情（管理后台）
  static async getAddressDetail(ctx) {
    try {
      const addressId = ctx.params.addressId;

      const [address] = await db.execute(
        `SELECT ua.*, u.username, u.email, u.phone as user_phone
         FROM user_addresses ua
         JOIN users u ON ua.user_id = u.id
         WHERE ua.id = ?`,
        [addressId]
      );

      if (address.length === 0) {
        throw new Error("地址不存在");
      }

      ctx.body = {
        success: true,
        data: address[0],
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserController;
