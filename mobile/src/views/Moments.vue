<template>
  <div class="moments">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="逛一逛" fixed placeholder class="nav-bar">
      <template #right>
        <div class="nav-actions">
          <van-icon
            name="plus"
            size="20"
            @click="goToPublish"
            class="publish-btn"
          />
        </div>
      </template>
    </van-nav-bar>

    <!-- 动态列表 -->
    <div class="moments-container">
      <van-pull-refresh
        v-model="refreshing"
        @refresh="onRefresh"
        class="pull-refresh"
      >
        <van-list
          :loading="loading"
          :finished="finished"
          finished-text="✨ 没有更多精彩内容了 ✨"
          @load="onLoad"
          class="moments-list"
        >
          <!-- 空状态 -->
          <div v-if="!loading && moments.length === 0" class="empty-state">
            <div class="empty-icon">🌟</div>
            <div class="empty-title">还没有动态哦</div>
            <div class="empty-desc">快来分享你的生活吧！</div>
            <van-button
              type="primary"
              round
              @click="goToPublish"
              class="empty-action"
            >
              发布动态
            </van-button>
          </div>

          <!-- 动态卡片 -->
          <div
            v-for="(moment, index) in moments"
            :key="moment.id"
            class="moment-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <!-- 用户信息头部 -->
            <div class="moment-header">
              <div class="user-avatar-section">
                <van-image
                  round
                  width="50"
                  height="50"
                  :src="moment.avatar || '/default-avatar.png'"
                  class="user-avatar"
                  loading-icon="photo"
                  error-icon="photo-fail"
                />
                <div class="avatar-ring"></div>
              </div>

              <div class="user-info">
                <div class="username">{{ moment.username }}</div>
                <div class="moment-meta">
                  <span class="time">{{ formatTime(moment.created_at) }}</span>
                  <span v-if="moment.location" class="location">
                    <van-icon name="location-o" size="12" />
                    {{ moment.location }}
                  </span>
                </div>
              </div>

              <!-- 动态类型标识 -->
              <div v-if="moment.type === 'product_review'" class="moment-type">
                <van-tag type="primary" size="small" round>
                  <van-icon name="star-o" size="10" />
                  商品评价
                </van-tag>
              </div>
            </div>

            <!-- 动态内容 -->
            <div class="moment-content">
              <div class="content-text" v-if="moment.content">
                {{ moment.content }}
              </div>

              <!-- 商品信息卡片 -->
              <div
                v-if="moment.type === 'product_review' && moment.product_name"
                class="product-card"
              >
                <div class="product-info">
                  <van-icon name="shop-o" class="product-icon" />
                  <span class="product-name">{{ moment.product_name }}</span>
                </div>
              </div>

              <!-- 图片网格 -->
              <div
                v-if="moment.images && moment.images.length > 0"
                class="images-grid"
                :class="`grid-${getGridClass(moment.images.length)}`"
              >
                <div
                  v-for="(image, index) in moment.images.slice(0, 9)"
                  :key="index"
                  class="image-item"
                  @click="previewImage(moment.images, index)"
                >
                  <van-image
                    :src="image"
                    fit="cover"
                    class="moment-image"
                    loading-icon="photo"
                    error-icon="photo-fail"
                  />
                  <!-- 更多图片提示 -->
                  <div
                    v-if="index === 8 && moment.images.length > 9"
                    class="more-images"
                  >
                    +{{ moment.images.length - 9 }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 互动区域 -->
            <div class="interaction-section">
              <!-- 点赞和评论按钮 -->
              <div class="action-bar">
                <div class="action-group">
                  <button
                    class="action-btn like-btn"
                    :class="{ liked: isLiked(moment) }"
                    @click="toggleLike(moment)"
                  >
                    <van-icon
                      :name="isLiked(moment) ? 'like' : 'like-o'"
                      class="action-icon"
                    />
                    <span class="action-text">{{
                      moment.likes_count || "点赞"
                    }}</span>
                  </button>

                  <button
                    class="action-btn comment-btn"
                    @click="showCommentInput(moment)"
                  >
                    <van-icon name="chat-o" class="action-icon" />
                    <span class="action-text">{{
                      moment.comments_count || "评论"
                    }}</span>
                  </button>

                  <button
                    class="action-btn share-btn"
                    @click="shareMoment(moment)"
                  >
                    <van-icon name="share-o" class="action-icon" />
                    <span class="action-text">分享</span>
                  </button>
                </div>
              </div>

              <!-- 点赞用户列表 -->
              <div
                v-if="moment.likes && moment.likes.length > 0"
                class="likes-section"
              >
                <div class="likes-content">
                  <van-icon name="like" class="likes-icon" />
                  <span class="likes-text">
                    {{ moment.likes.map((like) => like.username).join("、") }}
                    {{ moment.likes.length > 1 ? "等人" : "" }}觉得很赞
                  </span>
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
                  <span class="comment-user">{{ comment.username }}</span>
                  <span class="comment-separator">:</span>
                  <span class="comment-content">{{ comment.content }}</span>
                </div>

                <!-- 查看更多评论 -->
                <div
                  v-if="moment.comments.length > 3"
                  class="more-comments"
                  @click="viewAllComments(moment)"
                >
                  查看全部 {{ moment.comments.length }} 条评论
                  <van-icon name="arrow-down" size="12" />
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 底部导航栏 -->
    <TabBar />

    <!-- 悬浮发布按钮 -->
    <div class="floating-publish" @click="goToPublish">
      <van-icon name="plus" size="24" />
    </div>

    <!-- 评论输入弹窗 -->
    <van-action-sheet
      :show="showComment"
      @update:show="(val) => (showComment = val)"
      title="发表评论"
      class="comment-sheet"
    >
      <div class="comment-input-container">
        <div class="input-section">
          <van-field
            v-model="commentText"
            type="textarea"
            placeholder="说点什么..."
            rows="4"
            maxlength="500"
            show-word-limit
            class="comment-input"
          />
        </div>
        <div class="input-actions">
          <van-button
            type="primary"
            round
            block
            @click="submitComment"
            :disabled="!commentText.trim()"
            :loading="submittingComment"
            class="submit-btn"
          >
            发送评论
          </van-button>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showImagePreview, showSuccessToast } from "vant";
import { getMoments, toggleLikeMoment, commentMoment } from "../utils/api";
import { useAuthStore } from "../stores/auth";
import TabBar from "../components/TabBar.vue";
import dayjs from "dayjs";

const router = useRouter();
const authStore = useAuthStore();

// 数据
const moments = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const currentPage = ref(1);
const pageSize = 10;

// 评论相关
const showComment = ref(false);
const commentText = ref("");
const currentMoment = ref(null);
const submittingComment = ref(false);

// 获取图片网格布局类名
const getGridClass = (count) => {
  if (count === 1) return "single";
  if (count === 2) return "double";
  if (count === 4) return "quad";
  return "multiple";
};

// 下拉刷新
const onRefresh = async () => {
  currentPage.value = 1;
  finished.value = false;
  await loadMoments(1);
  refreshing.value = false;
  showSuccessToast("刷新成功");
};

// 加载朋友圈列表
const loadMoments = async (page = 1) => {
  try {
    loading.value = true;
    const response = await getMoments({
      page,
      pageSize,
    });

    // 后端返回格式: { success: true, data: { moments: [...] } }
    const newMoments = response.data?.moments || [];

    if (page === 1) {
      moments.value = newMoments;
    } else {
      moments.value.push(...newMoments);
    }

    if (newMoments.length < pageSize) {
      finished.value = true;
    }
  } catch (error) {
    console.error("获取朋友圈失败:", error);
    showToast("获取动态失败");
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

// 下拉加载更多
const onLoad = () => {
  if (!finished.value && !loading.value) {
    currentPage.value++;
    loadMoments(currentPage.value);
  }
};

// 格式化时间
const formatTime = (time) => {
  const now = dayjs();
  const momentTime = dayjs(time);
  const diffMinutes = now.diff(momentTime, "minute");

  if (diffMinutes < 1) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = now.diff(momentTime, "hour");
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = now.diff(momentTime, "day");
  if (diffDays < 7) return `${diffDays}天前`;

  return momentTime.format("MM-DD HH:mm");
};

// 预览图片
const previewImage = (images, index) => {
  showImagePreview({
    images,
    startPosition: index,
    closeable: true,
  });
};

// 检查是否已点赞
const isLiked = (moment) => {
  if (!authStore.user || !moment.likes) return false;
  return moment.likes.some((like) => like.user_id === authStore.user.id);
};

// 切换点赞
const toggleLike = async (moment) => {
  if (!authStore.isLoggedIn) {
    showToast("请先登录");
    router.push("/login");
    return;
  }

  try {
    const response = await toggleLikeMoment(moment.id);
    if (response.success) {
      const liked = response.data.liked;
      if (liked) {
        moment.likes_count = (moment.likes_count || 0) + 1;
        if (!moment.likes) moment.likes = [];
        moment.likes.push({
          user_id: authStore.user.id,
          username: authStore.user.username,
        });
        showSuccessToast("已点赞");
      } else {
        moment.likes_count = Math.max((moment.likes_count || 0) - 1, 0);
        if (moment.likes) {
          moment.likes = moment.likes.filter(
            (like) => like.user_id !== authStore.user.id
          );
        }
      }
    }
  } catch (error) {
    showToast("操作失败");
  }
};

// 显示评论输入框
const showCommentInput = (moment) => {
  if (!authStore.isLoggedIn) {
    showToast("请先登录");
    router.push("/login");
    return;
  }

  currentMoment.value = moment;
  commentText.value = "";
  showComment.value = true;
};

// 提交评论
const submitComment = async () => {
  if (!commentText.value.trim()) return;

  submittingComment.value = true;
  try {
    const response = await commentMoment(currentMoment.value.id, {
      content: commentText.value.trim(),
    });

    if (response.success) {
      showSuccessToast("评论成功");
      showComment.value = false;
      commentText.value = "";

      // 更新评论数
      currentMoment.value.comments_count =
        (currentMoment.value.comments_count || 0) + 1;

      // 重新加载当前页面的数据
      currentPage.value = 1;
      finished.value = false;
      loadMoments(1);
    }
  } catch (error) {
    showToast("评论失败");
  } finally {
    submittingComment.value = false;
  }
};

// 分享动态
const shareMoment = (moment) => {
  showToast("分享功能开发中");
};

// 查看所有评论
const viewAllComments = (moment) => {
  showToast("查看全部评论功能开发中");
};

// 跳转到发布页面
const goToPublish = () => {
  if (!authStore.isLoggedIn) {
    showToast("请先登录");
    router.push("/login");
    return;
  }

  router.push("/publish");
};

// 页面加载时获取数据
onMounted(() => {
  loadMoments();
});
</script>

<style scoped>
.moments {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  padding-bottom: 80px;
}

/* 导航栏样式 */
.nav-bar {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
  --van-nav-bar-text-color: white !important;
  --van-nav-bar-icon-color: white !important;
  --van-nav-bar-title-text-color: white !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.nav-actions {
  display: flex;
  align-items: center;
}

.publish-btn {
  padding: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.publish-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* 容器样式 */
.moments-container {
  padding: 0;
}

.pull-refresh {
  min-height: calc(100vh - 140px);
}

.moments-list {
  padding: 16px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #646566;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  margin-bottom: 24px;
  opacity: 0.7;
}

.empty-action {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  font-weight: 600;
}

/* 动态卡片 */
.moment-card {
  background: white;
  border-radius: 20px;
  margin-bottom: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f1f5;
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.moment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
}

/* 用户信息头部 */
.moment-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-avatar-section {
  position: relative;
  margin-right: 12px;
}

.user-avatar {
  border: 2px solid #f0f1f5;
  transition: all 0.3s ease;
}

.avatar-ring {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.moment-card:hover .avatar-ring {
  opacity: 0.3;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.username {
  font-size: 16px;
  font-weight: 700;
  color: #323233;
  margin-bottom: 4px;
}

.moment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}

.location {
  display: flex;
  align-items: center;
  gap: 2px;
}

.moment-type {
  flex-shrink: 0;
}

/* 内容区域 */
.moment-content {
  margin-bottom: 16px;
}

.content-text {
  font-size: 15px;
  line-height: 1.6;
  color: #323233;
  margin-bottom: 12px;
  word-break: break-word;
}

/* 商品卡片 */
.product-card {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-left: 4px solid #667eea;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-icon {
  color: #667eea;
  font-size: 16px;
}

.product-name {
  font-size: 14px;
  color: #646566;
  font-weight: 500;
}

/* 图片网格 */
.images-grid {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.grid-single {
  grid-template-columns: 1fr;
  max-width: 280px;
}

.grid-double {
  grid-template-columns: repeat(2, 1fr);
}

.grid-quad {
  grid-template-columns: repeat(2, 1fr);
}

.grid-multiple {
  grid-template-columns: repeat(3, 1fr);
}

.image-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.image-item:hover {
  transform: scale(1.02);
}

.moment-image {
  width: 100%;
  height: 120px;
  border-radius: 12px;
}

.grid-single .moment-image {
  height: 200px;
}

.more-images {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

/* 互动区域 */
.interaction-section {
  border-top: 1px solid #f0f1f5;
  padding-top: 12px;
}

.action-bar {
  margin-bottom: 12px;
}

.action-group {
  display: flex;
  justify-content: space-around;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 13px;
}

.action-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.like-btn.liked {
  color: #ff4757;
}

.like-btn.liked .action-icon {
  animation: heartBeat 0.6s ease;
}

@keyframes heartBeat {
  0%,
  50%,
  100% {
    transform: scale(1);
  }
  25%,
  75% {
    transform: scale(1.2);
  }
}

.action-icon {
  font-size: 16px;
}

.action-text {
  font-weight: 500;
  color: #646566;
}

.like-btn.liked .action-text {
  color: #ff4757;
}

/* 点赞区域 */
.likes-section {
  background: linear-gradient(135deg, #fff5f5, #ffeaa7);
  border-radius: 12px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.likes-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.likes-icon {
  color: #ff4757;
  font-size: 14px;
}

.likes-text {
  font-size: 13px;
  color: #646566;
}

/* 评论区域 */
.comments-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
}

.comment-item {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.comment-item:last-child {
  margin-bottom: 0;
}

.comment-user {
  color: #667eea;
  font-weight: 600;
}

.comment-separator {
  margin: 0 4px;
  color: #969799;
}

.comment-content {
  color: #323233;
}

.more-comments {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  margin-top: 8px;
  padding: 4px 0;
  transition: color 0.3s ease;
}

.more-comments:hover {
  color: #764ba2;
}

/* 悬浮发布按钮 */
.floating-publish {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
}

.floating-publish:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.floating-publish:active {
  transform: scale(0.95);
}

/* 评论弹窗 */
.comment-sheet {
  border-radius: 20px 20px 0 0;
}

.comment-input-container {
  padding: 24px;
}

.input-section {
  margin-bottom: 20px;
}

.comment-input {
  border-radius: 12px;
  background: #f8f9fa;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  font-weight: 600;
  height: 48px;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .moments-list {
    padding: 12px;
  }

  .moment-card {
    padding: 16px;
    margin-bottom: 12px;
  }

  .images-grid.grid-multiple {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .moments {
    background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .moment-card {
    background: #333;
    border-color: #444;
    color: #fff;
  }

  .username {
    color: #fff;
  }

  .content-text {
    color: #e0e0e0;
  }
}
</style>
