<template>
  <div class="moment-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>朋友圈管理</h2>
      <p>管理用户发布的朋友圈动态</p>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
          >
            <el-option label="待审核" value="0" />
            <el-option label="已发布" value="1" />
            <el-option label="已隐藏" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择类型"
            clearable
          >
            <el-option label="普通动态" value="normal" />
            <el-option label="商品评价" value="product_review" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 朋友圈列表 -->
    <el-card class="table-card">
      <el-table :data="moments" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="content" label="内容" min-width="200">
          <template #default="scope">
            <div class="content-preview">
              {{ scope.row.content }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.type === 'product_review' ? 'warning' : 'info'"
            >
              {{
                scope.row.type === "product_review" ? "商品评价" : "普通动态"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="product_name" label="关联商品" width="150">
          <template #default="scope">
            <span v-if="scope.row.product_name">{{
              scope.row.product_name
            }}</span>
            <span v-else class="text-muted">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="likes_count" label="点赞数" width="80" />
        <el-table-column prop="comments_count" label="评论数" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewMoment(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 0"
              size="small"
              type="success"
              @click="approveMoment(scope.row.id)"
            >
              通过
            </el-button>
            <el-button
              v-if="scope.row.status === 1"
              size="small"
              type="warning"
              @click="hideMoment(scope.row.id)"
            >
              隐藏
            </el-button>
            <el-button
              v-if="scope.row.status === 2"
              size="small"
              type="success"
              @click="showMoment(scope.row.id)"
            >
              显示
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteMoment(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 查看朋友圈详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="朋友圈详情" width="600px">
      <div v-if="currentMoment" class="moment-detail">
        <div class="detail-item">
          <label>用户：</label>
          <span>{{ currentMoment.username }}</span>
        </div>
        <div class="detail-item">
          <label>内容：</label>
          <div class="content-text">{{ currentMoment.content }}</div>
        </div>
        <div
          v-if="currentMoment.images && currentMoment.images.length > 0"
          class="detail-item"
        >
          <label>图片：</label>
          <div class="images-grid">
            <el-image
              v-for="(image, index) in currentMoment.images"
              :key="index"
              :src="image"
              fit="cover"
              class="moment-image"
              :preview-src-list="currentMoment.images"
              :initial-index="index"
            />
          </div>
        </div>
        <div v-if="currentMoment.location" class="detail-item">
          <label>位置：</label>
          <span>{{ currentMoment.location }}</span>
        </div>
        <div v-if="currentMoment.product_name" class="detail-item">
          <label>关联商品：</label>
          <span>{{ currentMoment.product_name }}</span>
        </div>
        <div class="detail-item">
          <label>类型：</label>
          <el-tag
            :type="currentMoment.type === 'product_review' ? 'warning' : 'info'"
          >
            {{
              currentMoment.type === "product_review" ? "商品评价" : "普通动态"
            }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>状态：</label>
          <el-tag :type="getStatusType(currentMoment.status)">
            {{ getStatusText(currentMoment.status) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>统计：</label>
          <span
            >点赞 {{ currentMoment.likes_count || 0 }} 次，评论
            {{ currentMoment.comments_count || 0 }} 条</span
          >
        </div>
        <div class="detail-item">
          <label>发布时间：</label>
          <span>{{ formatDateTime(currentMoment.created_at) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";

// 数据
const loading = ref(false);
const moments = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchForm = ref({
  username: "",
  status: "",
  type: "",
});

const detailDialogVisible = ref(false);
const currentMoment = ref(null);

// 获取朋友圈列表
const fetchMoments = async () => {
  try {
    loading.value = true;
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value,
    };

    const response = await request.get("/dashboard/moments", { params });

    if (response.success) {
      moments.value = response.data.moments || [];
      total.value = response.data.total || 0;
    } else {
      ElMessage.error(response.message || "获取朋友圈列表失败");
    }
  } catch (error) {
    console.error("获取朋友圈列表失败:", error);
    ElMessage.error("获取朋友圈列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchMoments();
};

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    username: "",
    status: "",
    type: "",
  };
  currentPage.value = 1;
  fetchMoments();
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchMoments();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchMoments();
};

// 查看朋友圈详情
const viewMoment = (moment) => {
  currentMoment.value = moment;
  detailDialogVisible.value = true;
};

// 审核通过
const approveMoment = async (id) => {
  try {
    const response = await request.put(`/dashboard/moments/${id}/approve`);
    if (response.success) {
      ElMessage.success("审核通过成功");
      fetchMoments();
    } else {
      ElMessage.error(response.message || "审核通过失败");
    }
  } catch (error) {
    console.error("审核通过失败:", error);
    ElMessage.error("审核通过失败");
  }
};

// 隐藏朋友圈
const hideMoment = async (id) => {
  try {
    await ElMessageBox.confirm("确定要隐藏这条朋友圈吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const response = await request.put(`/dashboard/moments/${id}/hide`);
    if (response.success) {
      ElMessage.success("隐藏成功");
      fetchMoments();
    } else {
      ElMessage.error(response.message || "隐藏失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("隐藏失败:", error);
      ElMessage.error("隐藏失败");
    }
  }
};

// 显示朋友圈
const showMoment = async (id) => {
  try {
    const response = await request.put(`/dashboard/moments/${id}/show`);
    if (response.success) {
      ElMessage.success("显示成功");
      fetchMoments();
    } else {
      ElMessage.error(response.message || "显示失败");
    }
  } catch (error) {
    console.error("显示失败:", error);
    ElMessage.error("显示失败");
  }
};

// 删除朋友圈
const deleteMoment = async (id) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这条朋友圈吗？删除后无法恢复！",
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const response = await request.delete(`/dashboard/moments/${id}`);
    if (response.success) {
      ElMessage.success("删除成功");
      fetchMoments();
    } else {
      ElMessage.error(response.message || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 0:
      return "warning";
    case 1:
      return "success";
    case 2:
      return "info";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 0:
      return "待审核";
    case 1:
      return "已发布";
    case 2:
      return "已隐藏";
    default:
      return "未知";
  }
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return "";
  return new Date(dateTime).toLocaleString("zh-CN");
};

// 页面加载时获取数据
onMounted(() => {
  fetchMoments();
});
</script>

<style scoped>
.moment-list {
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

.content-preview {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-muted {
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.moment-detail {
  padding: 10px 0;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.detail-item label {
  min-width: 80px;
  font-weight: bold;
  color: #606266;
  margin-right: 10px;
}

.content-text {
  flex: 1;
  line-height: 1.6;
  white-space: pre-wrap;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  flex: 1;
}

.moment-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
}
</style>
