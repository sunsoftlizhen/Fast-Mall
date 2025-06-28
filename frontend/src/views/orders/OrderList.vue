<template>
  <div class="order-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>订单管理</h2>
      <p>管理用户订单信息</p>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="订单号">
          <el-input
            v-model="searchForm.order_number"
            placeholder="请输入订单号"
            clearable
          />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
          >
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="待发货" value="confirmed" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已签收" value="delivered" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已评价" value="rated" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select
            v-model="searchForm.paymentStatus"
            placeholder="请选择支付状态"
            clearable
          >
            <el-option label="未支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card">
      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="order_number" label="订单号" width="200" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="total_amount" label="订单金额" width="120">
          <template #default="scope"> ¥{{ scope.row.total_amount }} </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_name" label="收货人" width="120" />
        <el-table-column prop="delivery_phone" label="联系电话" width="140" />
        <el-table-column
          prop="delivery_address"
          label="收货地址"
          min-width="200"
        >
          <template #default="scope">
            <div class="address-text">{{ scope.row.delivery_address }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewOrder(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="
                scope.row.status === 'paid' || scope.row.status === 'confirmed'
              "
              size="small"
              type="primary"
              @click="shipOrder(scope.row.id)"
            >
              发货
            </el-button>
            <el-button
              v-if="
                scope.row.status === 'pending' || scope.row.status === 'paid'
              "
              size="small"
              type="danger"
              @click="cancelOrder(scope.row.id)"
            >
              取消
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

    <!-- 查看订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="800px">
      <div v-if="currentOrder" class="order-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>订单号：</label>
              <span>{{ currentOrder.order_number }}</span>
            </div>
            <div class="detail-item">
              <label>用户：</label>
              <span>{{ currentOrder.username }}</span>
            </div>
            <div class="detail-item">
              <label>状态：</label>
              <el-tag :type="getStatusType(currentOrder.status)">
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </div>
            <div class="detail-item">
              <label>下单时间：</label>
              <span>{{ formatDateTime(currentOrder.created_at) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>收货信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>收货人：</label>
              <span>{{ currentOrder.delivery_name }}</span>
            </div>
            <div class="detail-item">
              <label>联系电话：</label>
              <span>{{ currentOrder.delivery_phone }}</span>
            </div>
            <div class="detail-item full-width">
              <label>收货地址：</label>
              <span>{{ currentOrder.delivery_address }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>商品信息</h4>
          <el-table :data="currentOrder.items" style="width: 100%">
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="scope"> ¥{{ scope.row.price }} </template>
            </el-table-column>
            <el-table-column prop="subtotal" label="小计" width="100">
              <template #default="scope">
                ¥{{ (scope.row.price * scope.row.quantity).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="detail-section">
          <div class="total-amount">
            <strong>订单总金额：¥{{ currentOrder.total_amount }}</strong>
          </div>
        </div>

        <div v-if="currentOrder.remark" class="detail-section">
          <h4>备注信息</h4>
          <p>{{ currentOrder.remark }}</p>
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
const orders = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchForm = ref({
  order_number: "",
  username: "",
  status: "",
  paymentStatus: "",
});

const detailDialogVisible = ref(false);
const currentOrder = ref(null);

// 获取订单列表
const fetchOrders = async () => {
  try {
    loading.value = true;
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value,
    };

    const response = await request.get("/dashboard/orders", { params });

    if (response.success) {
      orders.value = response.data.orders || [];
      total.value = response.data.total || 0;
    } else {
      ElMessage.error(response.message || "获取订单列表失败");
    }
  } catch (error) {
    console.error("获取订单列表失败:", error);
    ElMessage.error("获取订单列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchOrders();
};

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    order_number: "",
    username: "",
    status: "",
    paymentStatus: "",
  };
  currentPage.value = 1;
  fetchOrders();
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchOrders();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchOrders();
};

// 查看订单详情
const viewOrder = async (order) => {
  try {
    const response = await request.get(`/dashboard/orders/${order.id}`);
    if (response.success) {
      currentOrder.value = response.data;
      detailDialogVisible.value = true;
    } else {
      ElMessage.error(response.message || "获取订单详情失败");
    }
  } catch (error) {
    console.error("获取订单详情失败:", error);
    ElMessage.error("获取订单详情失败");
  }
};

// 发货
const shipOrder = async (id) => {
  try {
    await ElMessageBox.confirm("确定要发货吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "info",
    });

    const response = await request.put(`/dashboard/orders/${id}/ship`);
    if (response.success) {
      ElMessage.success("发货成功");
      fetchOrders();
    } else {
      ElMessage.error(response.message || "发货失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("发货失败:", error);
      ElMessage.error("发货失败");
    }
  }
};

// 取消订单
const cancelOrder = async (id) => {
  try {
    await ElMessageBox.confirm("确定要取消这个订单吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const response = await request.put(`/dashboard/orders/${id}/cancel`);
    if (response.success) {
      ElMessage.success("取消订单成功");
      fetchOrders();
    } else {
      ElMessage.error(response.message || "取消订单失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("取消订单失败:", error);
      ElMessage.error("取消订单失败");
    }
  }
};

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "paid":
      return "primary";
    case "confirmed":
      return "info";
    case "shipped":
      return "";
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    case "rated":
      return "success";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case "pending":
      return "待支付";
    case "paid":
      return "已支付";
    case "confirmed":
      return "待发货";
    case "shipped":
      return "已发货";
    case "delivered":
      return "已签收";
    case "cancelled":
      return "已取消";
    case "rated":
      return "已评价";
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
  fetchOrders();
});
</script>

<style scoped>
.order-list {
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

.order-detail {
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

.total-amount {
  text-align: right;
  padding: 15px 0;
  border-top: 1px solid #ebeef5;
  font-size: 16px;
}
</style>
