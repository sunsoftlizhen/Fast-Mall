<template>
  <div class="publish">
    <!-- 导航栏 -->
    <van-nav-bar
      title="发布动态"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <van-button
          type="primary"
          size="small"
          @click="handlePublish"
          :loading="publishing"
          :disabled="!content.trim()"
        >
          发布
        </van-button>
      </template>
    </van-nav-bar>

    <!-- 发布表单 -->
    <div class="publish-form">
      <!-- 内容输入 -->
      <van-field
        v-model="content"
        type="textarea"
        placeholder="分享你的想法..."
        rows="6"
        autosize
        maxlength="1000"
        show-word-limit
        border
      />

      <!-- 图片上传 -->
      <div class="image-section">
        <div class="section-title">添加图片</div>
        <van-uploader
          v-model="imageList"
          multiple
          :max-count="9"
          :after-read="afterRead"
          :before-delete="beforeDelete"
        >
          <van-icon name="plus" size="40" color="#ddd" />
        </van-uploader>
      </div>

      <!-- 位置信息 -->
      <div class="location-section">
        <van-cell
          title="添加位置"
          :value="location || '点击添加位置'"
          is-link
          @click="showLocationPicker = true"
          icon="location-o"
        />
      </div>

      <!-- 动态类型 -->
      <div class="type-section">
        <div class="section-title">动态类型</div>
        <van-radio-group v-model="type">
          <van-cell-group>
            <van-cell title="普通动态" clickable @click="type = 'normal'">
              <template #right-icon>
                <van-radio name="normal" />
              </template>
            </van-cell>
            <van-cell
              title="商品评价"
              clickable
              @click="type = 'product_review'"
            >
              <template #right-icon>
                <van-radio name="product_review" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
      </div>

      <!-- 商品选择（仅在商品评价时显示） -->
      <div v-if="type === 'product_review'" class="product-section">
        <van-cell
          title="选择商品"
          :value="selectedProduct ? selectedProduct.name : '点击选择商品'"
          is-link
          @click="showProductPicker = true"
          icon="gift-o"
        />
      </div>
    </div>

    <!-- 位置选择弹窗 -->
    <van-popup v-model="showLocationPicker" position="bottom" round>
      <div class="location-picker">
        <div class="picker-header">
          <van-button
            type="default"
            size="small"
            @click="showLocationPicker = false"
          >
            取消
          </van-button>
          <div class="picker-title">选择位置</div>
          <van-button type="primary" size="small" @click="confirmLocation">
            确定
          </van-button>
        </div>
        <van-field
          v-model="tempLocation"
          placeholder="请输入位置信息"
          clearable
        />
        <div class="common-locations">
          <div class="location-title">常用位置</div>
          <div
            v-for="loc in commonLocations"
            :key="loc"
            class="location-item"
            @click="tempLocation = loc"
          >
            {{ loc }}
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 商品选择弹窗 -->
    <van-popup v-model="showProductPicker" position="bottom" round>
      <div class="product-picker">
        <div class="picker-header">
          <van-button
            type="default"
            size="small"
            @click="showProductPicker = false"
          >
            取消
          </van-button>
          <div class="picker-title">选择商品</div>
          <van-button type="primary" size="small" @click="confirmProduct">
            确定
          </van-button>
        </div>
        <div class="product-list">
          <div
            v-for="product in products"
            :key="product.id"
            class="product-item"
            :class="{ active: tempProductId === product.id }"
            @click="tempProductId = product.id"
          >
            <van-image
              :src="product.image || '/api/placeholder/60/60'"
              fit="cover"
              width="50px"
              height="50px"
            />
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">¥{{ product.sale_price }}</div>
            </div>
            <van-radio :name="product.id" v-model="tempProductId" />
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showConfirmDialog } from "vant";
import { useAuthStore } from "../stores/auth";
import api from "../utils/api";

const router = useRouter();
const authStore = useAuthStore();

// 数据
const content = ref("");
const imageList = ref([]);
const location = ref("");
const type = ref("normal");
const selectedProduct = ref(null);
const publishing = ref(false);

// 弹窗状态
const showLocationPicker = ref(false);
const showProductPicker = ref(false);

// 临时数据
const tempLocation = ref("");
const tempProductId = ref(null);

// 商品列表
const products = ref([]);

// 常用位置
const commonLocations = [
  "北京市朝阳区",
  "上海市浦东新区",
  "广州市天河区",
  "深圳市南山区",
  "杭州市西湖区",
  "成都市武侯区",
];

// 获取商品列表
const fetchProducts = async () => {
  try {
    const response = await api.get("/mobile/products", {
      params: { page: 1, pageSize: 50 },
    });
    products.value = response.data?.products || [];
  } catch (error) {
    console.error("获取商品列表失败:", error);
  }
};

// 图片上传处理
const afterRead = (file) => {
  console.log("图片上传:", file);
  // 这里可以实现真实的图片上传逻辑
  // 暂时使用本地预览
};

// 删除图片前确认
const beforeDelete = () => {
  return new Promise((resolve) => {
    showConfirmDialog({
      title: "确认删除",
      message: "确定要删除这张图片吗？",
    })
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
};

// 确认位置选择
const confirmLocation = () => {
  location.value = tempLocation.value;
  showLocationPicker.value = false;
};

// 确认商品选择
const confirmProduct = () => {
  if (tempProductId.value) {
    selectedProduct.value = products.value.find(
      (p) => p.id === tempProductId.value
    );
  }
  showProductPicker.value = false;
};

// 发布动态
const handlePublish = async () => {
  if (!content.value.trim()) {
    showToast("请输入内容");
    return;
  }

  if (type.value === "product_review" && !selectedProduct.value) {
    showToast("请选择要评价的商品");
    return;
  }

  publishing.value = true;

  try {
    // 处理图片列表
    const images = imageList.value
      .map((item) => {
        if (typeof item === "string") return item;
        return item.url || item.content || "";
      })
      .filter((url) => url);

    const data = {
      content: content.value.trim(),
      images: images.length > 0 ? images : undefined,
      location: location.value || undefined,
      type: type.value,
      product_id:
        type.value === "product_review" ? selectedProduct.value?.id : undefined,
    };

    const response = await api.post("/moments", data);

    if (response.success) {
      showToast("发布成功");
      router.back();
    }
  } catch (error) {
    console.error("发布失败:", error);
    showToast(error.response?.data?.message || "发布失败");
  } finally {
    publishing.value = false;
  }
};

// 页面加载时检查登录状态并获取商品列表
onMounted(() => {
  if (!authStore.isLoggedIn) {
    showToast("请先登录");
    router.push("/login");
    return;
  }

  fetchProducts();
});
</script>

<style scoped>
.publish {
  min-height: 100vh;
  background: #f8f8f8;
}

.publish-form {
  padding: 16px;
}

.image-section,
.type-section,
.product-section {
  margin-top: 16px;
}

.section-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  font-weight: bold;
}

.location-section {
  margin-top: 16px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

/* 位置选择弹窗 */
.location-picker {
  padding: 16px;
  max-height: 60vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.picker-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.common-locations {
  margin-top: 16px;
}

.location-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.location-item {
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.location-item:hover {
  background: #e8f3ff;
}

/* 商品选择弹窗 */
.product-picker {
  padding: 16px;
  max-height: 60vh;
}

.product-list {
  max-height: 40vh;
  overflow-y: auto;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
  gap: 12px;
}

.product-item.active {
  border-color: #1989fa;
  background: #e8f3ff;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.product-price {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
}

/* 上传组件样式 */
:deep(.van-uploader__upload) {
  width: 80px;
  height: 80px;
  background: #f7f8fa;
  border: 1px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.van-uploader__preview) {
  width: 80px;
  height: 80px;
  margin-right: 8px;
  margin-bottom: 8px;
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
