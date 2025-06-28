const Router = require("koa-router");
const AuthController = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = new Router();

// 用户登录
router.post("/login", AuthController.login);

// 用户注册
router.post("/register", AuthController.register);

// 获取当前用户信息
router.get("/me", auth, AuthController.getCurrentUser);

module.exports = router;
