<template>
  <div class="edit-product-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">编辑商品</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="product-form"
        v-loading="loading"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品图片" prop="image">
              <el-input v-model="form.image" placeholder="请输入图片URL" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品规格" prop="spec_id">
              <el-select
                v-model="form.spec_id"
                placeholder="请选择规格"
                style="width: 100%"
              >
                <el-option
                  v-for="spec in specList"
                  :key="spec.id"
                  :label="spec.name"
                  :value="spec.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="商品单位" prop="unit_id">
              <el-select
                v-model="form.unit_id"
                placeholder="请选择单位"
                style="width: 100%"
              >
                <el-option
                  v-for="unit in unitList"
                  :key="unit.id"
                  :label="unit.name"
                  :value="unit.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="进货价" prop="purchase_price">
              <el-input-number
                v-model="form.purchase_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入进货价"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="售价" prop="sale_price">
              <el-input-number
                v-model="form.sale_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入售价"
              />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="折扣价" prop="discount_price">
              <el-input-number
                v-model="form.discount_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入折扣价"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库存数量" prop="stock_quantity">
              <el-input-number
                v-model="form.stock_quantity"
                :min="0"
                style="width: 100%"
                placeholder="请输入库存数量"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="保质期(天)" prop="shelf_life">
              <el-input-number
                v-model="form.shelf_life"
                :min="0"
                style="width: 100%"
                placeholder="请输入保质期天数"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="商品状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitLoading"
          >
            保存
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="goBack">取消</el-button>
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

// 响应式数据
const loading = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const specList = ref([]);
const unitList = ref([]);

// 表单数据
const form = reactive({
  name: "",
  image: "",
  spec_id: "",
  unit_id: "",
  description: "",
  purchase_price: 0,
  discount_price: null,
  sale_price: 0,
  shelf_life: null,
  stock_quantity: 0,
  status: 1,
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入商品名称", trigger: "blur" },
    {
      min: 1,
      max: 200,
      message: "商品名称长度在 1 到 200 个字符",
      trigger: "blur",
    },
  ],
  spec_id: [{ required: true, message: "请选择商品规格", trigger: "change" }],
  unit_id: [{ required: true, message: "请选择商品单位", trigger: "change" }],
  purchase_price: [
    { required: true, message: "请输入进货价", trigger: "blur" },
    { type: "number", min: 0, message: "进货价不能为负数", trigger: "blur" },
  ],
  sale_price: [
    { required: true, message: "请输入售价", trigger: "blur" },
    { type: "number", min: 0, message: "售价不能为负数", trigger: "blur" },
  ],
};

// 获取商品详情
const getProductDetail = async () => {
  try {
    loading.value = true;
    const productId = route.params.id;
    const response = await request.get(`/products/${productId}`);
    const product = response.data;

    // 填充表单数据
    Object.keys(form).forEach((key) => {
      if (product[key] !== undefined) {
        form[key] = product[key];
      }
    });
  } catch (error) {
    ElMessage.error(error.message || "获取商品详情失败");
    router.push("/products");
  } finally {
    loading.value = false;
  }
};

// 获取规格列表
const getSpecList = async () => {
  try {
    const response = await request.get("/products/specs/list");
    specList.value = response.data;
  } catch (error) {
    ElMessage.error("获取规格列表失败");
  }
};

// 获取单位列表
const getUnitList = async () => {
  try {
    const response = await request.get("/products/units/list");
    unitList.value = response.data;
  } catch (error) {
    ElMessage.error("获取单位列表失败");
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const productId = route.params.id;
    await request.put(`/products/${productId}`, form);
    ElMessage.success("更新商品成功");
    router.push("/products");
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
  getProductDetail();
};

// 返回列表
const goBack = () => {
  router.push("/products");
};

// 组件挂载时获取数据
onMounted(async () => {
  await Promise.all([getSpecList(), getUnitList(), getProductDetail()]);
});
</script>

<style scoped>
.edit-product-container {
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

.product-form {
  max-width: 800px;
}

.product-form .el-form-item {
  margin-bottom: 25px;
}
</style>
