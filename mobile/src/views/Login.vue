<template>
  <div class="login">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      :title="isLogin ? '登录' : '注册'"
      left-arrow
      @click-left="$router.back()"
      class="nav-bar"
    />

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>

    <!-- 登录/注册表单 -->
    <div class="form-container">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <div class="logo">🛒</div>
          <div class="logo-glow"></div>
        </div>
        <div class="app-info">
          <h1 class="app-name">移动商城</h1>
          <p class="app-slogan">随时随地，畅享购物</p>
        </div>
      </div>

      <!-- 表单卡片 -->
      <div class="form-card">
        <!-- 表单切换标签 -->
        <div class="form-tabs">
          <div
            :class="['tab-item', { active: isLogin }]"
            @click="switchToLogin"
          >
            <van-icon name="contact" />
            <span>登录</span>
          </div>
          <div
            :class="['tab-item', { active: !isLogin }]"
            @click="switchToRegister"
          >
            <van-icon name="add-square" />
            <span>注册</span>
          </div>
          <div class="tab-indicator" :class="{ register: !isLogin }"></div>
        </div>

        <!-- 表单内容 -->
        <div class="form-content">
          <van-form @submit="handleSubmit" ref="formRef">
            <!-- 用户名字段 -->
            <div class="field-wrapper">
              <van-field
                v-model="form.username"
                name="username"
                placeholder="请输入用户名"
                :rules="[{ required: true, message: '请输入用户名' }]"
                class="custom-field"
                clearable
              >
                <template #left-icon>
                  <van-icon name="contact" class="field-icon" />
                </template>
              </van-field>
            </div>

            <!-- 注册时的额外字段 -->
            <div v-if="!isLogin" class="register-fields">
              <div class="field-wrapper">
                <van-field
                  v-model="form.email"
                  name="email"
                  placeholder="请输入邮箱地址"
                  type="email"
                  :rules="emailRules"
                  class="custom-field"
                  clearable
                >
                  <template #left-icon>
                    <van-icon name="envelop-o" class="field-icon" />
                  </template>
                </van-field>
              </div>

              <div class="field-wrapper">
                <van-field
                  v-model="form.phone"
                  name="phone"
                  placeholder="请输入手机号码"
                  type="tel"
                  class="custom-field"
                  clearable
                >
                  <template #left-icon>
                    <van-icon name="phone-o" class="field-icon" />
                  </template>
                </van-field>
              </div>
            </div>

            <!-- 密码字段 -->
            <div class="field-wrapper">
              <van-field
                v-model="form.password"
                name="password"
                placeholder="请输入密码"
                :type="showPassword ? 'text' : 'password'"
                :rules="[{ required: true, message: '请输入密码' }]"
                class="custom-field"
              >
                <template #left-icon>
                  <van-icon name="lock" class="field-icon" />
                </template>
                <template #right-icon>
                  <van-icon
                    :name="showPassword ? 'eye-o' : 'closed-eye'"
                    class="eye-icon"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </van-field>
            </div>

            <!-- 注册时的确认密码 -->
            <div v-if="!isLogin" class="field-wrapper">
              <van-field
                v-model="form.confirmPassword"
                name="confirmPassword"
                placeholder="请再次输入密码"
                :type="showConfirmPassword ? 'text' : 'password'"
                :rules="confirmPasswordRules"
                class="custom-field"
              >
                <template #left-icon>
                  <van-icon name="lock" class="field-icon" />
                </template>
                <template #right-icon>
                  <van-icon
                    :name="showConfirmPassword ? 'eye-o' : 'closed-eye'"
                    class="eye-icon"
                    @click="showConfirmPassword = !showConfirmPassword"
                  />
                </template>
              </van-field>
            </div>

            <!-- 登录时的忘记密码 -->
            <div v-if="isLogin" class="forgot-password">
              <van-button
                type="primary"
                plain
                size="mini"
                @click="forgotPassword"
              >
                忘记密码？
              </van-button>
            </div>

            <!-- 提交按钮 -->
            <div class="submit-section">
              <van-button
                block
                type="primary"
                native-type="submit"
                :loading="loading"
                class="submit-btn"
                round
                size="large"
              >
                <van-icon :name="isLogin ? 'arrow' : 'plus'" v-if="!loading" />
                {{ loading ? "处理中..." : isLogin ? "立即登录" : "创建账号" }}
              </van-button>
            </div>
          </van-form>
        </div>
      </div>

      <!-- 快速登录 -->
      <div v-if="isLogin" class="quick-login">
        <div class="divider">
          <span>快速登录</span>
        </div>
        <div class="quick-login-options">
          <div class="quick-option" @click="quickLogin('demo')">
            <van-icon name="user-o" />
            <span>体验账号</span>
          </div>
        </div>
      </div>

      <!-- 服务条款 -->
      <div v-if="!isLogin" class="terms">
        <van-checkbox v-model="agreedToTerms" icon-size="14px">
          我已阅读并同意
          <span class="terms-link" @click="showTerms">《用户协议》</span>
          和
          <span class="terms-link" @click="showPrivacy">《隐私政策》</span>
        </van-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, toRefs } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast } from "vant";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 数据
const isLogin = ref(true);
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const agreedToTerms = ref(true);
const formRef = ref();

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

// 切换到登录模式
const switchToLogin = () => {
  isLogin.value = true;
  resetForm();
};

// 切换到注册模式
const switchToRegister = () => {
  isLogin.value = false;
  resetForm();
};

// 处理表单提交
const handleSubmit = async () => {
  // 注册时检查用户协议
  if (!isLogin.value && !agreedToTerms.value) {
    showToast("请先同意用户协议和隐私政策");
    return;
  }

  loading.value = true;

  try {
    if (isLogin.value) {
      // 登录
      const success = await authStore.login({
        username: form.value.username,
        password: form.value.password,
      });

      if (success) {
        showToast("登录成功");
        // 登录成功后跳转
        const redirect = route.query.redirect || "/home";
        router.push(redirect);
      }
    } else {
      // 注册
      const success = await authStore.register({
        username: form.value.username,
        email: form.value.email,
        phone: form.value.phone,
        password: form.value.password,
      });

      if (success) {
        showToast("注册成功");
        // 注册成功后切换到登录模式
        switchToLogin();
        form.value.username = form.value.username; // 保留用户名
      }
    }
  } catch (error) {
    showToast(error.message || "操作失败");
  } finally {
    loading.value = false;
  }
};

// 快速登录
const quickLogin = async (type) => {
  if (type === "demo") {
    loading.value = true;
    try {
      const success = await authStore.login({
        username: "testuser",
        password: "user123",
      });

      if (success) {
        showToast("体验登录成功");
        const redirect = route.query.redirect || "/home";
        router.push(redirect);
      }
    } catch (error) {
      showToast(error.message || "体验登录失败");
    } finally {
      loading.value = false;
    }
  }
};

// 忘记密码
const forgotPassword = () => {
  showToast("请联系管理员重置密码");
};

// 显示用户协议
const showTerms = () => {
  showToast("用户协议内容");
};

// 显示隐私政策
const showPrivacy = () => {
  showToast("隐私政策内容");
};

// 重置表单
const resetForm = () => {
  form.value = {
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  };
  showPassword.value = false;
  showConfirmPassword.value = false;
};

// 监听登录/注册模式切换
watch(isLogin, () => {
  // 切换模式时不完全重置，保留用户名
  const currentUsername = form.value.username;
  resetForm();
  form.value.username = currentUsername;
});
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.nav-bar {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  --van-nav-bar-text-color: white;
  --van-nav-bar-icon-color: white;
  --van-nav-bar-title-text-color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 100px;
  height: 100px;
  top: 10%;
  left: -20px;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 30%;
  right: -30px;
  animation-delay: 2s;
}

.circle-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 10%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.form-container {
  padding: 20px;
  padding-top: 40px;
  position: relative;
  z-index: 1;
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.logo-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.logo {
  font-size: 64px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 70%
  );
  border-radius: 50%;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  0% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.app-info {
  animation: fadeInUp 1s ease 0.5s both;
}

.app-name {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-slogan {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

/* 表单卡片 */
.form-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
  animation: slideUp 0.8s ease 0.3s both;
}

/* 表单标签 */
.form-tabs {
  display: flex;
  position: relative;
  background: #f8f9fa;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #969799;
  font-weight: 500;
}

.tab-item.active {
  color: #667eea;
}

.tab-item .van-icon {
  font-size: 18px;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50%;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: transform 0.3s ease;
}

.tab-indicator.register {
  transform: translateX(100%);
}

/* 表单内容 */
.form-content {
  padding: 24px;
}

.field-wrapper {
  margin-bottom: 20px;
}

.register-fields {
  animation: slideDown 0.3s ease;
}

.custom-field {
  border-radius: 12px;
  background: #f7f8fa;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  --van-field-label-width: 0;
}

.custom-field:focus-within {
  background: white;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.field-icon {
  color: #667eea;
  margin-right: 8px;
  font-size: 16px;
}

.eye-icon {
  color: #969799;
  cursor: pointer;
  transition: color 0.3s ease;
}

.eye-icon:hover {
  color: #667eea;
}

.forgot-password {
  text-align: right;
  margin: 12px 0 20px 0;
}

.submit-section {
  margin-top: 24px;
}

.submit-btn {
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.submit-btn .van-icon {
  font-size: 18px;
}

/* 快速登录 */
.quick-login {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  animation: fadeIn 0.8s ease 1s both;
}

.divider {
  text-align: center;
  position: relative;
  margin-bottom: 16px;
  color: #646566;
  font-size: 14px;
  font-weight: 500;
}

.divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e5e5, transparent);
}

.divider span {
  background: rgba(255, 255, 255, 0.95);
  padding: 0 16px;
  position: relative;
}

.quick-login-options {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.quick-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f0f1f5;
  min-width: 80px;
}

.quick-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.quick-option .van-icon {
  font-size: 24px;
  color: #667eea;
}

.quick-option span {
  font-size: 12px;
  color: #646566;
  font-weight: 500;
}

/* 服务条款 */
.terms {
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  font-size: 12px;
  animation: fadeIn 0.8s ease 1.2s both;
}

.terms-link {
  color: #667eea;
  cursor: pointer;
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 200px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 响应式适配 */
@media (max-width: 375px) {
  .form-container {
    padding: 16px;
  }

  .app-name {
    font-size: 28px;
  }

  .logo {
    font-size: 56px;
  }

  .form-content {
    padding: 20px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .form-card {
    background: #2d2d2d;
  }

  .form-tabs {
    background: #1a1a1a;
  }

  .custom-field {
    background: #404040;
    color: #e5e5e5;
  }

  .custom-field:focus-within {
    background: #4a4a4a;
  }

  .quick-login {
    background: rgba(45, 45, 45, 0.95);
  }

  .quick-option {
    background: #2d2d2d;
    border-color: #404040;
  }

  .terms {
    background: rgba(45, 45, 45, 0.9);
    color: #e5e5e5;
  }
}
</style>
