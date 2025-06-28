<template>
  <div class="address-form">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="isEdit ? '编辑地址' : '新增地址'"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
      class="nav-bar"
    />

    <!-- 表单容器 -->
    <div class="form-container">
      <!-- 表单标题 -->
      <div class="form-header">
        <van-icon name="location-o" class="header-icon" />
        <div class="header-text">
          <h2>{{ isEdit ? "编辑收货地址" : "添加收货地址" }}</h2>
          <p>完善地址信息，让商品准确送达</p>
        </div>
      </div>

      <!-- 表单卡片 -->
      <div class="form-card">
        <van-form @submit="handleSubmit" ref="formRef">
          <!-- 收货人信息 -->
          <div class="form-section">
            <div class="section-title">
              <van-icon name="contact" />
              <span>收货人信息</span>
            </div>

            <div class="field-group">
              <div class="input-wrapper">
                <van-field
                  v-model="form.name"
                  name="name"
                  placeholder="请输入收货人姓名"
                  :rules="[{ required: true, message: '请输入收货人姓名' }]"
                  clearable
                  class="custom-field"
                >
                  <template #left-icon>
                    <van-icon name="user-o" class="field-icon" />
                  </template>
                  <template #label>
                    <span class="field-label">姓名</span>
                  </template>
                </van-field>
              </div>

              <div class="input-wrapper">
                <van-field
                  v-model="form.phone"
                  name="phone"
                  placeholder="请输入手机号码"
                  :rules="[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                  ]"
                  clearable
                  class="custom-field"
                >
                  <template #left-icon>
                    <van-icon name="phone-o" class="field-icon" />
                  </template>
                  <template #label>
                    <span class="field-label">电话</span>
                  </template>
                </van-field>
              </div>
            </div>
          </div>

          <!-- 地址信息 -->
          <div class="form-section">
            <div class="section-title">
              <van-icon name="location-o" />
              <span>地址信息</span>
            </div>

            <div class="field-group">
              <div class="input-wrapper">
                <van-field
                  v-model="areaText"
                  name="area"
                  placeholder="请选择省市区"
                  readonly
                  is-link
                  @click="openAreaPicker"
                  :rules="[{ required: true, message: '请选择所在地区' }]"
                  class="custom-field area-field"
                >
                  <template #left-icon>
                    <van-icon name="aim" class="field-icon" />
                  </template>
                  <template #label>
                    <span class="field-label">地区</span>
                  </template>
                </van-field>
              </div>

              <div class="input-wrapper address-wrapper">
                <van-field
                  v-model="form.address"
                  name="address"
                  placeholder="街道、楼牌号等详细信息"
                  :rules="[{ required: true, message: '请输入详细地址' }]"
                  type="textarea"
                  rows="3"
                  maxlength="200"
                  show-word-limit
                  class="custom-field address-field"
                >
                  <template #left-icon>
                    <van-icon name="location" class="field-icon address-icon" />
                  </template>
                  <template #label>
                    <span class="field-label">详细地址</span>
                  </template>
                </van-field>
              </div>
            </div>
          </div>

          <!-- 设置选项 -->
          <div class="form-section">
            <div class="section-title">
              <van-icon name="setting-o" />
              <span>设置选项</span>
            </div>

            <div class="switch-wrapper">
              <div class="switch-item">
                <div class="switch-content">
                  <van-icon name="star-o" class="switch-icon" />
                  <div class="switch-text">
                    <span class="switch-title">设为默认地址</span>
                    <span class="switch-desc">优先使用此地址进行配送</span>
                  </div>
                </div>
                <van-switch
                  v-model="form.is_default"
                  class="custom-switch"
                  active-color="#667eea"
                />
              </div>
            </div>
          </div>
        </van-form>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <van-button
          type="primary"
          block
          @click="handleSubmit"
          :loading="submitting"
          class="submit-btn"
          round
          size="large"
        >
          <van-icon name="checked" v-if="!submitting" />
          {{ submitting ? "保存中..." : isEdit ? "更新地址" : "保存地址" }}
        </van-button>
      </div>
    </div>

    <!-- 地区选择器 -->
    <van-popup
      v-model="showAreaPicker"
      position="bottom"
      round
      class="area-popup"
    >
      <van-area
        :area-list="areaList"
        @confirm="onAreaConfirm"
        @cancel="showAreaPicker = false"
        title="选择地区"
        class="custom-area"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { showToast } from "vant";
import api from "../utils/api";
import areaData from "../utils/areaData";

const router = useRouter();
const route = useRoute();
const formRef = ref();

// 是否编辑模式
const isEdit = computed(() => route.params.id);
const addressId = computed(() => route.params.id);

// 表单数据
const form = reactive({
  name: "",
  phone: "",
  province: "",
  city: "",
  district: "",
  address: "",
  is_default: false,
});

// 地区选择
const showAreaPicker = ref(false);
const areaList = areaData;

// 地区显示文本
const areaText = computed(() => {
  if (form.province && form.city && form.district) {
    return `${form.province} ${form.city} ${form.district}`;
  }
  return "";
});

const submitting = ref(false);

// 打开地区选择器
const openAreaPicker = () => {
  console.log("点击了地区选择器");
  console.log("areaList:", areaList);
  showAreaPicker.value = true;
  console.log("showAreaPicker:", showAreaPicker.value);
};

// 地区选择确认
const onAreaConfirm = ({ selectedValues, selectedOptions }) => {
  console.log("地区选择确认:", { selectedValues, selectedOptions });
  form.province = selectedOptions[0]?.text || "";
  form.city = selectedOptions[1]?.text || "";
  form.district = selectedOptions[2]?.text || "";
  showAreaPicker.value = false;
};

// 加载地址详情（编辑模式）
const loadAddressDetail = async () => {
  if (!isEdit.value) return;

  try {
    const response = await api.get(`/mobile/addresses/${addressId.value}`);
    if (response.success) {
      const address = response.data.data;
      Object.assign(form, {
        name: address.name,
        phone: address.phone,
        province: address.province,
        city: address.city,
        district: address.district,
        address: address.address,
        is_default: Boolean(address.is_default),
      });
    } else {
      showToast(response.message || "获取地址详情失败");
      router.back();
    }
  } catch (error) {
    console.error("获取地址详情失败:", error);
    showToast("获取地址详情失败");
    router.back();
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    submitting.value = true;

    const data = {
      name: form.name,
      phone: form.phone,
      province: form.province,
      city: form.city,
      district: form.district,
      address: form.address,
      is_default: form.is_default,
    };

    let response;
    if (isEdit.value) {
      response = await api.put(`/mobile/addresses/${addressId.value}`, data);
    } else {
      response = await api.post("/mobile/addresses", data);
    }

    if (response.success) {
      showToast(isEdit.value ? "地址更新成功" : "地址添加成功");
      router.back();
    } else {
      showToast(response.message || "保存失败");
    }
  } catch (error) {
    console.error("保存地址失败:", error);
    showToast("保存失败");
  } finally {
    submitting.value = false;
  }
};

// 页面加载
onMounted(() => {
  loadAddressDetail();
});
</script>

<style scoped>
.address-form {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
}

.nav-bar {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  --van-nav-bar-text-color: white;
  --van-nav-bar-icon-color: white;
  --van-nav-bar-title-text-color: white;
}

.form-container {
  padding: 16px;
  padding-bottom: 100px;
}

/* 表单头部 */
.form-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.header-icon {
  font-size: 32px;
  color: #667eea;
  margin-right: 16px;
}

.header-text h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #323233;
}

.header-text p {
  margin: 0;
  font-size: 14px;
  color: #969799;
  line-height: 1.4;
}

/* 表单卡片 */
.form-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 表单区域 */
.form-section {
  padding: 20px;
  border-bottom: 1px solid #f7f8fa;
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.section-title .van-icon {
  font-size: 16px;
  color: #667eea;
  margin-right: 8px;
}

.section-title span {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

/* 字段组 */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrapper {
  position: relative;
}

/* 自定义字段样式 */
.custom-field {
  --van-field-label-width: 60px;
  border-radius: 12px;
  background: #f7f8fa;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.custom-field:focus-within {
  background: white;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.field-icon {
  color: #667eea;
  margin-right: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: #646566;
}

/* 地区选择字段 */
.area-field {
  cursor: pointer;
}

.area-field:hover {
  background: #f0f1ff;
}

/* 地址输入框 */
.address-wrapper {
  position: relative;
}

.address-field {
  --van-field-input-text-color: #323233;
}

.address-icon {
  align-self: flex-start;
  margin-top: 12px;
}

/* 开关设置 */
.switch-wrapper {
  margin-top: 12px;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.switch-item:hover {
  background: #f0f1ff;
}

.switch-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.switch-icon {
  font-size: 20px;
  color: #667eea;
  margin-right: 12px;
}

.switch-text {
  display: flex;
  flex-direction: column;
}

.switch-title {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 2px;
}

.switch-desc {
  font-size: 12px;
  color: #969799;
}

.custom-switch {
  --van-switch-size: 24px;
}

/* 提交按钮 */
.submit-section {
  margin-top: 24px;
  padding: 0 4px;
}

.submit-btn {
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.submit-btn .van-icon {
  font-size: 18px;
}

/* 弹窗样式 */
.area-popup {
  --van-popup-border-radius: 16px 16px 0 0;
}

.custom-area {
  --van-area-header-font-size: 16px;
  --van-area-header-font-weight: 600;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .form-container {
    padding: 12px;
  }

  .form-header {
    padding: 16px;
  }

  .header-icon {
    font-size: 28px;
  }

  .header-text h2 {
    font-size: 18px;
  }

  .form-section {
    padding: 16px;
  }

  .submit-btn {
    height: 46px;
    font-size: 15px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .address-form {
    background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .form-header,
  .form-card {
    background: #2d2d2d;
    border: 1px solid #404040;
  }

  .header-text h2 {
    color: #ffffff;
  }

  .section-title span {
    color: #e5e5e5;
  }

  .custom-field {
    background: #404040;
    color: #e5e5e5;
  }

  .custom-field:focus-within {
    background: #4a4a4a;
  }

  .field-label {
    color: #b3b3b3;
  }

  .switch-item {
    background: #404040;
  }

  .switch-item:hover {
    background: #4a4a4a;
  }

  .switch-title {
    color: #e5e5e5;
  }
}

/* 表单验证样式 */
.van-field--error .custom-field {
  border-color: #ee0a24;
  background: #fff5f5;
}

.van-field--error .field-icon {
  color: #ee0a24;
}

/* 加载状态 */
.submit-btn[loading] {
  opacity: 0.7;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-section {
  animation: fadeInUp 0.5s ease forwards;
}

.form-section:nth-child(1) {
  animation-delay: 0.1s;
}
.form-section:nth-child(2) {
  animation-delay: 0.2s;
}
.form-section:nth-child(3) {
  animation-delay: 0.3s;
}
</style>
