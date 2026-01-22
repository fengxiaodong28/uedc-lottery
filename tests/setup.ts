import { beforeEach, vi, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Set test environment variable to disable Vue devtools
process.env.VITE_TEST = 'true';

// Stub localStorage BEFORE any imports to prevent devtools-kit errors
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Stub localStorage globally
vi.stubGlobal('localStorage', localStorageMock);

// Set up Pinia before each test
beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

// Clear localStorage after each test
afterEach(() => {
  localStorage.clear();
});
