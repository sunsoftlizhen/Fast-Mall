<template>
  <div class="my-moments">
    <!-- 顶部导航 -->
    <van-nav-bar
      title="我的动态"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
      right-text="发布"
      @click-right="goToPublish"
    />

    <!-- 动态列表 -->
    <div class="moments-container">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          :loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div v-for="moment in moments" :key="moment.id" class="moment-item">
            <!-- 用户信息 -->
            <div class="moment-header">
              <van-image
                round
                width="40"
                height="40"
                :src="moment.avatar || '/default-avatar.png'"
                class="avatar"
              />
              <div class="user-info">
                <div class="username">{{ moment.username }}</div>
                <div class="publish-time">
                  {{ formatTime(moment.created_at) }}
                </div>
              </div>
              <van-button
                v-if="moment.user_id === userInfo?.id"
                size="mini"
                type="danger"
                plain
                @click="deleteMoment(moment.id)"
              >
                删除
              </van-button>
            </div>

            <!-- 动态内容 -->
            <div class="moment-content">
              <p class="content-text">{{ moment.content }}</p>

              <!-- 图片列表 -->
              <div
                v-if="moment.images && moment.images.length > 0"
                class="image-grid"
              >
                <van-image
                  v-for="(image, index) in moment.images"
                  :key="index"
                  :src="image"
                  fit="cover"
                  class="moment-image"
                  @click="previewImage(moment.images, index)"
                />
              </div>
            </div>

            <!-- 动态操作 -->
            <div class="moment-actions">
              <div class="action-item" @click="toggleLike(moment)">
                <van-icon
                  :name="moment.isLiked ? 'like' : 'like-o'"
                  :color="moment.isLiked ? '#ff6b6b' : '#969799'"
                />
                <span class="action-text">{{ moment.likes_count || 0 }}</span>
              </div>
              <div class="action-item" @click="showComments(moment)">
                <van-icon name="chat-o" />
                <span class="action-text">{{
                  moment.comments_count || 0
                }}</span>
              </div>
            </div>

            <!-- 评论列表 -->
            <div
              v-if="moment.comments && moment.comments.length > 0"
              class="comments-section"
            >
              <div
                v-for="comment in moment.comments.slice(0, 3)"
                :key="comment.id"
                class="comment-item"
              >
                <span class="comment-user">{{ comment.username }}：</span>
                <span class="comment-content">{{ comment.content }}</span>
              </div>
              <div
                v-if="moment.comments.length > 3"
                class="more-comments"
                @click="showComments(moment)"
              >
                查看全部{{ moment.comments.length }}条评论
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 无数据状态 -->
    <van-empty
      v-if="!loading && moments.length === 0"
      description="还没有发布过动态哦"
    />

    <!-- 评论弹出层 -->
    <van-popup
      v-model="showCommentPopup"
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="comment-popup">
        <div class="popup-header">
          <span>评论</span>
          <van-icon name="cross" @click="showCommentPopup = false" />
        </div>
        <div class="comment-list">
          <div
            v-for="comment in selectedMoment?.comments"
            :key="comment.id"
            class="comment-detail"
          >
            <div class="comment-header">
              <span class="comment-username">{{ comment.username }}</span>
              <span class="comment-time">{{
                formatTime(comment.created_at)
              }}</span>
            </div>
            <div class="comment-text">{{ comment.content }}</div>
          </div>
        </div>
        <div class="comment-input">
          <van-field
            v-model="newComment"
            placeholder="写评论..."
            :border="false"
          >
            <template #button>
              <van-button size="small" type="primary" @click="addComment"
                >发送</van-button
              >
            </template>
          </van-field>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { showImagePreview, showToast, showConfirmDialog } from "vant";
import api from "../utils/api";

const router = useRouter();
const authStore = useAuthStore();

// 响应式数据
const moments = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const showCommentPopup = ref(false);
const selectedMoment = ref(null);
const newComment = ref("");
const page = ref(1);
const pageSize = 10;

// 计算属性
const userInfo = computed(() => authStore.userInfo);

// 获取我的动态列表
const getMoments = async (pageNum = 1, isRefresh = false) => {
  try {
    const response = await api.get("/mobile/my-moments", {
      params: {
        page: pageNum,
        limit: pageSize,
      },
    });

    if (response.success) {
      const newMoments = response.data.items || [];

      if (isRefresh) {
        moments.value = newMoments;
      } else {
        moments.value.push(...newMoments);
      }

      // 检查是否还有更多数据
      finished.value = newMoments.length < pageSize;

      // 获取每条新动态的点赞状态和评论（只处理新数据，避免重复处理）
      for (let moment of newMoments) {
        await getMomentDetails(moment);
      }
    }
  } catch (error) {
    console.error("获取动态失败:", error);
    showToast("获取动态失败");
  }
};

// 获取动态详情（点赞状态和评论）
const getMomentDetails = async (moment) => {
  try {
    // 获取点赞状态
    const likeResponse = await api.get(`/moments/${moment.id}/like-status`);
    if (likeResponse.data.success) {
      moment.isLiked = likeResponse.data.data.isLiked;
      moment.likes_count = likeResponse.data.data.likes_count;
    }

    // 获取最新评论
    const commentResponse = await api.get(`/moments/${moment.id}/comments`, {
      params: { limit: 3 },
    });
    if (commentResponse.data.success) {
      moment.comments = commentResponse.data.data.items || [];
      moment.comments_count = commentResponse.data.data.total || 0;
    }
  } catch (error) {
    console.error("获取动态详情失败:", error);
  }
};

// 上拉加载
const onLoad = async () => {
  if (!finished.value) {
    page.value++;
    await getMoments(page.value);
  }
  loading.value = false;
};

// 下拉刷新
const onRefresh = () => {
  page.value = 1;
  finished.value = false;
  getMoments(1, true).finally(() => {
    refreshing.value = false;
  });
};

// 跳转到发布页面
const goToPublish = () => {
  router.push("/publish");
};

// 删除动态
const deleteMoment = async (momentId) => {
  try {
    await showConfirmDialog({
      title: "确认删除",
      message: "确定要删除这条动态吗？",
    });

    const response = await api.delete(`/api/moments/${momentId}`);
    if (response.data.success) {
      showToast("删除成功");
      // 从列表中移除
      moments.value = moments.value.filter((m) => m.id !== momentId);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除动态失败:", error);
      showToast("删除失败");
    }
  }
};

// 切换点赞状态
const toggleLike = async (moment) => {
  try {
    const response = await api.post(`/api/moments/${moment.id}/like`);
    if (response.data.success) {
      moment.isLiked = !moment.isLiked;
      moment.likes_count = response.data.data.likes_count;
    }
  } catch (error) {
    console.error("点赞失败:", error);
    showToast("操作失败");
  }
};

// 显示评论弹窗
const showComments = async (moment) => {
  selectedMoment.value = moment;

  // 获取完整评论列表
  try {
    const response = await api.get(`/api/moments/${moment.id}/comments`);
    if (response.data.success) {
      selectedMoment.value.comments = response.data.data.items || [];
    }
  } catch (error) {
    console.error("获取评论失败:", error);
  }

  showCommentPopup.value = true;
};

// 添加评论
const addComment = async () => {
  if (!newComment.value.trim()) {
    showToast("请输入评论内容");
    return;
  }

  try {
    const response = await api.post(
      `/api/moments/${selectedMoment.value.id}/comments`,
      {
        content: newComment.value.trim(),
      }
    );

    if (response.data.success) {
      newComment.value = "";
      showToast("评论成功");

      // 刷新评论列表
      const commentResponse = await api.get(
        `/api/moments/${selectedMoment.value.id}/comments`
      );
      if (commentResponse.data.success) {
        selectedMoment.value.comments = commentResponse.data.data.items || [];
        selectedMoment.value.comments_count =
          commentResponse.data.data.total || 0;
      }
    }
  } catch (error) {
    console.error("评论失败:", error);
    showToast("评论失败");
  }
};

// 预览图片
const previewImage = (images, index) => {
  showImagePreview({
    images: images,
    startPosition: index,
  });
};

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    return "刚刚";
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else if (diff < 2592000000) {
    return `${Math.floor(diff / 86400000)}天前`;
  } else {
    return date.toLocaleDateString();
  }
};

// 页面加载时获取数据
onMounted(() => {
  getMoments(1, true);
});
</script>

<style scoped>
.my-moments {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.moments-container {
  padding-bottom: 50px;
}

.moment-item {
  background: white;
  margin: 10px;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.moment-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  margin-right: 12px;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 4px;
}

.publish-time {
  font-size: 12px;
  color: #969799;
}

.moment-content {
  margin-bottom: 12px;
}

.content-text {
  font-size: 14px;
  line-height: 1.5;
  color: #323233;
  margin-bottom: 8px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.moment-image {
  width: 100%;
  height: 80px;
  border-radius: 4px;
}

.moment-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
  border-top: 1px solid #ebedf0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.action-text {
  font-size: 12px;
  color: #969799;
}

.comments-section {
  background-color: #f7f8fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
}

.comment-item {
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.comment-user {
  color: #576b95;
  font-weight: 500;
}

.comment-content {
  color: #323233;
}

.more-comments {
  font-size: 12px;
  color: #576b95;
  cursor: pointer;
  margin-top: 4px;
}

.comment-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebedf0;
  font-weight: bold;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;
}

.comment-detail {
  margin-bottom: 15px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.comment-username {
  font-weight: 500;
  color: #576b95;
}

.comment-time {
  font-size: 12px;
  color: #969799;
}

.comment-text {
  font-size: 14px;
  line-height: 1.4;
  color: #323233;
}

.comment-input {
  padding: 10px 20px;
  border-top: 1px solid #ebedf0;
  background: white;
}

/* 导航栏样式 */
:deep(.van-nav-bar) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  --van-nav-bar-text-color: white;
  --van-nav-bar-icon-color: white;
  --van-nav-bar-title-text-color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}
</style>
