<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();

onMounted(() => {
  // 应用启动时检查用户登录状态
  authStore.checkAuth();
});
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
