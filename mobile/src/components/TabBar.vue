<template>
  <van-tabbar v-model="active" @change="onChange">
    <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
    <van-tabbar-item icon="friends-o" to="/moments">逛一逛</van-tabbar-item>
    <van-tabbar-item icon="manager-o" to="/profile">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const active = ref(0);

// 根据当前路由设置激活状态
const setActiveTab = () => {
  const path = route.path;
  if (path === "/home") {
    active.value = 0;
  } else if (path === "/moments") {
    active.value = 1;
  } else if (path === "/profile") {
    active.value = 2;
  }
};

// 监听路由变化
watch(() => route.path, setActiveTab, { immediate: true });

// 切换标签
const onChange = (index) => {
  active.value = index;
};
</script>

<style scoped>
/* 自定义样式可以在这里添加 */
</style>
