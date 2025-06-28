const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "awms-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

class JWTUtil {
  // 生成token
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // 验证token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Token无效");
    }
  }

  // 解码token（不验证）
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtil;
