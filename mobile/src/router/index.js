import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "Home",
    component: () => import("../views/Home.vue"),
    meta: { title: "首页" },
  },
  {
    path: "/moments",
    name: "Moments",
    component: () => import("../views/Moments.vue"),
    meta: { title: "逛一逛" },
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("../views/Profile.vue"),
    meta: { title: "我的", requireAuth: true },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../views/Register.vue"),
    meta: { title: "注册" },
  },
  {
    path: "/product/:id",
    name: "ProductDetail",
    component: () => import("../views/ProductDetail.vue"),
    meta: { title: "商品详情" },
  },
  {
    path: "/cart",
    name: "Cart",
    component: () => import("../views/Cart.vue"),
    meta: { title: "购物车", requireAuth: true },
  },
  {
    path: "/orders",
    name: "Orders",
    component: () => import("../views/Orders.vue"),
    meta: { title: "我的订单", requireAuth: true },
  },
  {
    path: "/wallet",
    name: "Wallet",
    component: () => import("../views/Wallet.vue"),
    meta: { title: "我的钱包", requireAuth: true },
  },
  {
    path: "/search",
    name: "Search",
    component: () => import("../views/Search.vue"),
    meta: { title: "搜索商品" },
  },
  {
    path: "/publish",
    name: "Publish",
    component: () => import("../views/Publish.vue"),
    meta: { title: "发布动态", requireAuth: true },
  },
  {
    path: "/checkout",
    name: "Checkout",
    component: () => import("../views/Checkout.vue"),
    meta: { title: "确认订单", requireAuth: true },
  },
  {
    path: "/payment/:id",
    name: "Payment",
    component: () => import("../views/Payment.vue"),
    meta: { title: "订单支付", requireAuth: true },
  },
  {
    path: "/payment-success",
    name: "PaymentSuccess",
    component: () => import("../views/PaymentSuccess.vue"),
    meta: { title: "支付成功", requireAuth: true },
  },
  {
    path: "/order-detail/:id",
    name: "OrderDetail",
    component: () => import("../views/OrderDetail.vue"),
    meta: { title: "订单详情", requireAuth: true },
  },
  {
    path: "/addresses",
    name: "AddressList",
    component: () => import("../views/AddressList.vue"),
    meta: { title: "收货地址", requireAuth: true },
  },
  {
    path: "/address/add",
    name: "AddressAdd",
    component: () => import("../views/AddressForm.vue"),
    meta: { title: "新增地址", requireAuth: true },
  },
  {
    path: "/address/edit/:id",
    name: "AddressEdit",
    component: () => import("../views/AddressForm.vue"),
    meta: { title: "编辑地址", requireAuth: true },
  },
  {
    path: "/my-moments",
    name: "MyMoments",
    component: () => import("../views/MyMoments.vue"),
    meta: { title: "我的动态", requireAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
