<template>
  <div class="prize-display">
    <div v-if="!drawStore.isAllCompleted" class="current-prize">
      <div class="prize-content">
        <div class="prize-label">当前抽奖</div>
        <div class="prize-info">
          <span class="prize-name">{{ drawStore.nextRound?.name }}（{{ drawStore.nextRound?.remaining }}）</span>
        </div>
      </div>
    </div>
    <div v-else class="all-completed">
      <span class="complete-text">抽奖已完成</span>
      <div class="button-group">
        <el-button @click="handleExport" type="primary" plain size="small">导出结果</el-button>
        <el-button @click="handleReset" type="warning" plain size="small">重新开始</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDrawStore } from '@/stores/draw';

const drawStore = useDrawStore();

const emit = defineEmits<{
  reset: []
}>();

function handleReset() {
  emit('reset');
}

async function handleExport() {
  try {
    // 获取当天的结果文件
    const response = await fetch('/api/get-result');
    if (response.ok) {
      const content = await response.text();
      // 创建 Blob 并触发下载
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `抽奖结果_${dateStr}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('未找到抽奖结果文件');
    }
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出失败，请重试');
  }
}
</script>

<style scoped>
.prize-display {
  text-align: center;
  padding: 1.2rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.current-prize {
  display: flex;
  justify-content: center;
}

.prize-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.prize-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 500;
}

.prize-info {
  display: flex;
  justify-content: center;
}

.prize-name {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffd700 0%, #f5a623 50%, #f76b1c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.4;
}

.all-completed {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.complete-text {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

@media (max-width: 768px) {
  .prize-name {
    font-size: 1.1rem;
  }
}
</style>
