<template>
  <div class="search">
    <!-- 搜索栏 -->
    <div class="search-header">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索商品"
        show-action
        @search="handleSearch"
        @clear="handleClear"
        @focus="showHistory = true"
        @blur="showHistory = false"
      >
        <template #action>
          <div @click="$router.back()">取消</div>
        </template>
      </van-search>
    </div>

    <!-- 搜索历史 -->
    <div v-if="showHistory && searchHistory.length > 0" class="search-history">
      <div class="history-header">
        <div class="history-title">搜索历史</div>
        <van-button type="default" size="small" text @click="clearHistory">
          清空
        </van-button>
      </div>
      <div class="history-tags">
        <van-tag
          v-for="item in searchHistory"
          :key="item"
          class="history-tag"
          @click="searchByHistory(item)"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <!-- 热门搜索 -->
    <div v-if="showHistory" class="hot-search">
      <div class="hot-title">热门搜索</div>
      <div class="hot-tags">
        <van-tag
          v-for="item in hotKeywords"
          :key="item"
          class="hot-tag"
          type="primary"
          plain
          @click="searchByHistory(item)"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="!showHistory" class="search-results">
      <!-- 搜索中 -->
      <div v-if="searching" class="searching">
        <van-loading size="24px">搜索中...</van-loading>
      </div>

      <!-- 搜索结果列表 -->
      <div v-else-if="searchResults.length > 0" class="results-list">
        <div
          v-for="product in searchResults"
          :key="product.id"
          class="product-item"
          @click="viewProduct(product)"
        >
          <div class="product-image">
            <van-image
              :src="product.image || '/api/placeholder/80/80'"
              fit="cover"
              width="60px"
              height="60px"
            />
          </div>

          <div class="product-info">
            <div
              class="product-name"
              v-html="highlightKeyword(product.name)"
            ></div>
            <div class="product-price">¥{{ product.price }}</div>
            <div class="product-stock">
              <van-tag v-if="product.stock > 0" type="success" size="small">
                有库存
              </van-tag>
              <van-tag v-else type="danger" size="small"> 缺货 </van-tag>
            </div>
          </div>

          <div class="product-actions">
            <van-button
              type="primary"
              size="small"
              :disabled="product.stock === 0"
              @click.stop="addToCart(product)"
            >
              加购物车
            </van-button>
          </div>
        </div>
      </div>

      <!-- 无搜索结果 -->
      <div v-else-if="hasSearched" class="no-results">
        <van-empty
          image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
          description="没有找到相关商品"
        >
          <van-button type="primary" @click="$router.push('/home')">
            去逛逛
          </van-button>
        </van-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { useCartStore } from "../stores/cart";
import api from "../utils/api";

const router = useRouter();
const cartStore = useCartStore();

// 数据
const searchKeyword = ref("");
const searchResults = ref([]);
const searchHistory = ref([]);
const showHistory = ref(false);
const searching = ref(false);
const hasSearched = ref(false);

// 热门搜索关键词
const hotKeywords = ["手机", "耳机", "充电器", "数据线", "保护壳", "移动电源"];

// 执行搜索
const handleSearch = async () => {
  const keyword = searchKeyword.value.trim();

  if (!keyword) {
    showToast("请输入搜索关键词");
    return;
  }

  // 添加到搜索历史
  addToHistory(keyword);

  // 隐藏历史记录
  showHistory.value = false;
  searching.value = true;
  hasSearched.value = true;

  try {
    const response = await api.get("/mobile/products/search", {
      params: { keyword },
    });
    searchResults.value = response.data;
  } catch (error) {
    console.error("搜索失败:", error);
    showToast("搜索失败");
    searchResults.value = [];
  } finally {
    searching.value = false;
  }
};

// 清空搜索
const handleClear = () => {
  searchResults.value = [];
  hasSearched.value = false;
};

// 通过历史记录搜索
const searchByHistory = (keyword) => {
  searchKeyword.value = keyword;
  handleSearch();
};

// 添加到搜索历史
const addToHistory = (keyword) => {
  const history = [...searchHistory.value];
  const index = history.indexOf(keyword);

  if (index > -1) {
    history.splice(index, 1);
  }

  history.unshift(keyword);

  // 最多保存10条历史记录
  if (history.length > 10) {
    history.pop();
  }

  searchHistory.value = history;
  localStorage.setItem("searchHistory", JSON.stringify(history));
};

// 清空搜索历史
const clearHistory = () => {
  searchHistory.value = [];
  localStorage.removeItem("searchHistory");
};

// 高亮搜索关键词
const highlightKeyword = (text) => {
  const keyword = searchKeyword.value.trim();
  if (!keyword) return text;

  const regex = new RegExp(`(${keyword})`, "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
};

// 查看商品详情
const viewProduct = (product) => {
  router.push(`/product/${product.id}`);
};

// 加入购物车
const addToCart = async (product) => {
  try {
    const success = await cartStore.addToCart(product.id, 1);
    if (success) {
      showToast("已加入购物车");
    }
  } catch (error) {
    showToast(error.message || "加入购物车失败");
  }
};

// 页面加载时恢复搜索历史
onMounted(() => {
  const history = localStorage.getItem("searchHistory");
  if (history) {
    try {
      searchHistory.value = JSON.parse(history);
    } catch (error) {
      console.error("解析搜索历史失败:", error);
    }
  }
});
</script>

<style scoped>
.search {
  min-height: 100vh;
  background: #f8f8f8;
}

.search-header {
  background: white;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.search-history {
  background: white;
  padding: 16px;
  margin-bottom: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-title {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  cursor: pointer;
}

.hot-search {
  background: white;
  padding: 16px;
}

.hot-title {
  font-size: 14px;
  color: #333;
  font-weight: bold;
  margin-bottom: 12px;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  cursor: pointer;
}

.search-results {
  padding: 8px 0;
}

.searching {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.results-list {
  background: white;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
  cursor: pointer;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-name :deep(.highlight) {
  color: #1989fa;
  background: #e8f3ff;
  padding: 0 2px;
  border-radius: 2px;
}

.product-price {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
  margin-bottom: 4px;
}

.product-stock {
  font-size: 12px;
}

.product-actions {
  flex-shrink: 0;
}

.no-results {
  padding: 60px 16px;
}

/* 导航栏样式 */
:deep(.van-search) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

:deep(.van-search__content) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

:deep(.van-search .van-field__control) {
  color: white;
}

:deep(.van-search .van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

:deep(.van-search__action) {
  color: white;
}
</style>
