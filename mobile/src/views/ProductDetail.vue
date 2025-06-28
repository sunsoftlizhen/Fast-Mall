<template>
  <div class="product-detail">
    <!-- 导航栏 -->
    <van-nav-bar
      title="商品详情"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <!-- 商品信息 -->
    <div v-if="product" class="content">
      <!-- 商品图片 -->
      <div class="product-image">
        <van-image
          :src="product.image || '/api/placeholder/400/400'"
          fit="cover"
          width="100%"
          height="300px"
          loading-icon="photo"
          error-icon="photo-fail"
        />
      </div>

      <!-- 商品基本信息 -->
      <div class="product-info">
        <div class="price">¥{{ product.price }}</div>
        <div class="name">{{ product.name }}</div>
        <div class="description">{{ product.description }}</div>

        <!-- 库存信息 -->
        <div class="stock-info">
          <van-tag v-if="product.stock > 0" type="success">
            库存：{{ product.stock }}件
          </van-tag>
          <van-tag v-else type="danger">缺货</van-tag>
        </div>
      </div>

      <!-- 数量选择 -->
      <div class="quantity-section">
        <div class="section-title">购买数量</div>
        <van-stepper
          v-model="quantity"
          :min="1"
          :max="product.stock"
          :disabled="product.stock === 0"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else class="loading">
      <van-loading size="24px">加载中...</van-loading>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-actions">
      <van-button
        type="warning"
        size="large"
        @click="addToCart"
        :disabled="!product || product.stock === 0"
        :loading="addingToCart"
      >
        加入购物车
      </van-button>
      <van-button
        type="primary"
        size="large"
        @click="buyNow"
        :disabled="!product || product.stock === 0"
        :loading="buying"
      >
        立即购买
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast } from "vant";
import { useCartStore } from "../stores/cart";
import api from "../utils/api";

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

// 数据
const product = ref(null);
const quantity = ref(1);
const addingToCart = ref(false);
const buying = ref(false);

// 获取商品详情
const fetchProduct = async () => {
  try {
    const response = await api.get(`/mobile/products/${route.params.id}`);
    product.value = response.data;
  } catch (error) {
    console.error("获取商品详情失败:", error);
    showToast("获取商品详情失败");
    router.back();
  }
};

// 加入购物车
const addToCart = async () => {
  addingToCart.value = true;

  try {
    const success = await cartStore.addToCart(product.value.id, quantity.value);
    if (success) {
      showToast("已加入购物车");
    }
  } catch (error) {
    showToast(error.message || "加入购物车失败");
  } finally {
    addingToCart.value = false;
  }
};

// 立即购买
const buyNow = async () => {
  buying.value = true;

  try {
    // 先加入购物车
    const success = await cartStore.addToCart(product.value.id, quantity.value);
    if (success) {
      // 跳转到购物车页面
      router.push("/cart");
    }
  } catch (error) {
    showToast(error.message || "操作失败");
  } finally {
    buying.value = false;
  }
};

onMounted(() => {
  fetchProduct();
});
</script>

<style scoped>
.product-detail {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 60px;
}

.content {
  background: white;
}

.product-image {
  width: 100%;
}

.product-info {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.price {
  font-size: 24px;
  color: #ff4444;
  font-weight: bold;
  margin-bottom: 8px;
}

.name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.stock-info {
  margin-top: 8px;
}

.quantity-section {
  padding: 16px;
  background: white;
  margin-top: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 8px 16px;
  background: white;
  border-top: 1px solid #eee;
  gap: 8px;
}

.bottom-actions .van-button {
  flex: 1;
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
