<template>
  <div class="app">
    <div class="bg-gradient"></div>
    <header class="app-header">
      <h1 class="title">UEDC 年会抽奖</h1>
      <div class="title-decoration"></div>
    </header>

    <main class="app-main">
      <!-- 控制区域：只在非抽奖非揭晓状态下显示 -->
      <template v-if="drawStore.shouldShowControls">
        <div class="controls-section">
          <SimplePrizeCard @reset="handleReset" />
          <SimpleDrawButton @draw-complete="handleDrawComplete" />
        </div>
      </template>

      <!-- 中奖者展示区域 -->
      <WinnerListDisplay />
    </main>

    <!-- 庆祝彩带效果 -->
    <transition name="celebration-fade">
      <div v-if="isCelebrating" class="celebration-overlay">
        <div v-for="i in 50" :key="i" class="confetti" :style="getConfettiStyle(i)">
          <span class="confetti-emoji">{{ getConfettiEmoji(i) }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useDrawStore } from './stores/draw';
import { useUserStore } from './stores/users';
import { usePrizeStore } from './stores/prizes';
import { useWinnerStore } from './stores/winners';
import { clearState as clearPersistedState, loadState } from './utils/persistence';
import { restoreRemainingFromWinners } from './config/drawOrder';
import SimplePrizeCard from './components/SimplePrizeCard.vue';
import SimpleDrawButton from './components/SimpleDrawButton.vue';
import WinnerListDisplay from './components/WinnerListDisplay.vue';

const drawStore = useDrawStore();
const userStore = useUserStore();
const prizeStore = usePrizeStore();
const winnerStore = useWinnerStore();

const isCelebrating = ref(false);
let celebrationTimeout: number | null = null;

// 🔴 立即执行恢复状态（在组件渲染之前）
const persistedState = loadState();
if (persistedState) {
  console.log('🔄 恢复上次的抽奖状态:', {
    completedRounds: persistedState.completedRounds,
    isRevealing: persistedState.isRevealing,
    currentPrizeName: persistedState.currentPrizeName,
    winnersCount: persistedState.winners.length,
    usersCount: persistedState.users.length,
  });

  // 恢复用户状态（包括中奖标记）
  userStore.loadFromState(persistedState.users);

  // 恢复中奖者记录
  winnerStore.loadFromState(persistedState.winners);

  // 恢复奖品剩余数量（根据中奖记录计算）
  restoreRemainingFromWinners(persistedState.winners);

  // 恢复 drawStore 状态（包括 completedRounds 和 isRevealing 等）
  drawStore.restoreState({
    completedRounds: persistedState.completedRounds,
    isRevealing: persistedState.isRevealing,
    currentRoundWinners: persistedState.currentRoundWinners,
    currentPrizeName: persistedState.currentPrizeName,
  });
}

// 初始化：从 localStorage 恢复状态
onMounted(() => {
  console.log('🔍 Component mounted, current state:', {
    completedRounds: drawStore.completedRounds,
    isRevealing: drawStore.isRevealing,
    currentPrizeName: drawStore.currentPrizeName,
    nextRound: drawStore.nextRound?.name,
  });

  // 注册键盘事件
  window.addEventListener('keydown', handleKeyPress);
});

function handleDrawComplete(_winners: Array<{ id: string; name: string }>, _prizeName: string) {
  // 抽奖完成，等待揭晓动画
  // 逻辑已在 draw store 中处理
}

function handleReset() {
  // 重置所有状态
  drawStore.reset();
  winnerStore.clearHistory();
  prizeStore.resetRemaining();

  // 重置用户中奖状态 - 通过 resetPool 方法处理
  userStore.resetPool();

  // 清除本地存储 - 使用统一的清除方法
  clearPersistedState();
}

// Enter 键和空格键处理
function handleKeyPress(event: KeyboardEvent) {
  if ((event.key === 'Enter' || event.key === ' ') && drawStore.isAllRevealed) {
    event.preventDefault();
    drawStore.goToNextRound();

    // 如果所有轮次都完成了，触发庆祝动画
    if (drawStore.isAllCompleted) {
      triggerCelebration();
    }
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
  if (celebrationTimeout) {
    clearTimeout(celebrationTimeout);
  }
});

// 触发庆祝动画
function triggerCelebration() {
  isCelebrating.value = true;
  if (celebrationTimeout) {
    clearTimeout(celebrationTimeout);
  }
  celebrationTimeout = window.setTimeout(() => {
    isCelebrating.value = false;
  }, 5000); // 庆祝动画持续5秒
}

// 生成每个彩带的样式
function getConfettiStyle(index: number) {
  const angle = (index / 50) * 360;
  const distance = 100 + Math.random() * 200;
  const duration = 2 + Math.random() * 2;
  const delay = Math.random() * 0.5;

  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}px`,
    '--duration': `${duration}s`,
    '--delay': `${delay}s`,
  };
}

// 获取彩带表情符号
function getConfettiEmoji(index: number): string {
  const emojis = ['🎉', '🎊', '✨', '🌟', '💫', '⭐', '🎁', '🎈', '🎀', '💝'];
  return emojis[index % emojis.length];
}
</script>

<style scoped>
.app {
  height: 100vh;
  background: linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 50%, #0c0c1e 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.bg-gradient {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(245, 166, 35, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(247, 107, 28, 0.05) 0%, transparent 40%);
  z-index: 0;
  pointer-events: none;
}

.app-header {
  padding: 1.5rem 2rem 1rem;
  text-align: center;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffd700 0%, #f5a623 30%, #f76b1c 70%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(245, 166, 35, 0.3);
  letter-spacing: 0.1em;
  position: relative;
}

.title::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(245, 166, 35, 0.2) 0%, transparent 70%);
  z-index: -1;
  filter: blur(20px);
  animation: glow 3s ease-in-out infinite alternate;
}

@keyframes glow {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.title-decoration {
  width: 150px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #f5a623, transparent);
  margin: 0.5rem auto 0;
  border-radius: 2px;
}

.app-main {
  flex: 1;
  padding: 1rem 2rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  z-index: 1;
  min-height: 0;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }

  .title {
    font-size: 1.8rem;
  }

  .app-main {
    padding: 1rem;
    gap: 0.8rem;
  }
}

/* 庆祝动画样式 */
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: confettiExplode var(--duration) ease-out var(--delay) forwards;
}

.confetti-emoji {
  font-size: 1.5rem;
  animation: confettiSpin 1s linear infinite;
}

@keyframes confettiExplode {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * var(--distance)),
      calc(-50% + sin(var(--angle)) * var(--distance))
    ) rotate(calc(var(--angle) + 720deg)) scale(1);
    opacity: 0;
  }
}

@keyframes confettiSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.celebration-fade-enter-active,
.celebration-fade-leave-active {
  transition: opacity 0.5s ease;
}

.celebration-fade-enter-from,
.celebration-fade-leave-to {
  opacity: 0;
}
</style>
