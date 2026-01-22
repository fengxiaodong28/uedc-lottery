import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import { useUserStore } from './stores/users';
import { useWinnerStore } from './stores/winners';
import { loadState, clearState as clearPersistedState } from './utils/persistence';

import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(ElementPlus, {
  locale: zhCn,
});

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// Set up state persistence
const userStore = useUserStore();
const winnerStore = useWinnerStore();

// Load persisted state on startup
const savedState = loadState();
if (savedState) {
  userStore.users = savedState.users;
  winnerStore.loadFromState(savedState.winners);
  console.log('Restored state from', savedState.timestamp);
}

// ⚠️ AUTO-SAVE DISABLED - Using saveStateImmediate at specific points instead
// These old watches were causing issues by:
// 1. Using wrong format (userStore.users instead of userStore.$state.users)
// 2. Missing new fields (completedRounds, isRevealing, etc.)
// 3. Triggering at wrong times and overwriting correct saves
//
// State is now saved explicitly at:
// - After each draw (SimpleDrawButton.vue)
// - After clicking "Next Round" (WinnerListDisplay.vue)

// watch(
//   () => userStore.$state,
//   () => {
//     saveState({
//       users: userStore.users,
//       winners: winnerStore.winners,
//     });
//   },
//   { deep: true }
// );

// watch(
//   () => winnerStore.$state,
//   () => {
//     saveState({
//       users: userStore.users,
//       winners: winnerStore.winners,
//     });
//   },
//   { deep: true }
// );

app.mount('#app');

// Declare window interface extension
declare global {
  interface Window {
    clearLotteryState?: () => void;
  }
}

// Export clear function for manual reset
window.clearLotteryState = () => {
  userStore.resetPool();
  winnerStore.clearHistory();
  clearPersistedState();
  console.log('Lottery state cleared');
};
