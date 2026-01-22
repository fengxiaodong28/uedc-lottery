/**
 * 导出抽奖结果为 TXT 格式
 * 保存到项目 results 文件夹
 */

/// <reference types="vite/client" />

import type { Winner, User } from '@/types';

interface DrawResult {
  round: number;
  prizeName: string;
  winners: Array<{ id: string; name: string; timestamp: string }>;
  firstTimestamp: string;
}

export async function exportToTxt(
  winners: Winner[],
  _currentRound: number,
  _currentPrizeName: string,
  allUsers?: User[],
  isLastRound?: boolean
): Promise<void> {
  // 按实际抽奖轮次和时间分组，每次抽奖操作都单独记录一轮
  const rounds: DrawResult[] = [];

  for (const winner of winners) {
    // 查找是否有相同时间戳（同一轮）的轮次
    const existingRound = rounds.find(r => r.firstTimestamp === winner.timestamp);

    if (existingRound) {
      // 添加到现有轮次
      existingRound.winners.push({
        id: winner.id,
        name: winner.userName,
        timestamp: winner.timestamp,
      });
    } else {
      // 创建新轮次
      const newRound: DrawResult = {
        round: rounds.length + 1,
        prizeName: winner.prizeName,
        winners: [{ id: winner.id, name: winner.userName, timestamp: winner.timestamp }],
        firstTimestamp: winner.timestamp,
      };
      rounds.push(newRound);
    }
  }

  // 生成文本内容
  let content = `抽奖时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  for (const round of rounds) {
    content += `第${round.round}轮 | 奖品: ${round.prizeName} | 数量: ${round.winners.length}人\n`;
    content += `中奖名单: ${round.winners.map(w => w.name).join('、')}\n\n`;
  }

  content += `\n总中奖人数: ${winners.length} 人\n`;

  // 如果是最后一轮且有用户数据，添加未中奖名单
  if (isLastRound && allUsers && allUsers.length > 0) {
    const winnerIds = new Set(winners.map(w => w.userId));
    const nonWinners = allUsers.filter(u => !winnerIds.has(u.e_id));

    content += `\n未中奖人数: ${nonWinners.length} 人\n`;
    content += `未中奖名单: ${nonWinners.map(u => u.name).join('、')}\n`;
  }

  // 开发环境：静默保存到 results/ 目录，不触发浏览器下载
  if (import.meta.env.DEV) {
    try {
      const response = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 抽奖结果已保存到 results/' + result.fileName);
      } else {
        console.error('❌ 保存失败');
      }
    } catch (error) {
      console.error('❌ 保存到 results/ 目录失败:', error);
    }
  } else {
    // 生产环境：触发浏览器下载
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `抽奖结果_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  console.log('抽奖结果导出完成，共', rounds.length, '轮，', winners.length, '名中奖者');
}
