<template>
  <div class="user-address-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>用户地址管理</h2>
      <p>管理所有用户的收货地址信息</p>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="省份">
          <el-input
            v-model="searchForm.province"
            placeholder="请输入省份"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="城市">
          <el-input
            v-model="searchForm.city"
            placeholder="请输入城市"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 地址列表 -->
    <el-card class="table-card">
      <el-table :data="addresses" style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="name" label="收货人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="province" label="省份" width="100" />
        <el-table-column prop="city" label="城市" width="100" />
        <el-table-column prop="district" label="区县" width="100" />
        <el-table-column prop="address" label="详细地址" min-width="200">
          <template #default="scope">
            <div class="address-text">{{ scope.row.address }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="is_default" label="默认地址" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.is_default ? 'success' : 'info'"
              size="small"
            >
              {{ scope.row.is_default ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(scope.row)"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteAddress(scope.row)"
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

    <!-- 地址详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="地址详情" width="600px">
      <div v-if="currentAddress" class="address-detail">
        <div class="detail-section">
          <h4>用户信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>用户名：</label>
              <span>{{ currentAddress.username }}</span>
            </div>
            <div class="detail-item">
              <label>邮箱：</label>
              <span>{{ currentAddress.email || "未设置" }}</span>
            </div>
            <div class="detail-item">
              <label>手机号：</label>
              <span>{{ currentAddress.user_phone || "未设置" }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>地址信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>收货人：</label>
              <span>{{ currentAddress.name }}</span>
            </div>
            <div class="detail-item">
              <label>联系电话：</label>
              <span>{{ currentAddress.phone }}</span>
            </div>
            <div class="detail-item">
              <label>省份：</label>
              <span>{{ currentAddress.province }}</span>
            </div>
            <div class="detail-item">
              <label>城市：</label>
              <span>{{ currentAddress.city }}</span>
            </div>
            <div class="detail-item">
              <label>区县：</label>
              <span>{{ currentAddress.district }}</span>
            </div>
            <div class="detail-item">
              <label>默认地址：</label>
              <el-tag
                :type="currentAddress.is_default ? 'success' : 'info'"
                size="small"
              >
                {{ currentAddress.is_default ? "是" : "否" }}
              </el-tag>
            </div>
            <div class="detail-item full-width">
              <label>详细地址：</label>
              <span>{{ currentAddress.address }}</span>
            </div>
            <div class="detail-item">
              <label>创建时间：</label>
              <span>{{ formatDateTime(currentAddress.created_at) }}</span>
            </div>
            <div class="detail-item">
              <label>更新时间：</label>
              <span>{{ formatDateTime(currentAddress.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";

// 数据
const loading = ref(false);
const addresses = ref([]);
const detailDialogVisible = ref(false);
const currentAddress = ref(null);

// 搜索表单
const searchForm = reactive({
  username: "",
  province: "",
  city: "",
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 获取地址列表
const fetchAddresses = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm,
    };

    const response = await request.get("/api/users/addresses", { params });

    if (response.data.success) {
      addresses.value = response.data.data.addresses;
      pagination.total = response.data.data.pagination.total;
    } else {
      ElMessage.error(response.data.message || "获取地址列表失败");
    }
  } catch (error) {
    console.error("获取地址列表失败:", error);
    ElMessage.error("获取地址列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchAddresses();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    username: "",
    province: "",
    city: "",
  });
  pagination.page = 1;
  fetchAddresses();
};

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.page = 1;
  fetchAddresses();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  fetchAddresses();
};

// 查看详情
const viewDetail = async (address) => {
  try {
    const response = await request.get(`/api/users/addresses/${address.id}`);
    if (response.data.success) {
      currentAddress.value = response.data.data;
      detailDialogVisible.value = true;
    } else {
      ElMessage.error(response.data.message || "获取地址详情失败");
    }
  } catch (error) {
    console.error("获取地址详情失败:", error);
    ElMessage.error("获取地址详情失败");
  }
};

// 删除地址
const deleteAddress = async (address) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${address.username}" 的这个地址吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const response = await request.delete(`/api/users/addresses/${address.id}`);
    if (response.data.success) {
      ElMessage.success("地址删除成功");
      fetchAddresses();
    } else {
      ElMessage.error(response.data.message || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除地址失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return "";
  return new Date(dateTime).toLocaleString("zh-CN");
};

// 页面加载时获取数据
onMounted(() => {
  fetchAddresses();
});
</script>

<style scoped>
.user-address-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.address-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.address-detail {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  min-width: 80px;
  font-weight: bold;
  color: #606266;
  margin-right: 10px;
}
</style>
