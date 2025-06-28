<template>
  <div class="address-list">
    <!-- 导航栏 -->
    <van-nav-bar
      title="收货地址"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
      class="nav-bar"
    />

    <!-- 地址列表 -->
    <div class="address-content">
      <!-- 空状态 -->
      <div v-if="addresses.length === 0" class="empty-state">
        <van-empty
          image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
          description="还没有收货地址"
        >
          <template #description>
            <div class="empty-description">
              <p>还没有收货地址</p>
              <p class="empty-tip">添加地址后可以快速下单</p>
            </div>
          </template>
        </van-empty>
        <div class="empty-actions">
          <van-button
            type="primary"
            @click="addAddress"
            class="add-btn"
            round
            size="large"
          >
            <van-icon name="plus" />
            添加收货地址
          </van-button>
        </div>
      </div>

      <!-- 地址卡片列表 -->
      <div v-else class="address-cards">
        <div
          v-for="address in addresses"
          :key="address.id"
          class="address-card"
          @click="editAddress(address)"
        >
          <!-- 默认地址标识 -->
          <div v-if="address.is_default" class="default-badge">
            <van-icon name="star" />
            <span>默认地址</span>
          </div>

          <!-- 地址主体内容 -->
          <div class="address-main">
            <!-- 用户信息行 -->
            <div class="user-info">
              <div class="user-details">
                <van-icon name="contact" class="contact-icon" />
                <span class="name">{{ address.name }}</span>
                <span class="phone">{{ address.phone }}</span>
              </div>
            </div>

            <!-- 地址信息行 -->
            <div class="address-info">
              <van-icon name="location-o" class="location-icon" />
              <div class="address-text">
                <div class="address-area">
                  {{ address.province }} {{ address.city }}
                  {{ address.district }}
                </div>
                <div class="address-detail">
                  {{ address.address }}
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮区域 -->
          <div class="address-actions">
            <van-button
              size="small"
              plain
              :type="address.is_default ? 'default' : 'primary'"
              @click.stop="setDefault(address)"
              :disabled="address.is_default"
              class="action-btn"
            >
              <van-icon name="star-o" v-if="!address.is_default" />
              {{ address.is_default ? "默认" : "设为默认" }}
            </van-button>

            <van-button
              size="small"
              plain
              @click.stop="editAddress(address)"
              class="action-btn edit-btn"
            >
              <van-icon name="edit" />
              编辑
            </van-button>

            <van-button
              size="small"
              plain
              color="#ff4444"
              @click.stop="deleteAddress(address)"
              class="action-btn delete-btn"
            >
              <van-icon name="delete-o" />
              删除
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮添加按钮 -->
    <div class="floating-add" v-if="addresses.length > 0" @click="addAddress">
      <van-icon name="plus" />
    </div>

    <!-- 底部安全区域 -->
    <div class="safe-area"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showConfirmDialog } from "vant";
import api from "../utils/api";

const router = useRouter();
const addresses = ref([]);
const loading = ref(false);

// 获取地址列表
const loadAddresses = async () => {
  try {
    loading.value = true;
    const response = await api.get("/mobile/addresses");
    if (response.success) {
      addresses.value = response.data;
    } else {
      showToast(response.message || "获取地址失败");
    }
  } catch (error) {
    console.error("获取地址失败:", error);
    showToast("获取地址失败");
  } finally {
    loading.value = false;
  }
};

// 添加地址
const addAddress = () => {
  router.push("/address/add");
};

// 编辑地址
const editAddress = (address) => {
  router.push(`/address/edit/${address.id}`);
};

// 设置默认地址
const setDefault = async (address) => {
  try {
    const response = await api.post(`/mobile/addresses/${address.id}/default`);
    if (response.success) {
      showToast("设置成功");
      loadAddresses();
    } else {
      showToast(response.message || "设置失败");
    }
  } catch (error) {
    console.error("设置默认地址失败:", error);
    showToast("设置失败");
  }
};

// 删除地址
const deleteAddress = async (address) => {
  try {
    await showConfirmDialog({
      title: "确认删除",
      message: "确定要删除这个地址吗？",
    });

    const response = await api.delete(`/mobile/addresses/${address.id}`);
    if (response.success) {
      showToast("删除成功");
      loadAddresses();
    } else {
      showToast(response.message || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除地址失败:", error);
      showToast("删除失败");
    }
  }
};

// 页面加载
onMounted(() => {
  loadAddresses();
});
</script>

<style scoped>
.address-list {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
}

.nav-bar {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  --van-nav-bar-text-color: white;
  --van-nav-bar-icon-color: white;
  --van-nav-bar-title-text-color: white;
}

.address-content {
  padding: 16px;
  padding-bottom: 100px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 80px 20px 40px;
}

.empty-description p {
  margin: 0;
  line-height: 1.6;
}

.empty-description p:first-child {
  font-size: 16px;
  color: #323233;
  font-weight: 500;
}

.empty-tip {
  font-size: 14px;
  color: #969799;
  margin-top: 8px;
}

.empty-actions {
  margin-top: 32px;
}

.add-btn {
  min-width: 160px;
  height: 44px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

/* 地址卡片容器 */
.address-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 地址卡片样式 */
.address-card {
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.address-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 默认地址标识 */
.default-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom-left-radius: 8px;
  font-weight: 500;
}

.default-badge .van-icon {
  font-size: 12px;
}

/* 地址主体内容 */
.address-main {
  padding: 20px;
  padding-bottom: 16px;
}

/* 用户信息行 */
.user-info {
  margin-bottom: 16px;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-icon {
  color: #667eea;
  font-size: 16px;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.phone {
  font-size: 14px;
  color: #646566;
  background: #f7f8fa;
  padding: 2px 8px;
  border-radius: 12px;
}

/* 地址信息行 */
.address-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.location-icon {
  color: #667eea;
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.address-text {
  flex: 1;
  line-height: 1.5;
}

.address-area {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 4px;
}

.address-detail {
  font-size: 14px;
  color: #646566;
}

/* 操作按钮区域 */
.address-actions {
  display: flex;
  justify-content: space-between;
  padding: 0 20px 16px;
  gap: 8px;
}

.action-btn {
  flex: 1;
  height: 36px;
  font-size: 13px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.action-btn .van-icon {
  font-size: 14px;
}

.edit-btn {
  border-color: #52c41a;
  color: #52c41a;
}

.edit-btn:hover {
  background: #52c41a;
  color: white;
}

.delete-btn {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.delete-btn:hover {
  background: #ff4d4f;
  color: white;
}

/* 悬浮添加按钮 */
.floating-add {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
}

.floating-add:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.floating-add .van-icon {
  color: white;
  font-size: 24px;
}

/* 底部安全区域 */
.safe-area {
  height: 20px;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .address-content {
    padding: 12px;
  }

  .address-main {
    padding: 16px;
  }

  .action-btn {
    font-size: 12px;
    height: 32px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .address-list {
    background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .address-card {
    background: #2d2d2d;
    border: 1px solid #404040;
  }

  .name {
    color: #ffffff;
  }

  .address-area {
    color: #e5e5e5;
  }

  .address-detail {
    color: #b3b3b3;
  }

  .phone {
    background: #404040;
    color: #e5e5e5;
  }
}
</style>
