const bcrypt = require("bcrypt");
const Joi = require("joi");
const db = require("../utils/database");
const JWTUtil = require("../utils/jwt");

class AuthController {
  // 用户登录
  static async login(ctx) {
    const schema = Joi.object({
      username: Joi.string().required().messages({
        "any.required": "用户名不能为空",
      }),
      password: Joi.string().required().messages({
        "any.required": "密码不能为空",
      }),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      throw new Error(`验证失败: ${error.details[0].message}`);
    }

    const { username, password } = value;

    // 查询用户
    const [users] = await db.execute(
      "SELECT * FROM users WHERE username = ? AND status = 1",
      [username]
    );

    if (users.length === 0) {
      throw new Error("用户名或密码错误");
    }

    const user = users[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("用户名或密码错误");
    }

    // 更新最后登录时间
    await db.execute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
      user.id,
    ]);

    // 获取用户权限信息
    const [userWithPermissions] = await db.execute(
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
      [user.id]
    );

    const userInfo = userWithPermissions[0];
    userInfo.permissions = userInfo.permissions
      ? userInfo.permissions.split(",")
      : [];

    // 生成token
    const token = JWTUtil.generateToken({
      userId: userInfo.id,
      username: userInfo.username,
      role_id: userInfo.role_id,
    });

    // 移除密码信息
    delete userInfo.password;

    ctx.body = {
      success: true,
      message: "登录成功",
      data: {
        user: userInfo,
        token,
      },
    };
  }

  // 用户注册
  static async register(ctx) {
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
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      throw new Error(`验证失败: ${error.details[0].message}`);
    }

    const { username, password, email, phone } = value;

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

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await db.execute(
      "INSERT INTO users (username, password, email, phone, role_id) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, email, phone, 2] // 默认角色为普通用户
    );

    ctx.body = {
      success: true,
      message: "注册成功",
      data: {
        userId: result.insertId,
      },
    };
  }

  // 获取当前用户信息
  static async getCurrentUser(ctx) {
    const user = ctx.state.user;

    // 移除敏感信息
    delete user.password;

    ctx.body = {
      success: true,
      message: "获取用户信息成功",
      data: user,
    };
  }
}

module.exports = AuthController;
