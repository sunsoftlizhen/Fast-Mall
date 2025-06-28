<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span class="title">个人信息</span>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 个人信息展示 -->
        <el-col :span="8">
          <div class="profile-info">
            <div class="avatar-section">
              <el-avatar :size="120" :src="userInfo.avatar || defaultAvatar">
                {{ userInfo.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <h3>{{ userInfo.username }}</h3>
              <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'">
                {{ userInfo.status === 1 ? "正常" : "禁用" }}
              </el-tag>
            </div>

            <div class="info-item">
              <label>角色：</label>
              <span>{{ userInfo.role_name }}</span>
            </div>

            <div class="info-item">
              <label>邮箱：</label>
              <span>{{ userInfo.email }}</span>
            </div>

            <div class="info-item">
              <label>手机：</label>
              <span>{{ userInfo.phone || "未设置" }}</span>
            </div>

            <div class="info-item">
              <label>注册时间：</label>
              <span>{{ formatDate(userInfo.created_at) }}</span>
            </div>

            <div class="info-item">
              <label>最后登录：</label>
              <span>{{ formatDate(userInfo.last_login_at) }}</span>
            </div>
          </div>
        </el-col>

        <!-- 编辑表单 -->
        <el-col :span="16">
          <el-tabs v-model="activeTab" type="border-card">
            <!-- 基本信息 -->
            <el-tab-pane label="基本信息" name="basic">
              <el-form
                ref="basicFormRef"
                :model="basicForm"
                :rules="basicRules"
                label-width="100px"
                class="profile-form"
              >
                <el-form-item label="用户名" prop="username">
                  <el-input
                    v-model="basicForm.username"
                    placeholder="请输入用户名"
                  />
                </el-form-item>

                <el-form-item label="邮箱" prop="email">
                  <el-input
                    v-model="basicForm.email"
                    placeholder="请输入邮箱"
                  />
                </el-form-item>

                <el-form-item label="手机号" prop="phone">
                  <el-input
                    v-model="basicForm.phone"
                    placeholder="请输入手机号"
                  />
                </el-form-item>

                <el-form-item label="头像URL" prop="avatar">
                  <el-input
                    v-model="basicForm.avatar"
                    placeholder="请输入头像URL"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button
                    type="primary"
                    @click="updateBasicInfo"
                    :loading="basicLoading"
                  >
                    保存基本信息
                  </el-button>
                  <el-button @click="resetBasicForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- 修改密码 -->
            <el-tab-pane label="修改密码" name="password">
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="100px"
                class="profile-form"
              >
                <el-form-item label="当前密码" prop="current_password">
                  <el-input
                    v-model="passwordForm.current_password"
                    type="password"
                    placeholder="请输入当前密码"
                    show-password
                  />
                </el-form-item>

                <el-form-item label="新密码" prop="new_password">
                  <el-input
                    v-model="passwordForm.new_password"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  />
                </el-form-item>

                <el-form-item label="确认密码" prop="confirm_password">
                  <el-input
                    v-model="passwordForm.confirm_password"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>

                <el-form-item>
                  <el-button
                    type="primary"
                    @click="updatePassword"
                    :loading="passwordLoading"
                  >
                    修改密码
                  </el-button>
                  <el-button @click="resetPasswordForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import request from "@/utils/request";

// 默认头像
const defaultAvatar =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjQ0NDIi8+CjxwYXRoIGQ9Ik0yMCA4NUMzMCA3MCA3MCA3MCA4MCA4NVY5MEgyMFY4NVoiIGZpbGw9IiNDQ0MiLz4KPC9zdmc+";

// 响应式数据
const activeTab = ref("basic");
const userInfo = ref({});
const basicLoading = ref(false);
const passwordLoading = ref(false);

// 基本信息表单
const basicFormRef = ref();
const basicForm = reactive({
  username: "",
  email: "",
  phone: "",
  avatar: "",
});

// 密码表单
const passwordFormRef = ref();
const passwordForm = reactive({
  current_password: "",
  new_password: "",
  confirm_password: "",
});

// 表单验证规则
const basicRules = {
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
};

const passwordRules = {
  current_password: [
    { required: true, message: "请输入当前密码", trigger: "blur" },
  ],
  new_password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于 6 位", trigger: "blur" },
  ],
  confirm_password: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.new_password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// 获取个人信息
const getProfile = async () => {
  try {
    const response = await request.get("/users/profile");
    userInfo.value = response.data;

    // 填充基本信息表单
    basicForm.username = userInfo.value.username;
    basicForm.email = userInfo.value.email;
    basicForm.phone = userInfo.value.phone || "";
    basicForm.avatar = userInfo.value.avatar || "";
  } catch (error) {
    ElMessage.error(error.message || "获取个人信息失败");
  }
};

// 更新基本信息
const updateBasicInfo = async () => {
  if (!basicFormRef.value) return;

  try {
    await basicFormRef.value.validate();
    basicLoading.value = true;

    await request.put("/users/profile", basicForm);
    ElMessage.success("基本信息更新成功");

    // 重新获取个人信息
    await getProfile();
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    basicLoading.value = false;
  }
};

// 修改密码
const updatePassword = async () => {
  if (!passwordFormRef.value) return;

  try {
    await passwordFormRef.value.validate();
    passwordLoading.value = true;

    await request.put("/users/profile", passwordForm);
    ElMessage.success("密码修改成功");

    // 重置密码表单
    resetPasswordForm();
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    passwordLoading.value = false;
  }
};

// 重置基本信息表单
const resetBasicForm = () => {
  basicForm.username = userInfo.value.username;
  basicForm.email = userInfo.value.email;
  basicForm.phone = userInfo.value.phone || "";
  basicForm.avatar = userInfo.value.avatar || "";
};

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.current_password = "";
  passwordForm.new_password = "";
  passwordForm.confirm_password = "";
  if (passwordFormRef.value) {
    passwordFormRef.value.clearValidate();
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return "未知";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 组件挂载时获取数据
onMounted(() => {
  getProfile();
});
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.profile-info {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-section h3 {
  margin: 15px 0 10px 0;
  color: #303133;
}

.info-item {
  display: flex;
  margin-bottom: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.info-item label {
  width: 80px;
  color: #606266;
  font-weight: 500;
}

.info-item span {
  flex: 1;
  color: #303133;
}

.profile-form {
  padding: 20px;
}

.profile-form .el-form-item {
  margin-bottom: 25px;
}
</style>
