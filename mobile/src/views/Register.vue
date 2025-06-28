<template>
  <div class="register">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="注册" left-arrow @click-left="$router.back()" />

    <!-- 注册表单 -->
    <div class="form-container">
      <div class="logo-section">
        <div class="logo">🛒</div>
        <div class="app-name">移动商城</div>
        <div class="slogan">注册账号，开启购物之旅</div>
      </div>

      <van-form @submit="handleRegister">
        <van-field
          v-model="form.username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
          left-icon="contact"
        />

        <van-field
          v-model="form.email"
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          type="email"
          left-icon="envelop-o"
          :rules="emailRules"
        />

        <van-field
          v-model="form.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          left-icon="phone-o"
        />

        <van-field
          v-model="form.password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          type="password"
          left-icon="lock"
          :rules="[{ required: true, message: '请输入密码' }]"
        />

        <van-field
          v-model="form.confirmPassword"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          type="password"
          left-icon="lock"
          :rules="confirmPasswordRules"
        />

        <div class="form-buttons">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            注册
          </van-button>
        </div>
      </van-form>

      <!-- 切换到登录 -->
      <div class="switch-mode">
        <span>
          已有账号？
          <van-button type="primary" plain size="small" @click="goToLogin">
            立即登录
          </van-button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// 数据
const loading = ref(false);
const form = ref({
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

// 表单验证规则
const emailRules = computed(() => [
  { required: true, message: "请输入邮箱" },
  { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "请输入正确的邮箱格式" },
]);

const confirmPasswordRules = computed(() => [
  { required: true, message: "请确认密码" },
  {
    validator: (value) => value === form.value.password,
    message: "两次输入的密码不一致",
  },
]);

// 处理注册
const handleRegister = async () => {
  loading.value = true;

  try {
    const success = await authStore.register({
      username: form.value.username,
      email: form.value.email,
      phone: form.value.phone,
      password: form.value.password,
    });

    if (success) {
      // 注册成功后跳转到登录页面
      router.push("/login");
    }
  } catch (error) {
    showToast(error.message || "注册失败");
  } finally {
    loading.value = false;
  }
};

// 跳转到登录页面
const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.register {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.form-container {
  padding: 40px 20px 20px;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.logo {
  font-size: 60px;
  margin-bottom: 16px;
}

.app-name {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.slogan {
  font-size: 14px;
  opacity: 0.8;
}

.van-form {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.form-buttons {
  margin-top: 24px;
}

.switch-mode {
  text-align: center;
  color: white;
  font-size: 14px;
}

/* 导航栏样式覆盖 */
:deep(.van-nav-bar) {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  --van-nav-bar-text-color: white;
  --van-nav-bar-icon-color: white;
  --van-nav-bar-title-text-color: white;
}
</style>
