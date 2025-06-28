<template>
  <div class="cart">
    <!-- 导航栏 -->
    <van-nav-bar
      title="购物车"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <!-- 购物车列表 -->
    <div v-if="cartStore.cartItems.length > 0" class="cart-content">
      <div class="cart-list">
        <div
          v-for="item in cartStore.cartItems"
          :key="item.id"
          class="cart-item"
        >
          <van-checkbox v-model="item.checked" @change="updateItem(item)" />

          <div class="item-image">
            <van-image
              :src="item.image || '/api/placeholder/80/80'"
              fit="cover"
              width="60px"
              height="60px"
            />
          </div>

          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">
              ¥{{ item.discount_price || item.sale_price }}
            </div>
          </div>

          <div class="item-actions">
            <van-stepper
              v-model="item.quantity"
              :min="1"
              :max="item.stock_quantity"
              @change="updateItem(item)"
            />
            <van-button
              type="danger"
              size="small"
              text
              @click="removeItem(item.id)"
            >
              删除
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空购物车 -->
    <div v-else class="empty-cart">
      <van-empty
        image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
        description="购物车空空如也"
      >
        <van-button type="primary" @click="$router.push('/home')">
          去逛逛
        </van-button>
      </van-empty>
    </div>

    <!-- 底部结算栏 -->
    <div v-if="cartStore.cartItems.length > 0" class="cart-footer">
      <van-checkbox v-model="selectAll" @change="handleSelectAll">
        全选
      </van-checkbox>

      <div class="total-info">
        <div class="total-price">合计：¥{{ cartStore.totalAmount }}</div>
        <div class="selected-count">已选 {{ selectedCount }} 件</div>
      </div>

      <van-button
        type="primary"
        size="large"
        :disabled="selectedCount === 0"
        @click="checkout"
        :loading="checkingOut"
      >
        结算
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showConfirmDialog } from "vant";
import { useCartStore } from "../stores/cart";

const router = useRouter();
const cartStore = useCartStore();

// 数据
const checkingOut = ref(false);

// 计算属性
const selectedCount = computed(() => {
  return cartStore.cartItems.filter((item) => item.checked).length;
});

const selectAll = computed({
  get() {
    return (
      cartStore.cartItems.length > 0 &&
      cartStore.cartItems.every((item) => item.checked)
    );
  },
  set(value) {
    cartStore.cartItems.forEach((item) => {
      item.checked = value;
    });
  },
});

// 全选/取消全选
const handleSelectAll = (checked) => {
  cartStore.cartItems.forEach((item) => {
    item.checked = checked;
  });
};

// 更新商品
const updateItem = async (item) => {
  try {
    await cartStore.updateQuantity(item.id, item.quantity);
  } catch (error) {
    showToast(error.message || "更新失败");
  }
};

// 删除商品
const removeItem = async (itemId) => {
  try {
    await showConfirmDialog({
      title: "确认删除",
      message: "确定要删除这件商品吗？",
    });

    await cartStore.removeItem(itemId);
    showToast("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      showToast(error.message || "删除失败");
    }
  }
};

// 结算
const checkout = async () => {
  const selectedItems = cartStore.cartItems.filter((item) => item.checked);

  if (selectedItems.length === 0) {
    showToast("请选择要结算的商品");
    return;
  }

  checkingOut.value = true;

  try {
    // 跳转到下单页面，传递选中的商品信息
    const items = selectedItems.map((item) => ({
      product_id: item.product_id,
      name: item.product_name,
      image: item.product_image,
      sale_price: item.sale_price,
      discount_price: item.discount_price,
      quantity: item.quantity,
      spec_name: item.spec_name,
    }));

    router.push({
      path: "/checkout",
      query: {
        items: JSON.stringify(items),
      },
    });
  } catch (error) {
    showToast(error.message || "结算失败");
  } finally {
    checkingOut.value = false;
  }
};

// 页面加载时获取购物车数据
onMounted(() => {
  cartStore.fetchCartList();
});
</script>

<style scoped>
.cart {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 60px;
}

.cart-content {
  padding: 8px 0;
}

.cart-list {
  background: white;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  gap: 12px;
}

.item-image {
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-cart {
  padding: 60px 16px;
}

.cart-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 16px;
}

.total-info {
  flex: 1;
  text-align: right;
}

.total-price {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
  margin-bottom: 4px;
}

.selected-count {
  font-size: 12px;
  color: #999;
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
