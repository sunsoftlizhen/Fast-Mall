const Router = require("koa-router");
const MobileController = require("../controllers/mobileController");
const auth = require("../middleware/auth");

const router = new Router();

// 商品相关路由
router.get("/products", MobileController.getProducts);
router.get("/products/:id", MobileController.getProductDetail);

// 购物车相关路由
router.post("/cart", auth, MobileController.addToCart);
router.get("/cart", auth, MobileController.getCartList);
router.put("/cart/:id", auth, MobileController.updateCartItem);
router.delete("/cart/:id", auth, MobileController.removeCartItem);

// 订单相关路由
router.post("/orders", auth, MobileController.createOrder);
router.get("/orders", auth, MobileController.getOrderList);
router.get("/orders/:id", auth, MobileController.getOrderDetail);
router.post("/orders/:id/pay", auth, MobileController.payOrder);
router.put("/orders/:id/cancel", auth, MobileController.cancelOrder);
router.put("/orders/:id/receive", auth, MobileController.confirmReceive);

// 钱包相关路由
router.get("/wallet", auth, MobileController.getWallet);
router.get(
  "/wallet/transactions",
  auth,
  MobileController.getWalletTransactions
);

// 地址管理路由
router.get("/addresses", auth, MobileController.getAddresses);
router.post("/addresses", auth, MobileController.addAddress);
router.get("/addresses/:id", auth, MobileController.getAddressDetail);
router.put("/addresses/:id", auth, MobileController.updateAddress);
router.delete("/addresses/:id", auth, MobileController.deleteAddress);
router.post("/addresses/:id/default", auth, MobileController.setDefaultAddress);

// 动态相关路由
router.get("/my-moments", auth, MobileController.getMyMoments);

module.exports = router;
