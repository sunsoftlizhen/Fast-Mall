const Router = require("koa-router");
const DashboardController = require("../controllers/dashboardController");

const router = new Router();

// 获取仪表板统计数据
router.get("/stats", DashboardController.getStats);

// 朋友圈管理
router.get("/moments", DashboardController.getMoments);
router.put("/moments/:id/approve", DashboardController.approveMoment);
router.put("/moments/:id/hide", DashboardController.hideMoment);
router.put("/moments/:id/show", DashboardController.showMoment);
router.delete("/moments/:id", DashboardController.deleteMoment);

// 订单管理
router.get("/orders", DashboardController.getOrders);
router.get("/orders/:id", DashboardController.getOrderDetail);
router.put("/orders/:id/ship", DashboardController.shipOrder);
router.put("/orders/:id/cancel", DashboardController.cancelOrder);

module.exports = router;
