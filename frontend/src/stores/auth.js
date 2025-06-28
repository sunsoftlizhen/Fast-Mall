import { defineStore } from "pinia";
import { ref, computed } from "vue";
import request from "@/utils/request";

export const useAuthStore = defineStore("auth", () => {
  // 状态
  const token = ref(localStorage.getItem("token") || "");
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));

  // 计算属性
  const isLoggedIn = computed(() => !!token.value);
  const hasPermission = computed(() => (permission) => {
    if (!user.value || !user.value.permissions) return false;
    return (
      user.value.permissions.includes(permission) ||
      user.value.role_name === "管理员"
    );
  });

  // 登录
  const login = async (credentials) => {
    try {
      const response = await request.post("/auth/login", credentials);
      token.value = response.data.token;
      user.value = response.data.user;

      // 保存到本地存储
      localStorage.setItem("token", token.value);
      localStorage.setItem("user", JSON.stringify(user.value));

      return response;
    } catch (error) {
      throw error;
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      const response = await request.post("/auth/register", userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      const response = await request.get("/auth/me");
      user.value = response.data;
      localStorage.setItem("user", JSON.stringify(user.value));
      return response;
    } catch (error) {
      throw error;
    }
  };

  // 登出
  const logout = () => {
    token.value = "";
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return {
    token,
    user,
    isLoggedIn,
    hasPermission,
    login,
    register,
    getCurrentUser,
    logout,
  };
});
