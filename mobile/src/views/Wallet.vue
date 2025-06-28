<template>
  <div class="wallet">
    <!-- 导航栏 -->
    <van-nav-bar
      title="我的钱包"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <!-- 钱包余额 -->
    <div class="wallet-balance">
      <div class="balance-card">
        <div class="balance-label">钱包余额</div>
        <div class="balance-amount">¥{{ walletInfo.balance || "0.00" }}</div>
        <div class="balance-actions">
          <van-button type="primary" size="small" @click="showRecharge = true">
            充值
          </van-button>
        </div>
      </div>
    </div>

    <!-- 交易记录 -->
    <div class="transaction-section">
      <div class="section-header">
        <div class="section-title">交易记录</div>
      </div>

      <div v-if="transactions.length > 0" class="transaction-list">
        <div
          v-for="transaction in transactions"
          :key="transaction.id"
          class="transaction-item"
        >
          <div class="transaction-icon">
            <van-icon
              :name="getTransactionIcon(transaction.type)"
              :color="getTransactionColor(transaction.type)"
              size="20"
            />
          </div>

          <div class="transaction-info">
            <div class="transaction-title">
              {{ getTransactionTitle(transaction.type) }}
            </div>
            <div class="transaction-desc">
              {{ transaction.description }}
            </div>
            <div class="transaction-time">
              {{ formatTime(transaction.createdAt) }}
            </div>
          </div>

          <div class="transaction-amount" :class="transaction.type">
            {{ transaction.type === "income" ? "+" : "-" }}¥{{
              transaction.amount
            }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-transactions">
        <van-empty
          image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
          description="暂无交易记录"
        />
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <van-loading size="24px">加载中...</van-loading>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <van-popup v-model="showRecharge" position="bottom" round>
      <div class="recharge-popup">
        <div class="popup-header">
          <div class="popup-title">钱包充值</div>
          <van-icon name="cross" @click="showRecharge = false" />
        </div>

        <div class="recharge-amounts">
          <div
            v-for="amount in rechargeAmounts"
            :key="amount"
            class="amount-item"
            :class="{ active: selectedAmount === amount }"
            @click="selectedAmount = amount"
          >
            ¥{{ amount }}
          </div>
        </div>

        <div class="custom-amount">
          <van-field
            v-model="customAmount"
            type="number"
            placeholder="自定义金额"
            label="其他金额"
          />
        </div>

        <div class="recharge-actions">
          <van-button
            type="primary"
            block
            size="large"
            @click="handleRecharge"
            :loading="recharging"
          >
            立即充值
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import api from "../utils/api";

const router = useRouter();

// 数据
const walletInfo = ref({});
const transactions = ref([]);
const loading = ref(false);
const showRecharge = ref(false);
const recharging = ref(false);
const selectedAmount = ref(null);
const customAmount = ref("");

// 充值金额选项
const rechargeAmounts = [10, 20, 50, 100, 200, 500];

// 计算实际充值金额
const rechargeAmount = computed(() => {
  return selectedAmount.value || parseFloat(customAmount.value) || 0;
});

// 获取钱包信息
const fetchWalletInfo = async () => {
  try {
    const response = await api.get("/mobile/wallet");
    walletInfo.value = response.data;
  } catch (error) {
    console.error("获取钱包信息失败:", error);
    showToast("获取钱包信息失败");
  }
};

// 获取交易记录
const fetchTransactions = async () => {
  loading.value = true;

  try {
    const response = await api.get("/mobile/wallet/transactions");
    transactions.value = response.data;
  } catch (error) {
    console.error("获取交易记录失败:", error);
    showToast("获取交易记录失败");
  } finally {
    loading.value = false;
  }
};

// 获取交易图标
const getTransactionIcon = (type) => {
  const iconMap = {
    income: "plus",
    expense: "minus",
    recharge: "plus",
    payment: "credit-pay",
  };
  return iconMap[type] || "records";
};

// 获取交易颜色
const getTransactionColor = (type) => {
  const colorMap = {
    income: "#4caf50",
    expense: "#f44336",
    recharge: "#2196f3",
    payment: "#ff9800",
  };
  return colorMap[type] || "#666";
};

// 获取交易标题
const getTransactionTitle = (type) => {
  const titleMap = {
    income: "收入",
    expense: "支出",
    recharge: "充值",
    payment: "支付",
  };
  return titleMap[type] || "交易";
};

// 格式化时间
const formatTime = (time) => {
  return new Date(time).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 处理充值
const handleRecharge = async () => {
  const amount = rechargeAmount.value;

  if (!amount || amount <= 0) {
    showToast("请输入有效的充值金额");
    return;
  }

  recharging.value = true;

  try {
    const response = await api.post("/mobile/wallet/recharge", { amount });

    if (response.data.success) {
      showToast("充值成功");
      showRecharge.value = false;
      selectedAmount.value = null;
      customAmount.value = "";

      // 刷新钱包信息和交易记录
      fetchWalletInfo();
      fetchTransactions();
    }
  } catch (error) {
    showToast(error.response?.data?.message || "充值失败");
  } finally {
    recharging.value = false;
  }
};

onMounted(() => {
  fetchWalletInfo();
  fetchTransactions();
});
</script>

<style scoped>
.wallet {
  min-height: 100vh;
  background: #f8f8f8;
}

.wallet-balance {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.balance-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: white;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
}

.transaction-section {
  margin-top: 8px;
  background: white;
}

.section-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.transaction-list {
  padding: 8px 0;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transaction-info {
  flex: 1;
}

.transaction-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.transaction-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.transaction-time {
  font-size: 12px;
  color: #ccc;
}

.transaction-amount {
  font-size: 16px;
  font-weight: bold;
}

.transaction-amount.income {
  color: #4caf50;
}

.transaction-amount.expense {
  color: #f44336;
}

.empty-transactions {
  padding: 60px 16px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 充值弹窗样式 */
.recharge-popup {
  padding: 16px;
  min-height: 300px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.recharge-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.amount-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.amount-item.active {
  border-color: #1989fa;
  background: #e8f3ff;
  color: #1989fa;
}

.custom-amount {
  margin-bottom: 24px;
}

.recharge-actions {
  margin-top: 16px;
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
