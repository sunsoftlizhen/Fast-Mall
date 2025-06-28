const Router = require("koa-router");
const RoleController = require("../controllers/roleController");
const checkPermission = require("../middleware/permission");

const router = new Router();

// 获取角色列表（分页）
router.get("/", checkPermission("role:manage"), RoleController.getRoles);

// 获取所有角色（用于下拉选择）
router.get("/all", checkPermission("user:view"), RoleController.getAllRoles);

// 创建角色
router.post("/", checkPermission("role:manage"), RoleController.createRole);

// 获取角色详情
router.get("/:id", checkPermission("role:manage"), RoleController.getRoleById);

// 更新角色
router.put("/:id", checkPermission("role:manage"), RoleController.updateRole);

// 删除角色
router.delete(
  "/:id",
  checkPermission("role:manage"),
  RoleController.deleteRole
);

module.exports = router;
