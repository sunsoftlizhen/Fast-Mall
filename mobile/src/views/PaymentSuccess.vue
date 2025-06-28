<template>
  <div class="payment-success">
    <!-- 导航栏 -->
    <van-nav-bar
      title="支付结果"
      left-arrow
      @click-left="goHome"
      fixed
      placeholder
    />

    <!-- 支付成功状态 -->
    <div class="success-section">
      <div class="success-icon">
        <van-icon name="checked" size="60px" color="#07c160" />
      </div>
      <div class="success-title">支付成功</div>
      <div class="success-amount">¥{{ paymentAmount }}</div>
      <div class="success-desc">您的订单已支付成功，请等待商家发货</div>
    </div>

    <!-- 订单信息 -->
    <div class="order-info">
      <div class="info-item">
        <span class="label">订单号</span>
        <span class="value">{{ orderInfo.order_no }}</span>
      </div>
      <div class="info-item">
        <span class="label">支付时间</span>
        <span class="value">{{ formatTime(orderInfo.paid_at) }}</span>
      </div>
      <div class="info-item">
        <span class="label">支付方式</span>
        <span class="value">{{
          getPaymentMethodText(orderInfo.payment_method)
        }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <van-button
        type="default"
        size="large"
        @click="viewOrder"
        class="action-btn"
      >
        查看订单
      </van-button>
      <van-button
        type="primary"
        size="large"
        @click="continueShopping"
        class="action-btn"
      >
        继续购物
      </van-button>
    </div>

    <!-- 温馨提示 -->
    <div class="tips-section">
      <div class="tips-title">温馨提示</div>
      <div class="tips-content">
        <p>• 您可以在"我的订单"中查看订单详情</p>
        <p>• 商家将在1-2个工作日内为您发货</p>
        <p>• 如有问题请联系客服</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast } from "vant";
import api from "../utils/api";

const router = useRouter();
const route = useRoute();

// 数据
const orderInfo = ref({});
const paymentAmount = ref(0);

// 支付方式映射
const paymentMethodMap = {
  balance: "钱包余额",
  alipay: "支付宝",
  wechat: "微信支付",
};

// 获取支付方式文本
const getPaymentMethodText = (method) => {
  return paymentMethodMap[method] || method;
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return "";
  return new Date(time).toLocaleString("zh-CN");
};

// 查看订单
const viewOrder = () => {
  router.push(`/order-detail/${orderInfo.value.id}`);
};

// 继续购物
const continueShopping = () => {
  router.push("/home");
};

// 返回首页
const goHome = () => {
  router.push("/home");
};

// 加载订单信息
const loadOrderInfo = async () => {
  try {
    const orderId = route.query.orderId;
    const amount = route.query.amount;

    if (amount) {
      paymentAmount.value = parseFloat(amount);
    }

    if (orderId) {
      const response = await api.get(`/mobile/orders/${orderId}`);
      if (response.success) {
        orderInfo.value = response.data;
      }
    }
  } catch (error) {
    console.error("获取订单信息失败:", error);
  }
};

// 页面加载
onMounted(() => {
  loadOrderInfo();
});
</script>

<style scoped>
.payment-success {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 20px;
}

.success-section {
  background: white;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 10px;
}

.success-icon {
  margin-bottom: 20px;
}

.success-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.success-amount {
  font-size: 32px;
  font-weight: bold;
  color: #07c160;
  margin-bottom: 15px;
}

.success-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.order-info {
  background: white;
  padding: 20px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 14px;
  color: #666;
}

.value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.action-buttons {
  padding: 20px;
  display: flex;
  gap: 15px;
}

.action-btn {
  flex: 1;
}

.tips-section {
  background: white;
  padding: 20px;
  margin-bottom: 10px;
}

.tips-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.tips-content p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 8px 0;
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
