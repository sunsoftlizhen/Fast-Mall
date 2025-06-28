<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalUsers }}</div>
              <div class="stats-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon active-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.activeUsers }}</div>
              <div class="stats-label">活跃用户</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon role-icon">
              <el-icon><Lock /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalRoles }}</div>
              <div class="stats-label">角色数量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon new-icon">
              <el-icon><Plus /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.todayNewUsers }}</div>
              <div class="stats-label">今日新增</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon order-icon">
              <el-icon><ShoppingBag /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalOrders }}</div>
              <div class="stats-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon pending-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.pendingOrders }}</div>
              <div class="stats-label">待处理订单</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon moment-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.totalMoments }}</div>
              <div class="stats-label">朋友圈动态</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon revenue-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">¥{{ stats.totalRevenue }}</div>
              <div class="stats-label">总营收</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户状态分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              class="chart"
              :option="userStatusChartOption"
              v-if="userStatusStats.length > 0"
            />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>角色用户分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              class="chart"
              :option="roleUserChartOption"
              v-if="roleUserStats.length > 0"
            />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 注册趋势图表 -->
    <el-row class="trend-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近7天用户注册趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              class="chart"
              :option="registrationTrendOption"
              v-if="registrationTrend.length > 0"
            />
            <div v-else class="no-data">暂无数据</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近登录用户 -->
    <el-row class="recent-users-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近登录用户</span>
            </div>
          </template>
          <el-table :data="recentUsers" style="width: 100%">
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="role_name" label="角色" />
            <el-table-column prop="last_login_at" label="最后登录时间">
              <template #default="scope">
                {{ formatDateTime(scope.row.last_login_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart, LineChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import request from "@/utils/request";
import { ElMessage } from "element-plus";

use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

// 数据
const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalRoles: 0,
  todayNewUsers: 0,
  totalOrders: 0,
  pendingOrders: 0,
  totalMoments: 0,
  totalRevenue: 0,
});

const userStatusStats = ref([]);
const roleUserStats = ref([]);
const registrationTrend = ref([]);
const recentUsers = ref([]);

// 用户状态分布图表配置
const userStatusChartOption = computed(() => ({
  tooltip: {
    trigger: "item",
  },
  legend: {
    orient: "vertical",
    left: "left",
  },
  series: [
    {
      name: "用户状态",
      type: "pie",
      radius: "50%",
      data: userStatusStats.value.map((item) => ({
        value: item.count,
        name: item.status,
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    },
  ],
}));

// 角色用户分布图表配置
const roleUserChartOption = computed(() => ({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: [
    {
      type: "category",
      data: roleUserStats.value.map((item) => item.role_name),
      axisTick: {
        alignWithLabel: true,
      },
    },
  ],
  yAxis: [
    {
      type: "value",
    },
  ],
  series: [
    {
      name: "用户数量",
      type: "bar",
      barWidth: "60%",
      data: roleUserStats.value.map((item) => item.user_count),
    },
  ],
}));

// 注册趋势图表配置
const registrationTrendOption = computed(() => ({
  tooltip: {
    trigger: "axis",
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: registrationTrend.value.map((item) => item.date),
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "注册用户数",
      type: "line",
      stack: "Total",
      data: registrationTrend.value.map((item) => item.count),
    },
  ],
}));

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleString("zh-CN");
};

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await request.get("/dashboard/stats");
    const data = response.data;

    stats.value = data.stats;
    userStatusStats.value = data.userStatusStats;
    roleUserStats.value = data.roleUserStats;
    registrationTrend.value = data.registrationTrend;
    recentUsers.value = data.recentUsers;
  } catch (error) {
    ElMessage.error("获取统计数据失败");
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  color: white;
  font-size: 24px;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.active-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.role-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.new-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.order-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.pending-icon {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.moment-icon {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.revenue-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  line-height: 1;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.charts-row {
  margin-bottom: 20px;
}

.trend-row {
  margin-bottom: 20px;
}

.recent-users-row {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 600;
  color: #333;
}

.chart-container {
  height: 300px;
  position: relative;
}

.chart {
  height: 100%;
  width: 100%;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 14px;
}

:deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
