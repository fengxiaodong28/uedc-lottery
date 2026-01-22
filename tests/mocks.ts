/**
 * Mock @vue/devtools-kit to prevent localStorage errors in tests
 * This file must be imported before any other imports
 */

import { vi } from 'vitest';

// Mock the devtools-kit module
vi.mock('@vue/devtools-kit', async () => {
  const actual = await vi.importActual('@vue/devtools-kit');
  return {
    ...actual,
    getTimelineLayersStateFromStorage: vi.fn(() => []),
    initStateFactory: vi.fn(() => ({})),
  };
});
