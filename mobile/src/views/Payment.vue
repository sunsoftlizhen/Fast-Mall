<template>
  <div class="payment">
    <!-- 导航栏 -->
    <van-nav-bar
      title="订单支付"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <!-- 支付金额 -->
    <div class="amount-section">
      <div class="amount-label">支付金额</div>
      <div class="amount-value">¥{{ orderAmount }}</div>
    </div>

    <!-- 订单信息 -->
    <div class="order-section">
      <div class="order-header">
        <span>订单号：{{ orderInfo.order_no }}</span>
        <span class="order-time">{{ formatTime(orderInfo.created_at) }}</span>
      </div>
      <div class="goods-list">
        <div v-for="item in orderInfo.items" :key="item.id" class="goods-item">
          <van-image
            :src="item.product_image || '/api/placeholder/50/50'"
            width="50px"
            height="50px"
            fit="cover"
          />
          <div class="goods-info">
            <div class="goods-name">{{ item.product_name }}</div>
            <div class="goods-spec">
              ¥{{ item.price }} × {{ item.quantity }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付方式 -->
    <div class="payment-section">
      <div class="section-title">支付方式</div>
      <div class="payment-method">
        <div class="method-item active">
          <van-icon name="gold-coin-o" />
          <div class="method-info">
            <div class="method-name">钱包余额</div>
            <div class="method-desc">余额：¥{{ walletBalance }}</div>
          </div>
          <van-icon name="success" color="#07c160" />
        </div>
      </div>
    </div>

    <!-- 支付密码输入 -->
    <div class="password-section" v-if="showPasswordInput">
      <div class="section-title">请输入支付密码</div>
      <van-password-input
        :value="paymentPassword"
        :length="6"
        :gutter="10"
        @focus="showKeyboard = true"
      />
      <van-number-keyboard
        v-model="paymentPassword"
        :show="showKeyboard"
        @blur="showKeyboard = false"
        @delete="onDelete"
        @close="showKeyboard = false"
        maxlength="6"
        safe-area-inset-bottom
      />
    </div>

    <!-- 底部支付按钮 -->
    <div class="pay-button">
      <van-button
        type="primary"
        size="large"
        :loading="paying"
        @click="handlePay"
        :disabled="!canPay"
      >
        {{ payButtonText }}
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast, showDialog } from "vant";
import api from "../utils/api";

const router = useRouter();
const route = useRoute();

// 数据
const orderInfo = ref({});
const walletBalance = ref(0);
const paymentPassword = ref("");
const showPasswordInput = ref(false);
const showKeyboard = ref(false);
const paying = ref(false);

// 计算属性
const orderAmount = computed(() => {
  return orderInfo.value.payment_amount || 0;
});

const canPay = computed(() => {
  return (
    orderAmount.value > 0 &&
    walletBalance.value >= orderAmount.value &&
    !paying.value
  );
});

const payButtonText = computed(() => {
  if (paying.value) return "支付中...";
  if (walletBalance.value < orderAmount.value) return "余额不足";
  return `立即支付 ¥${orderAmount.value}`;
});

// 监听支付密码输入
watch(paymentPassword, (newVal) => {
  if (newVal.length === 6) {
    showKeyboard.value = false;
    processPayment();
  }
});

// 方法
const loadOrderInfo = async () => {
  try {
    const orderId = route.params.id;
    const response = await api.get(`/mobile/orders/${orderId}`);

    if (response.success) {
      orderInfo.value = response.data;
    } else {
      showToast("获取订单信息失败");
      router.back();
    }
  } catch (error) {
    console.error("获取订单信息失败:", error);
    showToast("获取订单信息失败");
    router.back();
  }
};

const loadWalletInfo = async () => {
  try {
    const response = await api.get("/mobile/wallet");
    if (response.success) {
      walletBalance.value = response.data.balance;
    }
  } catch (error) {
    console.error("获取钱包信息失败:", error);
  }
};

const handlePay = () => {
  if (!canPay.value) {
    if (walletBalance.value < orderAmount.value) {
      showToast("钱包余额不足");
    }
    return;
  }

  showPasswordInput.value = true;
  showKeyboard.value = true;
};

const processPayment = async () => {
  try {
    paying.value = true;

    const response = await api.post(
      `/mobile/orders/${orderInfo.value.id}/pay`,
      {
        payment_method: "balance",
        payment_password: paymentPassword.value,
      }
    );

    if (response.success) {
      showToast("支付成功");

      // 跳转到支付成功页面
      router.replace({
        path: "/payment-success",
        query: {
          orderId: orderInfo.value.id,
          amount: orderAmount.value,
        },
      });
    } else {
      showToast(response.message || "支付失败");
      paymentPassword.value = "";
    }
  } catch (error) {
    console.error("支付失败:", error);
    showToast("支付失败");
    paymentPassword.value = "";
  } finally {
    paying.value = false;
  }
};

const onDelete = () => {
  paymentPassword.value = paymentPassword.value.slice(0, -1);
};

const formatTime = (time) => {
  if (!time) return "";
  return new Date(time).toLocaleString("zh-CN");
};

// 页面加载
onMounted(() => {
  loadOrderInfo();
  loadWalletInfo();
});
</script>

<style scoped>
.payment {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 80px;
}

.amount-section {
  background: white;
  padding: 30px 20px;
  text-align: center;
  margin-bottom: 10px;
}

.amount-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.amount-value {
  font-size: 32px;
  color: #ff4444;
  font-weight: bold;
}

.order-section {
  background: white;
  padding: 15px;
  margin-bottom: 10px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.order-time {
  font-size: 12px;
  color: #999;
}

.goods-list {
  max-height: 200px;
  overflow-y: auto;
}

.goods-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.goods-item:last-child {
  border-bottom: none;
}

.goods-info {
  flex: 1;
  margin-left: 10px;
}

.goods-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.goods-spec {
  font-size: 12px;
  color: #999;
}

.payment-section,
.password-section {
  background: white;
  padding: 15px;
  margin-bottom: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.payment-method {
  padding: 0;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-radius: 8px;
  border: 2px solid #e8e8e8;
}

.method-item.active {
  border-color: #07c160;
  background: #f0f9f0;
}

.method-info {
  flex: 1;
  margin-left: 15px;
}

.method-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
}

.method-desc {
  font-size: 12px;
  color: #999;
}

.pay-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 15px;
  border-top: 1px solid #eee;
}

/* 导航栏样式 */
:deep(.van-nav-bar) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  --van-nav-bar-text-color: white;
  --van-nav-bar-icon-color: white;
  --van-nav-bar-title-text-color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}
</style>
