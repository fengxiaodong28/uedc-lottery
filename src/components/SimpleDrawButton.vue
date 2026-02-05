<template>
  <div class="draw-button-container">
    <button
      v-if="!drawStore.isAllCompleted"
      :class="['draw-btn', { disabled: !canDraw || drawStore.isDrawing }]"
      :disabled="!canDraw || drawStore.isDrawing"
      @click="handleDraw"
    >
      <span v-if="drawStore.isDrawing" class="loading-spinner"></span>
      <span class="btn-text">{{ buttonText }}</span>
      <span class="btn-shine"></span>
      <span v-if="!canDraw && !drawStore.isDrawing && disabledReason" class="disabled-reason">{{ disabledReason }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores/users';
import { useWinnerStore } from '@/stores/winners';
import { useDrawStore } from '@/stores/draw';
import { decrementRemaining } from '@/config/drawOrder';
import { exportToTxt } from '@/utils/exportTxt';
import { smartDraw } from '@/utils/smartDraw';
import { DRAW_ROUNDS } from '@/config/drawOrder';
import { saveStateImmediate } from '@/utils/persistence';

const userStore = useUserStore();
const winnerStore = useWinnerStore();
const drawStore = useDrawStore();

const emit = defineEmits<{
  drawComplete: [winners: Array<{ id: string; name: string }>, prizeName: string]
}>();

const canDraw = computed(() => {
  const round = drawStore.nextRound;
  if (!round) return false;
  return round.remaining > 0 && userStore.eligibleUsers(round.level).length > 0;
});

const buttonText = computed(() => {
  if (drawStore.isDrawing) return '抽奖中...';
  const round = drawStore.nextRound;
  if (!round) return '请选择奖品';
  if (round.remaining === 0) return '奖品已抽完';
  if (userStore.eligibleUsers(round.level).length === 0) return '无符合条件用户';
  return '开始抽奖';
});

const disabledReason = computed(() => {
  const round = drawStore.nextRound;
  if (!round) return '';
  if (round.remaining === 0) return '该奖品已抽完';
  if (userStore.eligibleUsers(round.level).length === 0) return '无符合条件用户';
  return '';
});

function handleDraw() {
  if (!canDraw.value) return;

  // 开始抽奖
  drawStore.startDraw();
  const round = drawStore.nextRound!;
  const level = round.level;

  // 获取符合条件用户
  const eligible = userStore.eligibleUsers(level);
  const drawCount = Math.min(round.remaining, eligible.length);

  // 计算剩余轮次（用于智能抽取算法）
  const currentRoundIndex = drawStore.completedRounds;
  const futureRounds = DRAW_ROUNDS.slice(currentRoundIndex + 1).map(r => ({
    level: r.level,
    count: r.remaining,
  }));

  // 获取所有未中奖的用户（用于预测未来需求）
  const allUnclaimedUsers = userStore.users.filter(u => !u.isWinner);

  // 使用智能分层抽取算法（双向保护版本）
  // - 保护有限制用户：在他们能参与的轮次中优先抽取
  // - 保护无限制用户：为未来高等级轮次预留足够的无限制用户
  const { winners, stats } = smartDraw(
    eligible,
    drawCount,
    allUnclaimedUsers,
    level,
    futureRounds
  );

  console.log(`[智能抽取] 第${drawStore.completedRounds + 1}轮 ${round.name}:`, {
    需要抽取: drawCount,
    符合条件: stats.totalEligible,
    无限制用户: stats.unrestrictedCount,
    有限制用户: stats.restrictedCount,
    为未来预留: stats.reservedForFuture,
    最后机会保护: stats.lastChanceDrawn,
    实际抽取: {
      无限制: stats.unrestrictedDrawn,
      有限制: stats.restrictedDrawn,
    },
  });

  // 抽取完成后，更新所有store状态
  setTimeout(() => {
    // 生成本轮统一时间戳，确保同一轮所有中奖者时间戳一致
    const roundTimestamp = new Date().toISOString();

    for (const winner of winners) {
      winnerStore.addWinner(winner, round, roundTimestamp);
      userStore.markAsWinner(winner.e_id);
    }

    // 减少当前轮次的剩余数量
    for (let i = 0; i < drawCount; i++) {
      decrementRemaining(drawStore.completedRounds);
    }

    // 触发揭晓动画
    drawStore.startReveal(winners.map(w => ({ id: w.e_id, name: w.name })), round.name);

    // 导出抽奖结果到 TXT 文件
    const isLastRound = drawStore.completedRounds + 1 >= drawStore.totalRounds;
    exportToTxt(winnerStore.winners, drawStore.completedRounds + 1, round.name, userStore.users, isLastRound);

    // 保存状态到 localStorage（用于刷新后恢复）
    // 使用 $state 直接访问纯数组，避免 Pinia store 包装问题
    const usersToSave = userStore.$state.users.map(u => ({ ...u }));
    const winnersToSave = winnerStore.$state.winners.map(w => ({ ...w }));
    const currentRoundWinnersToSave = winners.map(w => ({ id: w.e_id, name: w.name }));

    console.log('💾 Saving state after draw:', {
      completedRounds: drawStore.completedRounds,
      usersCount: usersToSave.length,
      winnersCount: winnersToSave.length,
      usersIsArray: Array.isArray(usersToSave),
      winnersIsArray: Array.isArray(winnersToSave),
    });

    saveStateImmediate(
      usersToSave,
      winnersToSave,
      drawStore.completedRounds,
      true,  // isRevealing = true，因为刚抽完正在展示
      currentRoundWinnersToSave,
      round.name
    );

    // 触发事件，传递中奖者列表和奖品名称
    emit('drawComplete', winners.map(w => ({ id: w.e_id, name: w.name })), round.name);
  }, 500);
}
</script>

<style scoped>
.draw-button-container {
  display: flex;
  justify-content: center;
}

.draw-btn {
  position: relative;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, #f5a623 0%, #f76b1c 50%, #ff6b35 100%);
  color: #1a1a2e;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 6px 25px rgba(245, 166, 35, 0.4);
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-text {
  position: relative;
  z-index: 2;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: buttonShine 3s infinite;
}

@keyframes buttonShine {
  0% {
    left: -100%;
  }
  50%, 100% {
    left: 100%;
  }
}

.draw-btn:hover:not(.disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(245, 166, 35, 0.6);
}

.draw-btn:active:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(245, 166, 35, 0.5);
}

.draw-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.draw-btn.disabled .btn-shine {
  animation: none;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  border: 2px solid rgba(26, 26, 46, 0.3);
  border-top-color: #1a1a2e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  position: relative;
  z-index: 2;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.disabled-reason {
  position: absolute;
  bottom: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: rgba(255, 107, 53, 0.8);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@media (max-width: 768px) {
  .draw-btn {
    padding: 0.8rem 2rem;
    font-size: 1rem;
  }
}
</style>
