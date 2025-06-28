<template>
  <div class="role-list">
    <el-card>
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索角色名称或描述"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
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
          <el-col :span="12" class="text-right">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加角色
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 角色表格 -->
      <el-table :data="roles" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="permissions" label="权限" width="300">
          <template #default="scope">
            <el-tag
              v-for="permission in scope.row.permissions.slice(0, 3)"
              :key="permission.id"
              size="small"
              style="margin-right: 5px; margin-bottom: 5px"
            >
              {{ permission.name }}
            </el-tag>
            <el-tag
              v-if="scope.row.permissions.length > 3"
              size="small"
              type="info"
            >
              +{{ scope.row.permissions.length - 3 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
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

    <!-- 角色详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="角色详情" width="700px">
      <div v-if="currentRole" class="role-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="角色名称" :span="2">
            {{ currentRole.name }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ currentRole.description || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(currentRole.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(currentRole.updated_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="权限列表" :span="2">
            <div class="permission-list">
              <el-tag
                v-for="permission in currentRole.permissions"
                :key="permission.id"
                style="margin: 2px"
              >
                {{ permission.name }}
              </el-tag>
              <span
                v-if="currentRole.permissions.length === 0"
                class="no-permission"
              >
                暂无权限
              </span>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑角色对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑角色' : '添加角色'"
      width="600px"
      :before-close="handleFormDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入角色名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
            clearable
          />
        </el-form-item>
        <el-form-item label="权限" prop="permission_ids">
          <el-checkbox-group v-model="form.permission_ids">
            <el-row>
              <el-col
                :span="8"
                v-for="permission in permissions"
                :key="permission.id"
              >
                <el-checkbox :label="permission.id">
                  {{ permission.name }}
                </el-checkbox>
              </el-col>
            </el-row>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleFormDialogClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
        >
          {{ submitLoading ? "保存中..." : "保存" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import request from "@/utils/request";

// 数据
const loading = ref(false);
const submitLoading = ref(false);
const roles = ref([]);
const permissions = ref([]);
const currentRole = ref(null);
const viewDialogVisible = ref(false);
const formDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  keyword: "",
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 表单数据
const form = reactive({
  name: "",
  description: "",
  permission_ids: [],
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入角色名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "角色名称长度在 2 到 50 个字符",
      trigger: "blur",
    },
  ],
};

// 获取角色列表
const fetchRoles = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
    };

    const response = await request.get("/roles", { params });
    roles.value = response.data.roles;
    pagination.total = response.data.pagination.total;
  } catch (error) {
    ElMessage.error("获取角色列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取权限列表
const fetchPermissions = async () => {
  try {
    const response = await request.get("/permissions");
    permissions.value = response.data;
  } catch (error) {
    ElMessage.error("获取权限列表失败");
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  fetchRoles();
};

// 重置搜索
const handleReset = () => {
  searchForm.keyword = "";
  pagination.page = 1;
  fetchRoles();
};

// 分页大小改变
const handleSizeChange = (val) => {
  pagination.pageSize = val;
  pagination.page = 1;
  fetchRoles();
};

// 当前页改变
const handleCurrentChange = (val) => {
  pagination.page = val;
  fetchRoles();
};

// 查看角色详情
const handleView = (role) => {
  currentRole.value = role;
  viewDialogVisible.value = true;
};

// 添加角色
const handleAdd = () => {
  isEdit.value = false;
  form.name = "";
  form.description = "";
  form.permission_ids = [];
  formDialogVisible.value = true;
};

// 编辑角色
const handleEdit = async (role) => {
  try {
    const response = await request.get(`/roles/${role.id}`);
    const roleDetail = response.data;

    isEdit.value = true;
    form.name = roleDetail.name;
    form.description = roleDetail.description || "";
    form.permission_ids = roleDetail.permissions.map((p) => p.id);
    formDialogVisible.value = true;
  } catch (error) {
    ElMessage.error("获取角色详情失败");
  }
};

// 删除角色
const handleDelete = async (role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await request.delete(`/roles/${role.id}`);
    ElMessage.success("删除角色成功");
    fetchRoles();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除角色失败");
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    if (isEdit.value) {
      await request.put(`/roles/${currentRole.value.id}`, form);
      ElMessage.success("更新角色成功");
    } else {
      await request.post("/roles", form);
      ElMessage.success("添加角色成功");
    }

    formDialogVisible.value = false;
    fetchRoles();
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    submitLoading.value = false;
  }
};

// 关闭表单对话框
const handleFormDialogClose = () => {
  formDialogVisible.value = false;
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString("zh-CN");
};

onMounted(() => {
  Promise.all([fetchRoles(), fetchPermissions()]);
});
</script>

<style scoped>
.role-list {
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

.role-detail {
  padding: 20px 0;
}

.permission-list {
  line-height: 2;
}

.no-permission {
  color: #999;
  font-style: italic;
}

:deep(.el-table) {
  border-radius: 6px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-checkbox-group) {
  width: 100%;
}

:deep(.el-checkbox) {
  margin-bottom: 10px;
  white-space: nowrap;
}
</style>
