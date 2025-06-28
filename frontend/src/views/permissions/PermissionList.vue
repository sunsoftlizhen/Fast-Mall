<template>
  <div class="permission-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
          <el-button type="primary" disabled>
            <el-icon><Plus /></el-icon>
            添加权限
          </el-button>
        </div>
      </template>

      <!-- 权限表格 -->
      <el-table :data="permissions" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="权限名称" width="150" />
        <el-table-column prop="code" label="权限代码" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button size="small" type="primary" disabled> 编辑 </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-alert
        title="权限说明"
        type="info"
        show-icon
        :closable="false"
        style="margin-top: 20px"
      >
        <template #default>
          <p>
            权限是系统预定义的，目前不支持动态添加或编辑。如需修改权限，请联系系统管理员。
          </p>
          <p><strong>权限代码说明：</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px">
            <li><code>user:view</code> - 查看用户列表</li>
            <li><code>user:add</code> - 添加用户</li>
            <li><code>user:edit</code> - 编辑用户</li>
            <li><code>user:delete</code> - 删除用户</li>
            <li><code>role:manage</code> - 角色管理</li>
            <li><code>permission:manage</code> - 权限管理</li>
            <li><code>system:setting</code> - 系统设置</li>
          </ul>
        </template>
      </el-alert>
    </el-card>

    <!-- 权限详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="权限详情" width="600px">
      <div v-if="currentPermission" class="permission-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="权限名称" :span="2">
            {{ currentPermission.name }}
          </el-descriptions-item>
          <el-descriptions-item label="权限代码" :span="2">
            <el-tag type="info">{{ currentPermission.code }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ currentPermission.description || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(currentPermission.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(currentPermission.updated_at) }}
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
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import request from "@/utils/request";

// 数据
const loading = ref(false);
const permissions = ref([]);
const currentPermission = ref(null);
const viewDialogVisible = ref(false);

// 获取权限列表
const fetchPermissions = async () => {
  loading.value = true;
  try {
    const response = await request.get("/permissions");
    permissions.value = response.data;
  } catch (error) {
    ElMessage.error("获取权限列表失败");
  } finally {
    loading.value = false;
  }
};

// 查看权限详情
const handleView = (permission) => {
  currentPermission.value = permission;
  viewDialogVisible.value = true;
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString("zh-CN");
};

onMounted(() => {
  fetchPermissions();
});
</script>

<style scoped>
.permission-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.permission-detail {
  padding: 20px 0;
}

:deep(.el-table) {
  border-radius: 6px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-alert__content) {
  color: #606266;
}

:deep(.el-alert__content p) {
  margin: 5px 0;
}

:deep(.el-alert__content ul) {
  color: #909399;
}

:deep(.el-alert__content code) {
  background-color: #f5f7fa;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  color: #e6a23c;
}
</style>
