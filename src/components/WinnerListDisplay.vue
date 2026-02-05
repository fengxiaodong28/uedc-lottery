<template>
  <div class="winner-list" :class="{ 'full-screen': drawStore.isRevealing }">
    <!-- 正在揭晓模式 -->
    <template v-if="drawStore.isRevealing">
      <div class="reveal-header">
        <div class="prize-title">
          {{ drawStore.isAllRevealed ? `本轮中奖名单 - ${drawStore.currentPrizeName}` : drawStore.currentPrizeName }}（{{ drawStore.currentRoundWinners.length }}）
        </div>
        <div v-if="!drawStore.isAllRevealed" class="progress-indicator">
          <span class="progress-text">正在揭晓 {{ drawStore.displayedCount }}/{{ drawStore.currentRoundWinners.length }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="winners-container">
        <span
          v-for="(winner, index) in displayedWinners"
          :key="`${winner.id}-${index}`"
          class="winner-name"
        >
          {{ winner.name }}
        </span>
      </div>

      <div v-if="drawStore.isAllRevealed" class="next-round-hint">
        <button v-if="!drawStore.isAllCompleted" @click="handleNextRound" @touchend.prevent="handleNextRound" class="hint-text">
          <span class="hint-icon">⌨️</span>
          按 Enter 或空格键进入下一轮
        </button>
      </div>
    </template>

    <!-- 抽奖结束模式 -->
    <div v-else-if="drawStore.isAllCompleted" class="ending-screen">
      <div class="ending-content">
        <div class="ending-title">
          <div class="title-main">🎊 抽奖圆满结束 🎊</div>
          <div class="title-sub">感谢大家参与</div>
        </div>
        <div class="ending-stats">
          <div class="stat-item">
            <div class="stat-label">总轮数</div>
            <div class="stat-value">{{ drawStore.totalRounds }}</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-label">总中奖人数</div>
            <div class="stat-value">{{ totalWinners }}</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-label">未中奖人数</div>
            <div class="stat-value non-winner">{{ nonWinnerCount }}</div>
          </div>
        </div>
        <div class="ending-message">
          <div class="message-icon">🎁</div>
          <div class="message-text">恭喜所有中奖者！</div>
          <div class="message-sub">抽奖结果已自动保存</div>
        </div>
      </div>
    </div>

    <!-- 等待抽奖模式 -->
    <div v-else class="empty-hint">
      <div class="empty-content">
        <div class="empty-icons">
          <span class="icon-gift" style="animation-delay: 0s">🎁</span>
          <span class="icon-gift" style="animation-delay: 0.5s">🎉</span>
          <span class="icon-gift" style="animation-delay: 1s">🎊</span>
        </div>
        <div class="empty-text">等待抽奖...</div>
        <div class="empty-subtext">点击"开始抽奖"按钮开始</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue';
import { useDrawStore } from '@/stores/draw';
import { useWinnerStore } from '@/stores/winners';
import { useUserStore } from '@/stores/users';
import { saveStateImmediate } from '@/utils/persistence';

const drawStore = useDrawStore();
const winnerStore = useWinnerStore();
const userStore = useUserStore();

let revealInterval: number | null = null;

// 进度百分比
const progressPercent = computed(() => {
  if (drawStore.currentRoundWinners.length === 0) return 0;
  return (drawStore.displayedCount / drawStore.currentRoundWinners.length) * 100;
});

// 使用 computed 获取已显示的中奖者，确保响应式更新
const displayedWinners = computed(() => {
  return drawStore.currentRoundWinners.slice(0, drawStore.displayedCount);
});

// 总中奖人数
const totalWinners = computed(() => {
  return winnerStore.winners.length;
});

// 未中奖人数 = 总人数 - 中奖人数
const nonWinnerCount = computed(() => {
  return userStore.totalCount - winnerStore.winners.length;
});

// 监听是否开始揭晓，启动逐个显示动画
watch(() => drawStore.isRevealing, (isRevealing) => {
  console.log('👁️ watch isRevealing:', isRevealing, 'displayedCount:', drawStore.displayedCount, 'total:', drawStore.currentRoundWinners.length);
  if (isRevealing) {
    // 只在还没显示完时才启动动画
    if (drawStore.displayedCount < drawStore.currentRoundWinners.length) {
      startRevealAnimation();
    } else {
      console.log('✅ Already fully revealed, skip animation');
    }
  } else {
    stopRevealAnimation();
  }
});

function startRevealAnimation() {
  if (revealInterval) return;

  console.log('▶️ Starting reveal animation, displayedCount:', drawStore.displayedCount);

  // 每300ms显示一个中奖者（加快速度）
  revealInterval = window.setInterval(() => {
    const hasMore = drawStore.showNextWinner();
    if (!hasMore) {
      stopRevealAnimation();
    }
  }, 300);
}

function stopRevealAnimation() {
  if (revealInterval) {
    clearInterval(revealInterval);
    revealInterval = null;
  }
}

// 处理进入下一轮
function handleNextRound() {
  console.log('📍 Before goToNextRound, completedRounds:', drawStore.completedRounds);

  drawStore.goToNextRound();

  console.log('📍 After goToNextRound, completedRounds:', drawStore.completedRounds);

  // 调试：检查 userStore 的结构
  console.log('🔍 Debug userStore:', {
    hasDollarState: !!userStore.$state,
    dollarStateType: typeof userStore.$state,
    dollarStateKeys: userStore.$state ? Object.keys(userStore.$state) : null,
    usersType: typeof userStore.$state?.users,
    usersIsArray: Array.isArray(userStore.$state?.users),
    directUsersType: typeof userStore.users,
    directUsersIsArray: Array.isArray(userStore.users),
  });

  // 保存状态（isRevealing=false，表示进入等待抽奖状态）
  // 使用 $state 直接访问纯数组，避免 Pinia store 包装问题
  const usersToSave = userStore.$state.users.map(u => ({ ...u }));
  const winnersToSave = winnerStore.$state.winners.map(w => ({ ...w }));

  console.log('💾 Saving state after next round:', {
    completedRounds: drawStore.completedRounds,
    usersCount: usersToSave.length,
    winnersCount: winnersToSave.length,
    usersIsArray: Array.isArray(usersToSave),
    winnersIsArray: Array.isArray(winnersToSave),
  });

  saveStateImmediate(
    usersToSave,
    winnersToSave,
    drawStore.completedRounds,  // 使用更新后的值
    false,  // isRevealing = false，表示等待下一轮抽奖
    [],     // currentRoundWinners 为空
    ''      // currentPrizeName 为空
  );
}

onUnmounted(() => {
  stopRevealAnimation();
});
</script>

<style scoped>
.winner-list {
  flex: 1;
  min-height: 0;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.winner-list.full-screen {
  border-color: rgba(245, 166, 35, 0.3);
  box-shadow: 0 8px 30px rgba(245, 166, 35, 0.15);
}

/* ========== 结束页面样式 ========== */
.ending-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  min-height: 0;
  overflow: hidden;
}

.ending-content {
  text-align: center;
  animation: endingFadeIn 0.8s ease-out;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.8rem;
}

@keyframes endingFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.ending-title {
  margin-bottom: 0;
}

.title-main {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700 0%, #f5a623 30%, #f76b1c 70%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.3rem;
  animation: titleGlow 2s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  from {
    filter: drop-shadow(0 0 10px rgba(245, 166, 35, 0.5));
  }
  to {
    filter: drop-shadow(0 0 20px rgba(245, 166, 35, 0.8));
  }
}

.title-sub {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.ending-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: nowrap;
}

.stat-item {
  text-align: center;
  min-width: 60px;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.2rem;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffd700 0%, #f5a623 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-value.non-winner {
  background: linear-gradient(135deg, #999999 0%, #666666 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.15);
}

.ending-message {
  animation: messageFloat 3s ease-in-out infinite;
}

@keyframes messageFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.message-icon {
  font-size: 2.5rem;
  margin-bottom: 0.3rem;
}

.message-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.2rem;
}

.message-sub {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== 等待抽奖页面 ========== */
.empty-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
}

.empty-icons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.icon-gift {
  font-size: 2rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-text {
  font-size: 1.8rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-subtext {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 400;
}

/* ========== 揭晓页面 ========== */
.reveal-header {
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.prize-title {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffd700 0%, #f5a623 50%, #f76b1c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.8rem;
}

.progress-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-text {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f5a623 0%, #f76b1c 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.winners-container {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  gap: 0.8rem 1.5rem;
  padding: 1rem 0;
  min-height: 0;
  overflow-y: auto;
}

/* 自定义滚动条 */
.winners-container::-webkit-scrollbar {
  width: 6px;
}

.winners-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.winners-container::-webkit-scrollbar-thumb {
  background: rgba(245, 166, 35, 0.3);
  border-radius: 3px;
}

.winners-container::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 166, 35, 0.5);
}

.winner-name {
  font-size: 1.6rem;
  font-weight: 600;
  color: #fff;
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, rgba(245, 166, 35, 0.8) 0%, rgba(247, 107, 28, 0.8) 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: winnerAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: default;
}

.winner-name:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

@keyframes winnerAppear {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ========== 下一轮按钮 ========== */
.next-round-hint {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  transition: transform 0.3s ease;
}

.next-round-hint:hover {
  transform: translateX(-50%) translateY(-2px);
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, rgba(245, 166, 35, 0.95) 0%, rgba(247, 107, 28, 0.95) 100%);
  color: #1a1a2e;
  border-radius: 50px;
  font-size: 1.3rem;
  font-weight: 600;
  box-shadow: 0 6px 25px rgba(245, 166, 35, 0.4);
  animation: pulse 2s ease-in-out infinite;
  backdrop-filter: blur(10px);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hint-text:hover {
  box-shadow: 0 8px 30px rgba(245, 166, 35, 0.6);
}

.hint-text:active {
  box-shadow: 0 4px 20px rgba(245, 166, 35, 0.5);
}

.hint-icon {
  font-size: 1.1rem;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 6px 25px rgba(245, 166, 35, 0.4);
  }
  50% {
    box-shadow: 0 8px 30px rgba(245, 166, 35, 0.5);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .ending-screen {
    padding: 0.5rem;
  }

  .ending-title .title-main {
    font-size: 1.4rem;
  }

  .title-sub {
    font-size: 0.8rem;
  }

  .ending-stats {
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
  }

  .stat-divider {
    height: 25px;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.1rem;
  }

  .message-icon {
    font-size: 2rem;
  }

  .message-text {
    font-size: 1rem;
  }

  .message-sub {
    font-size: 0.8rem;
  }

  .prize-title {
    font-size: 1.1rem;
  }

  .winner-name {
    font-size: 1.3rem;
    padding: 0.4rem 1rem;
  }

  .hint-text {
    padding: 0.8rem 1.8rem;
    font-size: 1.1rem;
  }

  .empty-text {
    font-size: 1.4rem;
  }

  .empty-subtext {
    font-size: 1rem;
  }

  .progress-text {
    font-size: 1rem;
  }

  .progress-bar {
    width: 150px;
  }
}
</style>
