import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ElMessage } from "element-plus";

// 路由配置
const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: { requiresAuth: false, title: "登录" },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/Register.vue"),
    meta: { requiresAuth: false, title: "注册" },
  },
  {
    path: "/",
    name: "Layout",
    component: () => import("@/layout/Layout.vue"),
    redirect: "/dashboard",
    meta: { requiresAuth: true },
    children: [
      {
        path: "/dashboard",
        name: "Dashboard",
        component: () => import("@/views/Dashboard.vue"),
        meta: { title: "首页", icon: "HomeFilled" },
      },
      {
        path: "/users",
        name: "Users",
        component: () => import("@/views/users/UserList.vue"),
        meta: {
          title: "用户管理",
          icon: "User",
          permission: "user:view",
        },
      },
      {
        path: "/users/add",
        name: "AddUser",
        component: () => import("@/views/users/AddUser.vue"),
        meta: {
          title: "添加用户",
          permission: "user:add",
          hidden: true,
        },
      },
      {
        path: "/users/edit/:id",
        name: "EditUser",
        component: () => import("@/views/users/EditUser.vue"),
        meta: {
          title: "编辑用户",
          permission: "user:edit",
          hidden: true,
        },
      },
      {
        path: "/users/addresses",
        name: "UserAddresses",
        component: () => import("@/views/users/UserAddressList.vue"),
        meta: {
          title: "用户地址管理",
          permission: "user:view",
          hidden: true,
        },
      },
      {
        path: "/roles",
        name: "Roles",
        component: () => import("@/views/roles/RoleList.vue"),
        meta: {
          title: "角色管理",
          icon: "UserFilled",
          permission: "role:manage",
        },
      },
      {
        path: "/permissions",
        name: "Permissions",
        component: () => import("@/views/permissions/PermissionList.vue"),
        meta: {
          title: "权限管理",
          icon: "Lock",
          permission: "permission:manage",
        },
      },
      {
        path: "/profile",
        name: "Profile",
        component: () => import("@/views/Profile.vue"),
        meta: {
          title: "个人信息",
          icon: "Avatar",
          hidden: true,
        },
      },
      {
        path: "/products",
        name: "Products",
        component: () => import("@/views/products/ProductList.vue"),
        meta: {
          title: "商品管理",
          icon: "Goods",
          permission: "product:view",
        },
      },
      {
        path: "/products/add",
        name: "AddProduct",
        component: () => import("@/views/products/AddProduct.vue"),
        meta: {
          title: "添加商品",
          permission: "product:add",
          hidden: true,
        },
      },
      {
        path: "/products/edit/:id",
        name: "EditProduct",
        component: () => import("@/views/products/EditProduct.vue"),
        meta: {
          title: "编辑商品",
          permission: "product:edit",
          hidden: true,
        },
      },
      {
        path: "/orders",
        name: "Orders",
        component: () => import("@/views/orders/OrderList.vue"),
        meta: {
          title: "订单管理",
          icon: "ShoppingBag",
          permission: "order:view",
        },
      },
      {
        path: "/moments",
        name: "Moments",
        component: () => import("@/views/moments/MomentList.vue"),
        meta: {
          title: "朋友圈管理",
          icon: "ChatDotRound",
          permission: "moment:view",
        },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFound.vue"),
    meta: { title: "页面不存在" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // 设置页面标题
  document.title = to.meta.title
    ? `${to.meta.title} - 后台管理系统`
    : "后台管理系统";

  // 检查是否需要登录
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    ElMessage.warning("请先登录");
    next("/login");
    return;
  }

  // 检查权限
  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    ElMessage.error("权限不足");
    next("/dashboard");
    return;
  }

  // 已登录用户访问登录页面，重定向到首页
  if (
    authStore.isLoggedIn &&
    (to.path === "/login" || to.path === "/register")
  ) {
    next("/dashboard");
    return;
  }

  next();
});

export default router;
