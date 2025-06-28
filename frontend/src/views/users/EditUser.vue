<template>
  <div class="edit-user">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>编辑用户</span>
          <el-button @click="$router.go(-1)">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="user-form"
        v-loading="pageLoading"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="form.email"
                placeholder="请输入邮箱"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="form.phone"
                placeholder="请输入手机号（可选）"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role_id">
              <el-select
                v-model="form.role_id"
                placeholder="请选择角色"
                style="width: 100%"
              >
                <el-option
                  v-for="role in roles"
                  :key="role.id"
                  :label="role.name"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="新密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="留空则不修改密码"
                show-password
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitLoading"
          >
            {{ submitLoading ? "保存中..." : "保存" }}
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="$router.go(-1)">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import request from "@/utils/request";

const router = useRouter();
const route = useRoute();
const formRef = ref();
const pageLoading = ref(false);
const submitLoading = ref(false);
const roles = ref([]);
const originalData = ref({});

// 表单数据
const form = reactive({
  username: "",
  email: "",
  phone: "",
  role_id: "",
  password: "",
  confirmPassword: "",
  status: 1,
});

// 确认密码验证
const validateConfirmPassword = (rule, value, callback) => {
  if (form.password && value === "") {
    callback(new Error("请再次输入密码"));
  } else if (form.password && value !== form.password) {
    callback(new Error("两次输入密码不一致"));
  } else {
    callback();
  }
};

// 表单验证规则
const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 3,
      max: 50,
      message: "用户名长度在 3 到 50 个字符",
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
  role_id: [{ required: true, message: "请选择角色", trigger: "change" }],
  password: [{ min: 6, message: "密码长度不能少于 6 个字符", trigger: "blur" }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

// 获取角色列表
const fetchRoles = async () => {
  try {
    const response = await request.get("/roles/all");
    roles.value = response.data;
  } catch (error) {
    ElMessage.error("获取角色列表失败");
  }
};

// 获取用户详情
const fetchUser = async () => {
  const userId = route.params.id;
  if (!userId) {
    ElMessage.error("用户ID无效");
    router.go(-1);
    return;
  }

  pageLoading.value = true;
  try {
    const response = await request.get(`/users/${userId}`);
    const user = response.data;

    // 保存原始数据
    originalData.value = { ...user };

    // 填充表单
    form.username = user.username;
    form.email = user.email;
    form.phone = user.phone || "";
    form.role_id = user.role_id;
    form.status = user.status;
    form.password = "";
    form.confirmPassword = "";
  } catch (error) {
    ElMessage.error("获取用户信息失败");
    router.go(-1);
  } finally {
    pageLoading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const userId = route.params.id;
    const { confirmPassword, ...userData } = form;

    // 如果密码为空，则不更新密码
    if (!userData.password) {
      delete userData.password;
    }

    await request.put(`/users/${userId}`, userData);

    ElMessage.success("更新用户成功");
    router.push("/users");
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    submitLoading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  if (originalData.value.id) {
    form.username = originalData.value.username;
    form.email = originalData.value.email;
    form.phone = originalData.value.phone || "";
    form.role_id = originalData.value.role_id;
    form.status = originalData.value.status;
    form.password = "";
    form.confirmPassword = "";

    if (formRef.value) {
      formRef.value.clearValidate();
    }
  }
};

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchUser()]);
});
</script>

<style scoped>
.edit-user {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.user-form {
  max-width: 800px;
  margin: 20px 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
