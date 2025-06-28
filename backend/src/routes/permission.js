const Router = require("koa-router");
const PermissionController = require("../controllers/permissionController");
const checkPermission = require("../middleware/permission");

const router = new Router();

// 获取所有权限列表
router.get(
  "/",
  checkPermission("permission:manage"),
  PermissionController.getPermissions
);

// 获取用户权限
router.get(
  "/user/:userId",
  checkPermission("user:view"),
  PermissionController.getUserPermissions
);

module.exports = router;
