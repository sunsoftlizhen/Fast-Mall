import axios from "axios";
import { showToast } from "vant";

// 创建axios实例
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem("token");
        showToast("登录已过期，请重新登录");
        // 可以在这里跳转到登录页面
      } else if (status === 403) {
        showToast("权限不足");
      } else if (status === 500) {
        showToast("服务器错误");
      } else {
        showToast(data.message || "请求失败");
      }
    } else {
      showToast("网络错误");
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const login = (credentials) => api.post("/auth/login", credentials);
export const register = (credentials) =>
  api.post("/auth/register", credentials);
export const getUserInfo = () => api.get("/auth/me");

// 商品相关API
export const getProducts = (params) => api.get("/mobile/products", { params });
export const getProductDetail = (id) => api.get(`/mobile/products/${id}`);

// 购物车相关API
export const addToCart = (data) => api.post("/mobile/cart", data);
export const getCartList = () => api.get("/mobile/cart");
export const updateCartItem = (id, data) => api.put(`/mobile/cart/${id}`, data);
export const removeCartItem = (id) => api.delete(`/mobile/cart/${id}`);

// 订单相关API
export const createOrder = (data) => api.post("/mobile/orders", data);
export const getOrderList = (params) => api.get("/mobile/orders", { params });
export const getOrderDetail = (id) => api.get(`/mobile/orders/${id}`);
export const payOrder = (id) => api.post(`/mobile/orders/${id}/pay`);

// 钱包相关API
export const getWallet = () => api.get("/mobile/wallet");
export const getWalletTransactions = (params) =>
  api.get("/mobile/wallet/transactions", { params });

// 朋友圈相关API
export const getMoments = (params) => api.get("/moments", { params });
export const createMoment = (data) => api.post("/moments", data);
export const commentMoment = (id, data) =>
  api.post(`/moments/${id}/comment`, data);
export const toggleLikeMoment = (id) => api.post(`/moments/${id}/like`);
export const getUserMoments = (params) => api.get("/moments/my", { params });
export const deleteMoment = (id) => api.delete(`/moments/${id}`);

export default api;
