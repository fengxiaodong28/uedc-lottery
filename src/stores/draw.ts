import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getCurrentRound, getTotalRounds, getRemainingRounds } from '@/config/drawOrder';

export const useDrawStore = defineStore('draw', () => {
  // 已完成的抽奖轮数
  const completedRounds = ref(0);

  // 当前正在抽奖的等级
  const currentLevel = ref<number | null>(null);

  // 是否正在抽奖中（点击按钮后）
  const isDrawing = ref(false);

  // 是否正在揭晓中（显示中奖者动画）
  const isRevealing = ref(false);

  // 当前轮次已显示的中奖者数量（用于动画控制）
  const displayedCount = ref(0);

  // 当前轮次的所有中奖者（内部存储，用于逐个显示）
  const currentRoundWinners = ref<Array<{ id: string; name: string }>>([]);

  // 当前轮次的奖品名称
  const currentPrizeName = ref<string>('');

  // 获取当前应该抽取的轮次配置
  const nextRound = computed(() => getCurrentRound(completedRounds.value));

  // 获取当前应该抽取的奖品等级（兼容旧代码）
  const nextPrizeLevel = computed(() => nextRound.value?.level ?? null);

  // 总轮数
  const totalRounds = computed(() => getTotalRounds());

  // 剩余轮数
  const remainingRounds = computed(() => getRemainingRounds(completedRounds.value));

  // 是否全部抽完
  const isAllCompleted = computed(() => completedRounds.value >= totalRounds.value);

  // 当前进度 (已完成/总轮数)
  const progress = computed(() => {
    return totalRounds.value > 0 ? completedRounds.value / totalRounds.value : 0;
  });

  // 是否应该显示控制面板（不在抽奖也不在揭晓中时显示）
  const shouldShowControls = computed(() => !isDrawing.value && !isRevealing.value);

  /**
   * 开始新一轮抽奖
   */
  function startDraw() {
    if (nextRound.value === null) return false;

    currentLevel.value = nextRound.value.level;
    isDrawing.value = true;
    displayedCount.value = 0;
    currentRoundWinners.value = [];

    return true;
  }

  /**
   * 开始揭晓动画
   */
  function startReveal(winners: Array<{ id: string; name: string }>, prizeName: string) {
    currentRoundWinners.value = winners;
    currentPrizeName.value = prizeName;
    displayedCount.value = 0;
    isDrawing.value = false;
    isRevealing.value = true;
  }

  /**
   * 显示下一个中奖者
   */
  function showNextWinner() {
    if (displayedCount.value < currentRoundWinners.value.length) {
      displayedCount.value++;
      return true;
    }
    return false;
  }

  /**
   * 检查是否所有中奖者都已显示
   */
  const isAllRevealed = computed(() => {
    return isRevealing.value && displayedCount.value >= currentRoundWinners.value.length;
  });

  /**
   * 完成当前轮次，进入下一轮
   */
  function goToNextRound() {
    console.log('📍 goToNextRound: before increment, completedRounds =', completedRounds.value);
    completedRounds.value++;
    console.log('📍 goToNextRound: after increment, completedRounds =', completedRounds.value);
    currentLevel.value = null;
    isRevealing.value = false;
    displayedCount.value = 0;
    currentRoundWinners.value = [];
    currentPrizeName.value = '';
  }

  /**
   * 重置所有状态
   */
  function reset() {
    completedRounds.value = 0;
    currentLevel.value = null;
    isDrawing.value = false;
    isRevealing.value = false;
    displayedCount.value = 0;
    currentRoundWinners.value = [];
    currentPrizeName.value = '';
  }

  /**
   * 设置已完成的轮数（用于从缓存恢复）
   */
  function setCompletedRounds(rounds: number) {
    completedRounds.value = rounds;
  }

  /**
   * 恢复状态（用于从缓存恢复）
   */
  function restoreState(state: {
    completedRounds: number;
    isRevealing: boolean;
    currentRoundWinners: Array<{ id: string; name: string }>;
    currentPrizeName: string;
  }) {
    console.log('🔄 restoreState called with:', state);
    completedRounds.value = state.completedRounds;
    if (state.isRevealing) {
      // 正在展示结果：恢复结果展示状态
      isRevealing.value = true;
      currentRoundWinners.value = state.currentRoundWinners;
      currentPrizeName.value = state.currentPrizeName;
      displayedCount.value = state.currentRoundWinners.length; // 刷新后直接显示全部
      console.log('✅ Restored revealing state, displayedCount =', displayedCount.value);
    } else {
      // 等待抽奖状态：确保清空所有展示相关的状态
      isRevealing.value = false;
      currentRoundWinners.value = [];
      currentPrizeName.value = '';
      displayedCount.value = 0;
      console.log('✅ Restored waiting state');
    }
    console.log('🔍 After restore, completedRounds =', completedRounds.value, 'nextRound =', getCurrentRound(completedRounds.value)?.name);
  }

  /**
   * 获取已显示的中奖者列表
   */
  function getDisplayedWinners() {
    return currentRoundWinners.value.slice(0, displayedCount.value);
  }

  return {
    completedRounds,
    currentLevel,
    isDrawing,
    isRevealing,
    isAllRevealed,
    displayedCount,
    currentRoundWinners,
    currentPrizeName,
    nextRound,
    nextPrizeLevel,
    totalRounds,
    remainingRounds,
    isAllCompleted,
    shouldShowControls,
    progress,
    startDraw,
    startReveal,
    showNextWinner,
    goToNextRound,
    reset,
    setCompletedRounds,
    restoreState,
    getDisplayedWinners,
  };
});
