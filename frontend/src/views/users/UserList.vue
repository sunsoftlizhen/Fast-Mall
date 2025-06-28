<template>
  <div class="user-list">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索用户名或邮箱"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="searchForm.status"
              placeholder="用户状态"
              clearable
            >
              <el-option label="正常" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-col>
          <el-col :span="8" class="text-right">
            <el-button
              type="primary"
              @click="$router.push('/users/add')"
              v-if="hasPermission('user:add')"
            >
              <el-icon><Plus /></el-icon>
              添加用户
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 用户表格 -->
      <el-table
        :data="users"
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="role_name" label="角色" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? "正常" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.last_login_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              size="small"
              type="info"
              @click="handleViewAddresses(scope.row)"
              v-if="hasPermission('user:view')"
            >
              地址
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="handleEdit(scope.row)"
              v-if="hasPermission('user:edit')"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
              v-if="hasPermission('user:delete')"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
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

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="用户详情"
      width="600px"
      :before-close="handleViewDialogClose"
    >
      <div v-if="currentUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">
            {{ currentUser.username }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ currentUser.email }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ currentUser.phone || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            {{ currentUser.role_name }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentUser.status === 1 ? 'success' : 'danger'">
              {{ currentUser.status === 1 ? "正常" : "禁用" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后登录">
            {{ formatDateTime(currentUser.last_login_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ formatDateTime(currentUser.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";

const router = useRouter();
const authStore = useAuthStore();

// 权限检查
const hasPermission = computed(() => authStore.hasPermission);

// 数据
const loading = ref(false);
const users = ref([]);
const currentUser = ref(null);
const viewDialogVisible = ref(false);

// 搜索表单
const searchForm = reactive({
  keyword: "",
  status: "",
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status,
    };

    const response = await request.get("/users", { params });
    users.value = response.data.users;
    pagination.total = response.data.pagination.total;
  } catch (error) {
    ElMessage.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchUsers();
};

// 重置搜索
const handleReset = () => {
  searchForm.keyword = "";
  searchForm.status = "";
  pagination.page = 1;
  fetchUsers();
};

// 分页大小改变
const handleSizeChange = (val) => {
  pagination.pageSize = val;
  pagination.page = 1;
  fetchUsers();
};

// 当前页改变
const handleCurrentChange = (val) => {
  pagination.page = val;
  fetchUsers();
};

// 排序改变
const handleSortChange = ({ column, prop, order }) => {
  // 可以实现排序功能
  console.log("排序改变:", { column, prop, order });
};

// 查看用户详情
const handleView = (user) => {
  currentUser.value = user;
  viewDialogVisible.value = true;
};

// 查看用户地址
const handleViewAddresses = (user) => {
  router.push(`/users/${user.id}/addresses`);
};

// 编辑用户
const handleEdit = (user) => {
  router.push(`/users/edit/${user.id}`);
};

// 删除用户
const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await request.delete(`/users/${user.id}`);
    ElMessage.success("删除用户成功");
    fetchUsers();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除用户失败");
    }
  }
};

// 关闭详情对话框
const handleViewDialogClose = () => {
  viewDialogVisible.value = false;
  currentUser.value = null;
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString("zh-CN");
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-list {
  padding: 0;
}

.search-bar {
  margin-bottom: 20px;
}

.text-right {
  text-align: right;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.user-detail {
  padding: 20px 0;
}

:deep(.el-table) {
  border-radius: 6px;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
