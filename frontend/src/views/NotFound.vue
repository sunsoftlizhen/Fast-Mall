<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-message">
        <h2>页面不存在</h2>
        <p>抱歉，您访问的页面不存在或已被移除。</p>
      </div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
    </div>

    <!-- 装饰性图标 -->
    <div class="decoration">
      <el-icon class="decoration-icon">
        <QuestionFilled />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const goHome = () => {
  router.push("/dashboard");
};

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push("/dashboard");
  }
};
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.not-found-content {
  text-align: center;
  color: white;
  z-index: 2;
  position: relative;
}

.error-code {
  font-size: 150px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-message h2 {
  font-size: 36px;
  margin-bottom: 10px;
  font-weight: 600;
}

.error-message p {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.error-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-actions .el-button {
  padding: 12px 30px;
  font-size: 16px;
  border-radius: 25px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.error-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.decoration {
  position: absolute;
  top: 50%;
  right: 10%;
  transform: translateY(-50%);
  opacity: 0.1;
  z-index: 1;
}

.decoration-icon {
  font-size: 300px;
  color: white;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(-10px);
  }
  50% {
    transform: translateY(10px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-code {
    font-size: 100px;
  }

  .error-message h2 {
    font-size: 28px;
  }

  .error-message p {
    font-size: 16px;
    padding: 0 20px;
  }

  .decoration {
    right: 5%;
  }

  .decoration-icon {
    font-size: 200px;
  }

  .error-actions {
    padding: 0 20px;
  }

  .error-actions .el-button {
    flex: 1;
    min-width: 120px;
  }
}

@media (max-width: 480px) {
  .error-code {
    font-size: 80px;
  }

  .error-message h2 {
    font-size: 24px;
  }

  .error-message p {
    font-size: 14px;
  }

  .decoration {
    display: none;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-actions .el-button {
    width: 200px;
  }
}
</style>
