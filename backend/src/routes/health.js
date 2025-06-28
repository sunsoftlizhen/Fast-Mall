const Router = require("koa-router");
const router = new Router();

// 健康检查端点
router.get("/health", async (ctx) => {
  ctx.body = {
    success: true,
    message: "服务正常运行",
    data: {
      timestamp: new Date().toISOString(),
      server: "EMSP Backend",
      version: "1.0.0",
    },
  };
});

// JWT测试端点
router.get("/test-jwt", async (ctx) => {
  const JWTUtil = require("../utils/jwt");

  // 生成测试token
  const testPayload = { userId: 1, username: "test" };
  const token = JWTUtil.generateToken(testPayload);

  // 验证token
  try {
    const decoded = JWTUtil.verifyToken(token);
    ctx.body = {
      success: true,
      message: "JWT功能正常",
      data: {
        generated: testPayload,
        decoded: decoded,
        token: token.substring(0, 20) + "...",
      },
    };
  } catch (error) {
    ctx.body = {
      success: false,
      message: "JWT功能异常",
      error: error.message,
    };
  }
});

module.exports = router;
