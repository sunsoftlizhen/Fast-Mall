<template>
  <div class="profile">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="我的" fixed placeholder class="nav-bar" />

    <!-- 用户信息卡片 -->
    <div class="profile-header">
      <div class="user-card">
        <div class="user-avatar-section">
          <div class="avatar-wrapper">
            <van-image
              round
              width="70"
              height="70"
              :src="userInfo.avatar || '/default-avatar.png'"
              class="user-avatar"
            />
            <div class="avatar-decoration"></div>
          </div>

          <div class="user-details">
            <h2 class="username">{{ userInfo.username || "点击登录" }}</h2>
            <div class="user-meta">
              <span v-if="userInfo.email" class="user-email">
                <van-icon name="envelop-o" />
                {{ userInfo.email }}
              </span>
              <span v-if="userInfo.phone" class="user-phone">
                <van-icon name="phone-o" />
                {{ userInfo.phone }}
              </span>
            </div>
          </div>

          <div class="user-actions">
            <van-button
              v-if="!isLoggedIn"
              type="primary"
              size="small"
              round
              @click="goToLogin"
              class="login-btn"
            >
              立即登录
            </van-button>
            <van-icon v-else name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- 钱包余额卡片 -->
        <div v-if="isLoggedIn" class="wallet-card" @click="goToWallet">
          <div class="wallet-info">
            <div class="wallet-icon">
              <van-icon name="balance-pay" />
            </div>
            <div class="wallet-details">
              <span class="wallet-label">钱包余额</span>
              <span class="wallet-amount"
                >¥{{ walletInfo.balance || "0.00" }}</span
              >
            </div>
          </div>
          <van-icon name="arrow" class="wallet-arrow" />
        </div>
      </div>
    </div>

    <!-- 快捷功能区 -->
    <div class="quick-actions">
      <div class="action-grid">
        <div class="action-item" @click="goToOrders">
          <div class="action-icon orders">
            <van-icon name="shopping-cart-o" />
          </div>
          <span>我的订单</span>
        </div>
        <div class="action-item" @click="goToWallet">
          <div class="action-icon wallet">
            <van-icon name="balance-pay" />
          </div>
          <span>我的钱包</span>
        </div>
        <div class="action-item" @click="goToMyMoments">
          <div class="action-icon moments">
            <van-icon name="friends-o" />
          </div>
          <span>我的动态</span>
        </div>
        <div class="action-item" @click="goToAddresses">
          <div class="action-icon address">
            <van-icon name="location-o" />
          </div>
          <span>收货地址</span>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-sections">
      <!-- 社交功能 -->
      <div class="menu-section">
        <div class="section-title">
          <van-icon name="chat-o" />
          <span>社交互动</span>
        </div>
        <div class="menu-items">
          <div class="menu-item" @click="goToPublish">
            <div class="item-content">
              <van-icon name="edit" class="item-icon" />
              <span class="item-title">我要说一说</span>
              <span class="item-desc">分享您的生活动态</span>
            </div>
            <van-icon name="arrow" class="item-arrow" />
          </div>

          <div class="menu-item" @click="goToMyMoments">
            <div class="item-content">
              <van-icon name="friends-o" class="item-icon" />
              <span class="item-title">我的动态</span>
              <span class="item-desc">查看我发布的动态</span>
            </div>
            <van-icon name="arrow" class="item-arrow" />
          </div>
        </div>
      </div>

      <!-- 设置选项 -->
      <div class="menu-section">
        <div class="section-title">
          <van-icon name="setting-o" />
          <span>设置</span>
        </div>
        <div class="menu-items">
          <div class="menu-item" @click="editProfile">
            <div class="item-content">
              <van-icon name="contact" class="item-icon" />
              <span class="item-title">个人资料</span>
              <span class="item-desc">编辑个人信息</span>
            </div>
            <van-icon name="arrow" class="item-arrow" />
          </div>

          <div class="menu-item" @click="showAbout">
            <div class="item-content">
              <van-icon name="info-o" class="item-icon" />
              <span class="item-title">关于我们</span>
              <span class="item-desc">应用版本信息</span>
            </div>
            <van-icon name="arrow" class="item-arrow" />
          </div>
        </div>
      </div>

      <!-- 登出区域 -->
      <div v-if="isLoggedIn" class="menu-section logout-section">
        <div class="menu-items">
          <div class="menu-item logout-item" @click="handleLogout">
            <div class="item-content">
              <van-icon name="arrow-left" class="item-icon logout-icon" />
              <span class="item-title">退出登录</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <TabBar />

    <!-- 关于我们弹窗 -->
    <van-dialog
      :show="showAboutDialog"
      @update:show="(val) => (showAboutDialog = val)"
      title="关于我们"
      message="EMSP 移动商城 v1.0.0<br/>电商与朋友圈社交平台<br/>为用户提供便捷的购物体验<br/><br/>联系邮箱：support@emsp.com<br/>客服热线：400-123-4567"
      confirm-button-text="确定"
      class="about-dialog"
    />

    <!-- 个人资料编辑弹窗 -->
    <van-action-sheet
      :show="showEditProfile"
      @update:show="(val) => (showEditProfile = val)"
      title="编辑个人资料"
      class="profile-sheet"
    >
      <div class="edit-profile-container">
        <van-form @submit="updateProfile" ref="profileFormRef">
          <div class="form-section">
            <van-field
              v-model="profileForm.username"
              name="username"
              label="用户名"
              placeholder="请输入用户名"
              :rules="[{ required: true, message: '请输入用户名' }]"
              class="profile-field"
            />
            <van-field
              v-model="profileForm.email"
              name="email"
              label="邮箱"
              placeholder="请输入邮箱"
              type="email"
              class="profile-field"
            />
            <van-field
              v-model="profileForm.phone"
              name="phone"
              label="手机号"
              placeholder="请输入手机号"
              type="tel"
              class="profile-field"
            />
          </div>

          <div class="form-buttons">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="updateLoading"
              class="update-btn"
            >
              {{ updateLoading ? "保存中..." : "保存修改" }}
            </van-button>
          </div>
        </van-form>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showConfirmDialog } from "vant";
import { useAuthStore } from "../stores/auth";
import { getWallet } from "../utils/api";
import TabBar from "../components/TabBar.vue";

const router = useRouter();
const authStore = useAuthStore();

// 数据
const walletInfo = ref({});
const showAboutDialog = ref(false);
const showEditProfile = ref(false);
const updateLoading = ref(false);
const profileFormRef = ref();
const profileForm = ref({
  username: "",
  email: "",
  phone: "",
});

// 计算属性
const isLoggedIn = computed(() => authStore.isLoggedIn);
const userInfo = computed(() => authStore.user || {});

// 获取钱包信息
const fetchWalletInfo = async () => {
  if (!isLoggedIn.value) return;

  try {
    const response = await getWallet();
    if (response.success) {
      walletInfo.value = response.data;
    }
  } catch (error) {
    console.error("获取钱包信息失败:", error);
  }
};

// 跳转到登录页面
const goToLogin = () => {
  router.push("/login");
};

// 跳转到订单页面
const goToOrders = () => {
  if (!isLoggedIn.value) {
    showToast("请先登录");
    goToLogin();
    return;
  }
  router.push("/orders");
};

// 跳转到钱包页面
const goToWallet = () => {
  if (!isLoggedIn.value) {
    showToast("请先登录");
    goToLogin();
    return;
  }
  router.push("/wallet");
};

// 跳转到发布页面
const goToPublish = () => {
  if (!isLoggedIn.value) {
    showToast("请先登录");
    goToLogin();
    return;
  }
  router.push("/publish");
};

// 跳转到我的动态
const goToMyMoments = () => {
  if (!isLoggedIn.value) {
    showToast("请先登录");
    goToLogin();
    return;
  }
  router.push("/my-moments");
};

// 跳转到收货地址
const goToAddresses = () => {
  if (!isLoggedIn.value) {
    showToast("请先登录");
    goToLogin();
    return;
  }
  router.push("/addresses");
};

// 编辑个人资料
const editProfile = () => {
  if (!isLoggedIn.value) {
    showToast("请先登录");
    goToLogin();
    return;
  }

  // 填充当前用户信息
  profileForm.value = {
    username: userInfo.value.username || "",
    email: userInfo.value.email || "",
    phone: userInfo.value.phone || "",
  };
  showEditProfile.value = true;
};

// 更新个人资料
const updateProfile = async () => {
  updateLoading.value = true;
  try {
    // 这里应该调用更新用户信息的API
    // await api.updateProfile(profileForm.value);

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    showToast("个人资料更新成功");
    showEditProfile.value = false;

    // 更新本地用户信息
    authStore.updateUser(profileForm.value);
  } catch (error) {
    showToast("更新失败，请重试");
  } finally {
    updateLoading.value = false;
  }
};

// 显示关于我们
const showAbout = () => {
  showAboutDialog.value = true;
};

// 退出登录
const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: "确认退出",
      message: "确定要退出登录吗？",
    });

    authStore.logout();
    router.push("/home");
  } catch (error) {
    // 用户取消
  }
};

// 页面加载时获取数据
onMounted(() => {
  if (isLoggedIn.value) {
    fetchWalletInfo();
  }
});
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  padding-bottom: 80px;
}

.nav-bar {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
  --van-nav-bar-text-color: white !important;
  --van-nav-bar-icon-color: white !important;
  --van-nav-bar-title-text-color: white !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

:deep(.van-nav-bar) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
  --van-nav-bar-text-color: white !important;
  --van-nav-bar-icon-color: white !important;
  --van-nav-bar-title-text-color: white !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 用户信息头部 */
.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 20px;
  position: relative;
  overflow: hidden;
}

.profile-header::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -20%;
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.user-card {
  position: relative;
  z-index: 1;
}

.user-avatar-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.avatar-wrapper {
  position: relative;
  margin-right: 16px;
}

.user-avatar {
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.avatar-decoration {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.3), transparent);
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.user-details {
  flex: 1;
  color: white;
}

.username {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-email,
.user-phone {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.9;
}

.user-actions {
  display: flex;
  align-items: center;
}

.login-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-weight: 600;
}

.arrow-icon {
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
}

/* 钱包卡片 */
.wallet-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.wallet-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.wallet-info {
  display: flex;
  align-items: center;
  flex: 1;
  color: white;
}

.wallet-icon {
  font-size: 24px;
  margin-right: 12px;
  opacity: 0.9;
}

.wallet-details {
  flex: 1;
}

.wallet-label {
  display: block;
  font-size: 13px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.wallet-amount {
  display: block;
  font-size: 20px;
  font-weight: 700;
}

.wallet-arrow {
  font-size: 16px;
  opacity: 0.7;
}

/* 快捷功能区 */
.quick-actions {
  margin: 24px 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-item {
  background: white;
  border-radius: 16px;
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f1f5;
}

.action-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  font-size: 20px;
  color: white;
}

.action-icon.orders {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.action-icon.wallet {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.action-icon.moments {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.action-icon.address {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.action-item span {
  font-size: 12px;
  color: #646566;
  font-weight: 500;
}

/* 菜单区域 */
.menu-sections {
  margin: 0 16px;
}

.menu-section {
  background: white;
  border-radius: 16px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px 8px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.section-title .van-icon {
  color: #667eea;
  font-size: 18px;
}

.menu-items {
  padding: 0 20px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f7f8fa;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.05);
  margin: 0 -20px;
  padding: 12px 20px;
  border-radius: 8px;
}

.item-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.item-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  color: #667eea;
  font-size: 18px;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  margin-right: 8px;
}

.item-desc {
  font-size: 12px;
  color: #969799;
}

.item-arrow {
  color: #c8c9cc;
  font-size: 14px;
}

/* 登出区域 */
.logout-section {
  margin-top: 24px;
}

.logout-item {
  padding: 16px 0;
}

.logout-item:hover {
  background: rgba(238, 10, 36, 0.05);
}

.logout-icon {
  color: #ee0a24;
}

.logout-item .item-title {
  color: #ee0a24;
  font-weight: 600;
}

/* 弹窗样式 */
.about-dialog {
  --van-dialog-border-radius: 16px;
}

.profile-sheet {
  --van-action-sheet-border-radius: 16px 16px 0 0;
}

.edit-profile-container {
  padding: 24px;
}

.form-section {
  margin-bottom: 24px;
}

.profile-field {
  margin-bottom: 16px;
  border-radius: 12px;
  background: #f7f8fa;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.profile-field:focus-within {
  background: white;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-buttons {
  margin-top: 24px;
}

.update-btn {
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.update-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

/* 响应式适配 */
@media (max-width: 375px) {
  .profile-header {
    padding: 20px 16px;
  }

  .action-grid {
    gap: 12px;
  }

  .action-item {
    padding: 16px 8px;
  }

  .action-icon {
    width: 36px;
    height: 36px;
  }

  .menu-sections {
    margin: 0 12px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .profile {
    background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .action-item,
  .menu-section {
    background: #2d2d2d;
    border-color: #404040;
  }

  .section-title,
  .item-title {
    color: #ffffff;
  }

  .item-desc,
  .action-item span {
    color: #b3b3b3;
  }

  .profile-field {
    background: #404040;
    color: #e5e5e5;
  }

  .profile-field:focus-within {
    background: #4a4a4a;
  }
}
</style>
