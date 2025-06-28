const Router = require("koa-router");
const MomentController = require("../controllers/momentController");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/permission");

const router = new Router();

// 移动端朋友圈路由
router.get("/", MomentController.getMoments);
router.post("/", auth, MomentController.createMoment);

router.post("/:id/comment", auth, MomentController.commentMoment);

router.post("/:id/like", auth, MomentController.toggleLikeMoment);
router.get("/my", auth, MomentController.getUserMoments);
router.delete("/:id", auth, MomentController.deleteMoment);

// 管理后台朋友圈路由
router.get(
  "/admin",
  auth,
  checkPermission("moment:view"),
  MomentController.getAllMomentsForAdmin
);
router.put(
  "/admin/:id/status",
  auth,
  checkPermission("moment:manage"),
  MomentController.toggleMomentStatus
);

module.exports = router;
