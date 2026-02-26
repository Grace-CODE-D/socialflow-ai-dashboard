import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers if needed
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options });
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock fetch helper
export const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    } as Response)
  );
};

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

export * from '@testing-library/react';
