const Router = require("koa-router");
const UserController = require("../controllers/userController");
const checkPermission = require("../middleware/permission");
const auth = require("../middleware/auth");

const router = new Router();

// 用户地址管理路由（需要放在 /:id 路由之前，避免路由冲突）
router.get(
  "/addresses",
  auth,
  checkPermission("user:view"),
  UserController.getAllUserAddresses
);
router.get(
  "/addresses/:addressId",
  auth,
  checkPermission("user:view"),
  UserController.getAddressDetail
);
router.delete(
  "/addresses/:addressId",
  auth,
  checkPermission("user:delete"),
  UserController.deleteUserAddress
);

// 获取用户列表
router.get("/", auth, checkPermission("user:view"), UserController.getUsers);

// 创建用户
router.post("/", auth, checkPermission("user:add"), UserController.createUser);

// 获取特定用户的地址列表
router.get(
  "/:userId/addresses",
  auth,
  checkPermission("user:view"),
  UserController.getUserAddresses
);

// 获取用户详情
router.get(
  "/:id",
  auth,
  checkPermission("user:view"),
  UserController.getUserById
);

// 更新用户
router.put(
  "/:id",
  auth,
  checkPermission("user:edit"),
  UserController.updateUser
);

// 删除用户
router.delete(
  "/:id",
  auth,
  checkPermission("user:delete"),
  UserController.deleteUser
);

// 个人信息路由
router.get("/profile", auth, UserController.getProfile);
router.put("/profile", auth, UserController.updateProfile);

module.exports = router;
