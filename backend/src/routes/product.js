const Router = require("koa-router");
const ProductController = require("../controllers/productController");
const auth = require("../middleware/auth");
const checkPermission = require("../middleware/permission");

const router = new Router();

// 商品管理路由
router.get(
  "/",
  auth,
  checkPermission("product:view"),
  ProductController.getProducts
);

router.post(
  "/",
  auth,
  checkPermission("product:add"),
  ProductController.createProduct
);

router.put(
  "/:id",
  auth,
  checkPermission("product:edit"),
  ProductController.updateProduct
);

router.delete(
  "/:id",
  auth,
  checkPermission("product:delete"),
  ProductController.deleteProduct
);

router.get(
  "/:id",
  auth,
  checkPermission("product:view"),
  ProductController.getProductById
);

// 获取商品规格和单位（无权限限制，用于下拉选择）
router.get("/specs/list", auth, ProductController.getProductSpecs);
router.get("/units/list", auth, ProductController.getProductUnits);

module.exports = router;
