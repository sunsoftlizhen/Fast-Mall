import { defineStore } from "pinia";
import { ref } from "vue";
import { showToast } from "vant";
import {
  login as apiLogin,
  register as apiRegister,
  getUserInfo,
} from "../utils/api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(localStorage.getItem("token") || "");
  const isLoggedIn = ref(false);

  // 登录
  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      if (response.success) {
        token.value = response.data.token;
        user.value = response.data.user;
        isLoggedIn.value = true;
        localStorage.setItem("token", response.data.token);
        showToast("登录成功");
        return true;
      } else {
        showToast(response.message || "登录失败");
        return false;
      }
    } catch (error) {
      showToast("登录失败：" + (error.message || "网络错误"));
      return false;
    }
  };

  // 注册
  const register = async (credentials) => {
    try {
      const response = await apiRegister(credentials);
      if (response.success) {
        showToast("注册成功，请登录");
        return true;
      } else {
        showToast(response.message || "注册失败");
        return false;
      }
    } catch (error) {
      showToast("注册失败：" + (error.message || "网络错误"));
      return false;
    }
  };

  // 登出
  const logout = () => {
    user.value = null;
    token.value = "";
    isLoggedIn.value = false;
    localStorage.removeItem("token");
    showToast("已退出登录");
  };

  // 检查认证状态
  const checkAuth = async () => {
    if (token.value) {
      try {
        const response = await getUserInfo();
        if (response.success) {
          user.value = response.data;
          isLoggedIn.value = true;
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
  };

  // 更新用户信息
  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData };
  };

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
  };
});
