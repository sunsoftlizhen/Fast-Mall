const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("koa-cors");
const json = require("koa-json");
const logger = require("koa-logger");

const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/user");
const roleRoutes = require("./src/routes/role");
const permissionRoutes = require("./src/routes/permission");
const dashboardRoutes = require("./src/routes/dashboard");
const healthRoutes = require("./src/routes/health");
const productRoutes = require("./src/routes/product");
const mobileRoutes = require("./src/routes/mobile");
const momentRoutes = require("./src/routes/moment");

const errorHandler = require("./src/middleware/errorHandler");
const auth = require("./src/middleware/auth");

const app = new Koa();
const router = new Router();

// 中间件
app.use(logger());
app.use(json());
app.use(bodyParser());
app.use(cors());
app.use(errorHandler);

// 路由
router.use("/api", healthRoutes.routes()); // 健康检查，无需认证
router.use("/api/auth", authRoutes.routes());
router.use("/api/users", auth, userRoutes.routes());
router.use("/api/roles", auth, roleRoutes.routes());
router.use("/api/permissions", auth, permissionRoutes.routes());
router.use("/api/dashboard", auth, dashboardRoutes.routes());
router.use("/api/products", auth, productRoutes.routes());

// 移动端API路由
router.use("/api/mobile", mobileRoutes.routes());
router.use("/api/moments", momentRoutes.routes());

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
