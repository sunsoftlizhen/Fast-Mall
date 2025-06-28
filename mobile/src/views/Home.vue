<template>
  <div class="home">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="首页" fixed placeholder class="nav-bar">
      <template #right>
        <div class="nav-actions">
          <van-icon
            name="search"
            size="20"
            @click="showSearch = true"
            class="search-icon"
          />
        </div>
      </template>
    </van-nav-bar>

    <!-- 搜索面板 -->
    <van-search
      v-show="showSearch"
      v-model="searchKeyword"
      placeholder="搜索您想要的商品"
      shape="round"
      show-action
      @search="onSearch"
      @cancel="showSearch = false"
      @clear="onClearSearch"
      class="search-panel"
    />

    <!-- 首页内容 -->
    <div class="home-content">
      <!-- 轮播图/推荐区域 -->
      <div class="banner-section">
        <div class="welcome-card">
          <div class="welcome-content">
            <h2>欢迎来到移动商城</h2>
            <p>发现更多精彩商品</p>
          </div>
          <div class="welcome-icon">
            <van-icon name="shop-o" />
          </div>
        </div>
      </div>

      <!-- 分类快捷入口 -->
      <div class="category-section">
        <div class="section-header">
          <h3>商品分类</h3>
        </div>
        <div class="category-grid">
          <div class="category-item" @click="searchCategory('电子产品')">
            <van-icon name="phone-o" />
            <span>电子产品</span>
          </div>
          <div class="category-item" @click="searchCategory('服装鞋包')">
            <van-icon name="bag-o" />
            <span>服装鞋包</span>
          </div>
          <div class="category-item" @click="searchCategory('家居生活')">
            <van-icon name="home-o" />
            <span>家居生活</span>
          </div>
          <div class="category-item" @click="searchCategory('运动户外')">
            <van-icon name="location-o" />
            <span>运动户外</span>
          </div>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="products-section">
        <div class="section-header">
          <h3>热门商品</h3>
          <van-button
            type="primary"
            plain
            size="small"
            @click="refreshProducts"
            :loading="loading"
          >
            刷新
          </van-button>
        </div>

        <van-list
          :loading="loading"
          :finished="finished"
          finished-text="没有更多商品了"
          @load="onLoad"
          class="product-list"
        >
          <div class="product-grid">
            <div
              v-for="product in products"
              :key="product.id"
              class="product-card"
              @click="goToDetail(product.id)"
            >
              <!-- 商品图片 -->
              <div class="product-image-wrapper">
                <van-image
                  :src="product.image || '/default-product.png'"
                  fit="cover"
                  class="product-image"
                  loading-icon="photo"
                />
                <div v-if="product.discount_price" class="discount-badge">
                  特价
                </div>
              </div>

              <!-- 商品信息 -->
              <div class="product-info">
                <h4 class="product-name">{{ product.name }}</h4>
                <p class="product-desc">{{ product.description }}</p>

                <div class="product-price-row">
                  <div class="price-info">
                    <span v-if="product.discount_price" class="discount-price">
                      ¥{{ product.discount_price }}
                    </span>
                    <span
                      :class="
                        product.discount_price
                          ? 'original-price'
                          : 'current-price'
                      "
                    >
                      ¥{{ product.sale_price }}
                    </span>
                  </div>
                  <div class="product-stock">
                    <span
                      :class="[
                        'stock-badge',
                        product.stock_quantity <= 5 ? 'low-stock' : '',
                      ]"
                    >
                      库存{{ product.stock_quantity }}
                    </span>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="product-actions">
                  <van-button
                    type="primary"
                    size="small"
                    round
                    @click.stop="addToCart(product.id)"
                    :disabled="product.stock_quantity <= 0"
                    class="add-cart-btn"
                  >
                    <van-icon name="shopping-cart-o" />
                    {{ product.stock_quantity > 0 ? "加购物车" : "缺货" }}
                  </van-button>
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <TabBar />

    <!-- 悬浮购物车 -->
    <div
      class="floating-cart"
      @click="$router.push('/cart')"
      v-if="cartCount > 0"
    >
      <van-icon name="shopping-cart-o" />
      <van-badge :content="cartCount" class="cart-badge" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { getProducts } from "../utils/api";
import { useCartStore } from "../stores/cart";
import { useAuthStore } from "../stores/auth";
import TabBar from "../components/TabBar.vue";

const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();

// 数据
const products = ref([]);
const loading = ref(false);
const finished = ref(false);
const showSearch = ref(false);
const searchKeyword = ref("");
const currentPage = ref(1);
const pageSize = 10;

// 计算属性
const cartCount = computed(() => cartStore.cartCount);

// 加载商品列表
const loadProducts = async (page = 1, keyword = "") => {
  try {
    loading.value = true;
    const response = await getProducts({
      page,
      pageSize,
      keyword,
    });

    // 后端返回格式: { success: true, data: { products: [...] } }
    const newProducts = response.data?.products || [];

    if (page === 1) {
      products.value = newProducts;
    } else {
      products.value.push(...newProducts);
    }

    // 判断是否还有更多数据
    if (newProducts.length < pageSize) {
      finished.value = true;
    }
  } catch (error) {
    console.error("获取商品失败:", error);
    showToast("获取商品失败");
    // 发生错误时也要设置finished为true，避免无限循环
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

// 下拉加载更多
const onLoad = () => {
  if (!finished.value && !loading.value) {
    currentPage.value++;
    loadProducts(currentPage.value, searchKeyword.value);
  }
};

// 搜索商品
const onSearch = () => {
  currentPage.value = 1;
  finished.value = false;
  products.value = [];
  loadProducts(1, searchKeyword.value);
  showSearch.value = false;
};

// 清空搜索
const onClearSearch = () => {
  searchKeyword.value = "";
  currentPage.value = 1;
  finished.value = false;
  products.value = [];
  loadProducts(1, "");
};

// 跳转到商品详情
const goToDetail = (productId) => {
  router.push(`/product/${productId}`);
};

// 添加到购物车
const addToCart = async (productId) => {
  if (!authStore.isLoggedIn) {
    showToast("请先登录");
    router.push("/login");
    return;
  }

  await cartStore.addItem(productId, 1);
};

// 按分类搜索
const searchCategory = (category) => {
  searchKeyword.value = category;
  onSearch();
};

// 刷新商品列表
const refreshProducts = () => {
  currentPage.value = 1;
  finished.value = false;
  products.value = [];
  loadProducts(1, searchKeyword.value);
};

// 页面加载时获取数据
onMounted(() => {
  loadProducts();
  if (authStore.isLoggedIn) {
    cartStore.fetchCartList();
  }
});
</script>

<style scoped>
.home {
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

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-icon {
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-icon:hover {
  transform: scale(1.1);
}

.search-panel {
  margin: 16px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.home-content {
  padding: 16px;
}

/* 欢迎区域 */
.banner-section {
  margin-bottom: 24px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.welcome-card::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -20%;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.welcome-content h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.welcome-content p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.welcome-icon {
  font-size: 36px;
  opacity: 0.8;
}

/* 分类区域 */
.category-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.category-item {
  background: white;
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f1f5;
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.category-item .van-icon {
  font-size: 24px;
  color: #667eea;
  margin-bottom: 8px;
}

.category-item span {
  font-size: 12px;
  color: #646566;
  font-weight: 500;
}

/* 商品区域 */
.products-section {
  margin-bottom: 24px;
}

.product-list {
  padding: 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  height: 140px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.discount-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #323233;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.product-desc {
  font-size: 12px;
  color: #646566;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}

.product-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.discount-price {
  color: #ee0a24;
  font-size: 16px;
  font-weight: 700;
}

.original-price {
  color: #969799;
  font-size: 12px;
  text-decoration: line-through;
}

.current-price {
  color: #ee0a24;
  font-size: 16px;
  font-weight: 700;
}

.product-stock {
  font-size: 10px;
}

.stock-badge {
  background: #f0f1f5;
  color: #646566;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.stock-badge.low-stock {
  background: #ffeaea;
  color: #ee0a24;
}

.product-actions {
  display: flex;
  justify-content: center;
}

.add-cart-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  height: 32px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.add-cart-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.add-cart-btn .van-icon {
  font-size: 14px;
}

/* 悬浮购物车 */
.floating-cart {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #ee0a24, #ff4757);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(238, 10, 36, 0.4);
  transition: all 0.3s ease;
  z-index: 100;
}

.floating-cart:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(238, 10, 36, 0.5);
}

.floating-cart .van-icon {
  color: white;
  font-size: 24px;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}

/* 搜索面板 */
.van-search {
  position: fixed;
  top: 46px;
  left: 0;
  right: 0;
  z-index: 999;
}

/* 加载状态优化 */
.van-list__loading,
.van-list__finished-text {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  margin: 16px;
  padding: 12px;
  text-align: center;
  color: #646566;
  font-size: 14px;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .home-content {
    padding: 12px;
  }

  .category-grid {
    gap: 8px;
  }

  .category-item {
    padding: 12px 8px;
  }

  .product-grid {
    gap: 8px;
  }

  .welcome-card {
    padding: 20px;
  }

  .section-header h3 {
    font-size: 16px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .home {
    background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .welcome-card,
  .category-item,
  .product-card {
    background: #2d2d2d;
    border-color: #404040;
  }

  .section-header h3 {
    color: #ffffff;
  }

  .product-name {
    color: #ffffff;
  }

  .product-desc {
    color: #b3b3b3;
  }

  .category-item span {
    color: #b3b3b3;
  }

  .stock-badge {
    background: #404040;
    color: #b3b3b3;
  }
}
</style>
