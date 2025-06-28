<template>
  <div class="orders">
    <!-- 导航栏 -->
    <van-nav-bar
      title="我的订单"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <!-- 状态筛选标签 -->
    <div class="status-tabs">
      <van-tabs :active="activeTab" @change="onTabChange" sticky>
        <van-tab title="全部" name="all" />
        <van-tab title="待支付" name="pending" />
        <van-tab title="已支付" name="paid" />
        <van-tab title="待发货" name="confirmed" />
        <van-tab title="已发货" name="shipped" />
        <van-tab title="已签收" name="delivered" />
        <van-tab title="已取消" name="cancelled" />
      </van-tabs>
    </div>

    <!-- 订单列表 -->
    <div class="order-list">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          :loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div
            v-for="order in orders"
            :key="order.id"
            class="order-item"
            @click="viewOrderDetail(order)"
          >
            <div class="order-header">
              <span class="order-no">订单号：{{ order.order_no }}</span>
              <span
                class="order-status"
                :class="getStatusClass(order.order_status)"
              >
                {{ getStatusText(order.order_status) }}
              </span>
            </div>

            <!-- 商品列表 -->
            <div class="goods-list">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="goods-item"
              >
                <van-image
                  :src="item.product_image || '/api/placeholder/60/60'"
                  width="60px"
                  height="60px"
                  fit="cover"
                />
                <div class="goods-info">
                  <div class="goods-name">{{ item.product_name }}</div>
                  <div class="goods-spec" v-if="item.spec_name">
                    {{ item.spec_name }}
                  </div>
                  <div class="goods-price">
                    ¥{{ item.price }} × {{ item.quantity }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 订单金额 -->
            <div class="order-amount">
              <span>共{{ getTotalQuantity(order.items) }}件商品 合计：</span>
              <span class="amount">¥{{ order.total_amount }}</span>
            </div>

            <!-- 操作按钮 -->
            <div class="order-actions">
              <van-button
                v-if="order.order_status === 'pending'"
                size="small"
                @click.stop="cancelOrder(order)"
              >
                取消订单
              </van-button>
              <van-button
                v-if="order.order_status === 'pending'"
                type="primary"
                size="small"
                @click.stop="payOrder(order)"
              >
                立即支付
              </van-button>
              <van-button
                v-if="order.order_status === 'shipped'"
                type="primary"
                size="small"
                @click.stop="confirmReceive(order)"
              >
                确认收货
              </van-button>
              <van-button
                v-if="order.order_status === 'delivered'"
                size="small"
                @click.stop="rateOrder(order)"
              >
                评价
              </van-button>
              <van-button
                v-if="['delivered', 'cancelled'].includes(order.order_status)"
                size="small"
                @click.stop="buyAgain(order)"
              >
                再次购买
              </van-button>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>

      <!-- 空状态 -->
      <div v-if="orders.length === 0 && !loading" class="empty-state">
        <van-empty description="暂无订单">
          <van-button type="primary" @click="$router.push('/home')">
            去购物
          </van-button>
        </van-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast, showConfirmDialog } from "vant";
import api from "../utils/api";

const router = useRouter();
const route = useRoute();

// 数据
const orders = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const activeTab = ref("all");
const page = ref(1);
const pageSize = 10;

// 订单状态映射
const statusMap = {
  pending: "待支付",
  paid: "已支付",
  confirmed: "待发货",
  shipped: "已发货",
  delivered: "已签收",
  cancelled: "已取消",
  rated: "已评价",
};

// 获取订单状态文本
const getStatusText = (status) => {
  return statusMap[status] || status;
};

// 获取订单状态样式类
const getStatusClass = (status) => {
  return `status-${status}`;
};

// 计算订单商品总数量
const getTotalQuantity = (items) => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

// 获取订单列表
const fetchOrders = async (reset = false) => {
  if (reset) {
    page.value = 1;
    finished.value = false;
    orders.value = [];
  }

  try {
    const params = {
      page: page.value,
      pageSize,
      status: activeTab.value === "all" ? "" : activeTab.value,
    };

    const response = await api.get("/mobile/orders", { params });

    if (response.success) {
      const newOrders = response.data.orders || [];

      if (reset) {
        orders.value = newOrders;
      } else {
        orders.value.push(...newOrders);
      }

      // 判断是否还有更多数据
      if (newOrders.length < pageSize) {
        finished.value = true;
      } else {
        page.value++;
      }
    }
  } catch (error) {
    console.error("获取订单列表失败:", error);
    showToast("获取订单列表失败");
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true;
  fetchOrders(true);
};

// 加载更多
const onLoad = () => {
  if (!finished.value) {
    loading.value = true;
    fetchOrders();
  }
};

// 切换标签
const onTabChange = (name) => {
  activeTab.value = name;
  fetchOrders(true);
};

// 查看订单详情
const viewOrderDetail = (order) => {
  router.push(`/order-detail/${order.id}`);
};

// 支付订单
const payOrder = (order) => {
  router.push(`/payment/${order.id}`);
};

// 取消订单
const cancelOrder = async (order) => {
  try {
    await showConfirmDialog({
      title: "确认取消",
      message: "确定要取消这个订单吗？",
    });

    const response = await api.put(`/mobile/orders/${order.id}/cancel`);

    if (response.success) {
      showToast("订单已取消");
      fetchOrders(true);
    } else {
      showToast(response.message || "取消失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("取消订单失败:", error);
      showToast("取消失败");
    }
  }
};

// 确认收货
const confirmReceive = async (order) => {
  try {
    await showConfirmDialog({
      title: "确认收货",
      message: "确认已收到商品？",
    });

    const response = await api.put(`/mobile/orders/${order.id}/receive`);

    if (response.success) {
      showToast("确认收货成功");
      fetchOrders(true);
    } else {
      showToast(response.message || "操作失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("确认收货失败:", error);
      showToast("操作失败");
    }
  }
};

// 评价订单
const rateOrder = (order) => {
  router.push(`/order-rate/${order.id}`);
};

// 再次购买
const buyAgain = async (order) => {
  try {
    // 将订单商品重新加入购物车
    for (const item of order.items) {
      await api.post("/mobile/cart", {
        product_id: item.product_id,
        quantity: item.quantity,
      });
    }

    showToast("已加入购物车");
    router.push("/cart");
  } catch (error) {
    console.error("再次购买失败:", error);
    showToast("操作失败");
  }
};

// 页面加载
onMounted(() => {
  // 从路由参数获取初始状态
  const status = route.query.status;
  if (status && statusMap[status]) {
    activeTab.value = status;
  }

  fetchOrders(true);
});
</script>

<style scoped>
.orders {
  min-height: 100vh;
  background: #f8f8f8;
}

.status-tabs {
  background: white;
}

.order-list {
  padding: 0 0 20px 0;
}

.order-item {
  background: white;
  margin: 10px 15px;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 12px;
  color: #666;
}

.order-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.status-pending {
  color: #ff9800;
  background: #fff3e0;
}

.status-paid {
  color: #2196f3;
  background: #e3f2fd;
}

.status-confirmed {
  color: #9c27b0;
  background: #f3e5f5;
}

.status-shipped {
  color: #673ab7;
  background: #ede7f6;
}

.status-delivered {
  color: #4caf50;
  background: #e8f5e8;
}

.status-cancelled {
  color: #f44336;
  background: #ffebee;
}

.status-rated {
  color: #795548;
  background: #efebe9;
}

.goods-list {
  margin-bottom: 15px;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-spec {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.goods-price {
  font-size: 12px;
  color: #666;
}

.order-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
}

.amount {
  color: #ff4444;
  font-weight: bold;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-state {
  padding: 60px 20px;
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
