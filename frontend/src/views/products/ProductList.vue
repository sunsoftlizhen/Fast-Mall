<template>
  <div class="product-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">商品管理</span>
          <el-button
            v-if="hasPermission('product:add')"
            type="primary"
            @click="handleAdd"
          >
            <el-icon><Plus /></el-icon>
            添加商品
          </el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="商品名称">
            <el-input
              v-model="searchForm.keyword"
              placeholder="请输入商品名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
            >
              <el-option label="上架" :value="1" />
              <el-option label="下架" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 商品表格 -->
      <el-table
        v-loading="loading"
        :data="productList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.image"
              :src="row.image"
              :preview-src-list="[row.image]"
              style="width: 60px; height: 60px"
              fit="cover"
            />
            <div v-else class="no-image">无图片</div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="商品名称" min-width="150" />

        <el-table-column label="规格/单位" width="120">
          <template #default="{ row }">
            <div>{{ row.spec_name }}</div>
            <div class="text-gray">{{ row.unit_name }}</div>
          </template>
        </el-table-column>

        <el-table-column label="价格信息" width="150">
          <template #default="{ row }">
            <div class="price-info">
              <div class="sale-price">售价: ¥{{ row.sale_price }}</div>
              <div class="purchase-price">进价: ¥{{ row.purchase_price }}</div>
              <div v-if="row.discount_price" class="discount-price">
                折扣: ¥{{ row.discount_price }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="stock_quantity" label="库存" width="80" />

        <el-table-column label="保质期" width="100">
          <template #default="{ row }">
            {{ row.shelf_life ? `${row.shelf_life}天` : "无限制" }}
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? "上架" : "下架" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            {{ row.created_by_name }}
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="hasPermission('product:edit')"
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasPermission('product:delete')"
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import request from "@/utils/request";

const router = useRouter();
const authStore = useAuthStore();

// 响应式数据
const loading = ref(false);
const productList = ref([]);

// 搜索表单
const searchForm = reactive({
  keyword: "",
  status: "",
});

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 权限检查
const hasPermission = (permission) => {
  return authStore.hasPermission(permission);
};

// 获取商品列表
const getProductList = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status,
    };

    const response = await request.get("/products", { params });
    productList.value = response.data.products;
    pagination.total = response.data.pagination.total;
  } catch (error) {
    ElMessage.error(error.message || "获取商品列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  getProductList();
};

// 重置搜索
const handleReset = () => {
  searchForm.keyword = "";
  searchForm.status = "";
  pagination.page = 1;
  getProductList();
};

// 添加商品
const handleAdd = () => {
  router.push("/products/add");
};

// 编辑商品
const handleEdit = (row) => {
  router.push(`/products/edit/${row.id}`);
};

// 删除商品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品 "${row.name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await request.delete(`/products/${row.id}`);
    ElMessage.success("删除商品成功");
    getProductList();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除商品失败");
    }
  }
};

// 分页大小改变
const handleSizeChange = (val) => {
  pagination.pageSize = val;
  pagination.page = 1;
  getProductList();
};

// 当前页改变
const handleCurrentChange = (val) => {
  pagination.page = val;
  getProductList();
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 组件挂载时获取数据
onMounted(() => {
  getProductList();
});
</script>

<style scoped>
.product-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
}

.no-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 12px;
  border-radius: 4px;
}

.price-info {
  font-size: 12px;
  line-height: 1.4;
}

.sale-price {
  color: #e6a23c;
  font-weight: 600;
}

.purchase-price {
  color: #909399;
}

.discount-price {
  color: #f56c6c;
}

.text-gray {
  color: #909399;
  font-size: 12px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
