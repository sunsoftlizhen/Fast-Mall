<template>
  <div class="checkout">
    <!-- 导航栏 -->
    <van-nav-bar
      title="确认订单"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <!-- 收货地址 -->
    <div class="address-section">
      <div v-if="selectedAddress" class="address-card" @click="selectAddress">
        <div class="address-info">
          <div class="address-header">
            <span class="name">{{ selectedAddress.name }}</span>
            <span class="phone">{{ selectedAddress.phone }}</span>
          </div>
          <div class="address-detail">
            {{ selectedAddress.province }} {{ selectedAddress.city }}
            {{ selectedAddress.district }} {{ selectedAddress.address }}
          </div>
        </div>
        <van-icon name="arrow" />
      </div>
      <div v-else class="no-address" @click="selectAddress">
        <van-icon name="location-o" />
        <span>请选择收货地址</span>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 商品信息 -->
    <div class="goods-section">
      <div class="section-title">商品信息</div>
      <div v-for="item in orderItems" :key="item.id" class="goods-item">
        <van-image
          :src="item.image || '/api/placeholder/60/60'"
          width="60px"
          height="60px"
          fit="cover"
        />
        <div class="goods-info">
          <div class="goods-name">{{ item.name }}</div>
          <div class="goods-spec" v-if="item.spec_name">
            规格：{{ item.spec_name }}
          </div>
          <div class="goods-price">
            ¥{{ item.discount_price || item.sale_price }}
          </div>
        </div>
        <div class="goods-quantity">x{{ item.quantity }}</div>
      </div>
    </div>

    <!-- 配送方式 -->
    <div class="delivery-section">
      <div class="section-title">配送方式</div>
      <div class="delivery-item">
        <span>普通配送</span>
        <span class="delivery-fee">免运费</span>
      </div>
    </div>

    <!-- 优惠券 -->
    <div class="coupon-section">
      <div class="section-title">优惠券</div>
      <div class="coupon-item" @click="selectCoupon">
        <span>{{ selectedCoupon ? selectedCoupon.name : "选择优惠券" }}</span>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 支付方式 -->
    <div class="payment-section">
      <div class="section-title">支付方式</div>
      <van-radio-group v-model="paymentMethod">
        <div class="payment-item">
          <van-radio name="balance">
            <template #icon="props">
              <img
                class="img-icon"
                :src="props.checked ? activeIcon : inactiveIcon"
              />
            </template>
            <div class="payment-info">
              <span>钱包余额</span>
              <span class="balance">余额：¥{{ walletBalance }}</span>
            </div>
          </van-radio>
        </div>
        <div class="payment-item">
          <van-radio name="alipay">
            <template #icon="props">
              <img
                class="img-icon"
                :src="props.checked ? activeIcon : inactiveIcon"
              />
            </template>
            <div class="payment-info">
              <span>支付宝</span>
            </div>
          </van-radio>
        </div>
        <div class="payment-item">
          <van-radio name="wechat">
            <template #icon="props">
              <img
                class="img-icon"
                :src="props.checked ? activeIcon : inactiveIcon"
              />
            </template>
            <div class="payment-info">
              <span>微信支付</span>
            </div>
          </van-radio>
        </div>
      </van-radio-group>
    </div>

    <!-- 订单备注 -->
    <div class="remark-section">
      <div class="section-title">订单备注</div>
      <van-field
        v-model="remark"
        type="textarea"
        placeholder="选填，请输入订单备注"
        rows="3"
        maxlength="200"
        show-word-limit
      />
    </div>

    <!-- 价格明细 -->
    <div class="price-detail">
      <div class="price-item">
        <span>商品金额</span>
        <span>¥{{ totalAmount.toFixed(2) }}</span>
      </div>
      <div class="price-item">
        <span>运费</span>
        <span>¥0.00</span>
      </div>
      <div class="price-item" v-if="discountAmount > 0">
        <span>优惠券</span>
        <span class="discount">-¥{{ discountAmount.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 底部提交栏 -->
    <div class="submit-bar">
      <div class="total-price">
        <span>实付款：</span>
        <span class="price">¥{{ finalAmount.toFixed(2) }}</span>
      </div>
      <van-button
        type="primary"
        size="large"
        :loading="submitting"
        @click="submitOrder"
        :disabled="!canSubmit"
      >
        提交订单
      </van-button>
    </div>

    <!-- 地址选择弹窗 -->
    <van-popup
      v-model="showAddressPopup"
      position="bottom"
      :style="{ height: '70%' }"
    >
      <div class="address-popup">
        <div class="popup-header">
          <span>选择收货地址</span>
          <van-button type="primary" size="small" @click="addAddress"
            >新增地址</van-button
          >
        </div>
        <div class="address-list">
          <div
            v-for="address in addresses"
            :key="address.id"
            class="address-option"
            @click="chooseAddress(address)"
          >
            <div class="address-content">
              <div class="address-header">
                <span class="name">{{ address.name }}</span>
                <span class="phone">{{ address.phone }}</span>
                <van-tag v-if="address.is_default" type="primary" size="small"
                  >默认</van-tag
                >
              </div>
              <div class="address-detail">
                {{ address.province }} {{ address.city }}
                {{ address.district }} {{ address.address }}
              </div>
            </div>
            <van-radio :model-value="selectedAddress?.id === address.id" />
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast, showDialog } from "vant";
import { useAuthStore } from "../stores/auth";
import api from "../utils/api";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 数据
const orderItems = ref([]);
const selectedAddress = ref(null);
const addresses = ref([]);
const showAddressPopup = ref(false);
const paymentMethod = ref("balance");
const remark = ref("");
const selectedCoupon = ref(null);
const walletBalance = ref(0);
const submitting = ref(false);

// 图标
const activeIcon =
  "data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTUxMiAwYTUxMiA1MTIgMCAxIDEgMCAxMDI0QTUxMiA1MTIgMCAwIDEgNTEyIDB6bTAgNDVhNDY3IDQ2NyAwIDEgMCAwIDkzNEE0NjcgNDY3IDAgMCAwIDUxMiA0NXptMjA0LjUgMjU2TDQ1NCA2NjNhNDIgNDIgMCAwIDEtNjAuNCAwTDI2MS4yIDUzMC42YTQyIDQyIDAgMSAxIDYwLjQtNTguNEw0MjQgNTc0LjZsNjMxLjctNjMxLjdhNDIgNDIgMCAxIDEgNjAuNCA1OC40eiIgZmlsbD0iIzE5OWZmZiIvPjwvc3ZnPg==";
const inactiveIcon =
  "data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTUxMiAwYTUxMiA1MTIgMCAxIDEgMCAxMDI0QTUxMiA1MTIgMCAwIDEgNTEyIDB6bTAgNDVhNDY3IDQ2NyAwIDEgMCAwIDkzNEE0NjcgNDY3IDAgMCAwIDUxMiA0NXoiIGZpbGw9IiNjOGM5Y2MiLz48L3N2Zz4=";

// 计算属性
const totalAmount = computed(() => {
  return orderItems.value.reduce((total, item) => {
    const price = item.discount_price || item.sale_price;
    return total + price * item.quantity;
  }, 0);
});

const discountAmount = computed(() => {
  return selectedCoupon.value ? selectedCoupon.value.discount : 0;
});

const finalAmount = computed(() => {
  return Math.max(totalAmount.value - discountAmount.value, 0);
});

const canSubmit = computed(() => {
  return (
    selectedAddress.value && orderItems.value.length > 0 && !submitting.value
  );
});

// 方法
const loadOrderItems = () => {
  // 从路由参数或购物车获取订单商品
  const items = route.query.items ? JSON.parse(route.query.items) : [];
  orderItems.value = items;
};

const loadAddresses = async () => {
  try {
    const response = await api.get("/mobile/addresses");
    if (response.success) {
      addresses.value = response.data;
      // 选择默认地址
      const defaultAddress = addresses.value.find((addr) => addr.is_default);
      if (defaultAddress) {
        selectedAddress.value = defaultAddress;
      }
    }
  } catch (error) {
    console.error("获取地址失败:", error);
  }
};

const loadWalletBalance = async () => {
  try {
    const response = await api.get("/mobile/wallet");
    if (response.success) {
      walletBalance.value = response.data.balance;
    }
  } catch (error) {
    console.error("获取钱包余额失败:", error);
  }
};

const selectAddress = () => {
  showAddressPopup.value = true;
};

const chooseAddress = (address) => {
  selectedAddress.value = address;
  showAddressPopup.value = false;
};

const addAddress = () => {
  showAddressPopup.value = false;
  router.push("/address/add");
};

const selectCoupon = () => {
  showToast("优惠券功能开发中");
};

const submitOrder = async () => {
  if (!selectedAddress.value) {
    showToast("请选择收货地址");
    return;
  }

  if (
    paymentMethod.value === "balance" &&
    finalAmount.value > walletBalance.value
  ) {
    showToast("钱包余额不足");
    return;
  }

  try {
    submitting.value = true;

    const orderData = {
      // items: orderItems.value.map((item) => ({
      //   product_id: item.product_id || item.id,
      //   quantity: item.quantity,
      //   price: item.discount_price || item.sale_price,
      // })),
      delivery_address: `${selectedAddress.value.province} ${selectedAddress.value.city} ${selectedAddress.value.district} ${selectedAddress.value.address}`,
      delivery_phone: selectedAddress.value.phone,
      delivery_name: selectedAddress.value.name,
      // payment_method: paymentMethod.value,
      remark: remark.value,
      // total_amount: finalAmount.value,
      cart_items: orderItems.value.map((item) => item.product_id),
    };

    const response = await api.post("/mobile/orders", orderData);

    if (response.success) {
      showToast("订单创建成功");

      // 根据支付方式跳转
      if (paymentMethod.value === "balance") {
        // 钱包支付直接跳转到支付页面
        router.replace(`/payment/${response.data.order_id}`);
      } else {
        // 其他支付方式跳转到待支付页面
        router.replace(`/order-detail/${response.data.order_id}`);
      }
    } else {
      showToast(response.message || "订单创建失败");
    }
  } catch (error) {
    console.error("提交订单失败:", error);
    showToast("提交订单失败");
  } finally {
    submitting.value = false;
  }
};

// 页面加载
onMounted(() => {
  loadOrderItems();
  loadAddresses();
  loadWalletBalance();
});
</script>

<style scoped>
.checkout {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 80px;
}

.address-section,
.goods-section,
.delivery-section,
.coupon-section,
.payment-section,
.remark-section {
  background: white;
  margin-bottom: 10px;
  padding: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

/* 地址样式 */
.address-card,
.no-address {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.address-info {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.name {
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
}

.phone {
  font-size: 14px;
  color: #666;
}

.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.no-address {
  color: #999;
  text-align: center;
  justify-content: center;
  padding: 20px 0;
}

/* 商品样式 */
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
  margin-bottom: 5px;
}

.goods-price {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
}

.goods-quantity {
  font-size: 14px;
  color: #666;
}

/* 配送样式 */
.delivery-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delivery-fee {
  color: #ff4444;
}

/* 优惠券样式 */
.coupon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

/* 支付方式样式 */
.payment-item {
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.payment-item:last-child {
  border-bottom: none;
}

.payment-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 10px;
}

.balance {
  font-size: 12px;
  color: #999;
}

.img-icon {
  width: 20px;
  height: 20px;
}

/* 价格明细 */
.price-detail {
  background: white;
  padding: 15px;
  margin-bottom: 10px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.price-item:last-child {
  margin-bottom: 0;
}

.discount {
  color: #ff4444;
}

/* 底部提交栏 */
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 15px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-price {
  font-size: 16px;
}

.price {
  color: #ff4444;
  font-weight: bold;
  font-size: 18px;
}

/* 地址弹窗 */
.address-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  font-weight: bold;
}

.address-list {
  flex: 1;
  overflow-y: auto;
}

.address-option {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.address-content {
  flex: 1;
  margin-right: 10px;
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
