import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { jest } from '@jest/globals';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  theme?: 'light' | 'dark';
}

const AllTheProviders = ({ children, theme = 'dark' }: { children: ReactNode; theme?: 'light' | 'dark' }) => {
  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-dark-bg text-white`}>
      {children}
    </div>
  );
};

export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { theme, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders theme={theme}>{children}</AllTheProviders>,
    ...renderOptions,
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Mock implementations for common services
export const mockEventMonitor = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  emit: jest.fn(),
  reset: jest.fn()
};

export const mockNetworkMonitor = {
  subscribe: jest.fn(),
  getRequests: jest.fn(() => []),
  clearRequests: jest.fn(),
  reset: jest.fn()
};

export const mockContractTracer = {
  subscribe: jest.fn(),
  getExecutions: jest.fn(() => []),
  clearExecutions: jest.fn(),
  traceExecution: jest.fn(),
  reset: jest.fn()
};

export const mockStateInspector = {
  subscribe: jest.fn(),
  getState: jest.fn(() => ({})),
  getStateHistory: jest.fn(() => []),
  updateState: jest.fn(),
  clearHistory: jest.fn(),
  searchState: jest.fn(() => []),
  exportState: jest.fn(() => '{}'),
  importState: jest.fn(() => true),
  reset: jest.fn()
};

export const mockLogViewer = {
  subscribe: jest.fn(),
  getLogs: jest.fn(() => []),
  clearLogs: jest.fn(),
  filterLogs: jest.fn(() => []),
  log: jest.fn(),
  exportLogs: jest.fn(() => '[]'),
  getLogStats: jest.fn(() => ({
    total: 0,
    byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
    bySource: {}
  })),
  reset: jest.fn()
};

export const mockTransactionDebugger = {
  subscribe: jest.fn(),
  getDebuggedTransactions: jest.fn(() => []),
  getTransactionDebugInfo: jest.fn(),
  clearDebugData: jest.fn(),
  debugTransaction: jest.fn(),
  getPerformanceAnalysis: jest.fn(() => ({
    averageExecutionTime: 0,
    slowestTransactions: [],
    mostCommonErrors: [],
    apiCallFrequency: []
  })),
  reset: jest.fn()
};

// Utility functions for testing
export const waitFor = (condition: () => boolean, timeout: number = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock fetch responses
export const mockFetchResponse = (data: any, status: number = 200, headers: Record<string, string> = {}) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    clone: () => mockFetchResponse(data, status, headers)
  } as Response);
};

// Setup and teardown helpers
export const setupMocks = () => {
  // Mock window.fetch
  global.fetch = jest.fn();
  
  // Mock console methods
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn()
  };
  
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  
  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
  };
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
  
  // Mock window.location
  delete (window as any).location;
  window.location = {
    ...window.location,
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn()
  };
};

export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  
  // Reset all mock services
  Object.values({
    mockEventMonitor,
    mockNetworkMonitor,
    mockContractTracer,
    mockStateInspector,
    mockLogViewer,
    mockTransactionDebugger
  }).forEach(mock => {
    if (mock.reset) mock.reset();
  });
};

// Test data validation helpers
export const validateTransaction = (transaction: any): boolean => {
  return (
    typeof transaction.id === 'string' &&
    typeof transaction.type === 'string' &&
    typeof transaction.platform === 'string' &&
    typeof transaction.description === 'string' &&
    transaction.timestamp instanceof Date &&
    ['pending', 'completed', 'failed'].includes(transaction.status) &&
    typeof transaction.metadata === 'object'
  );
};

export const validateNetworkRequest = (request: any): boolean => {
  return (
    typeof request.id === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method) &&
    typeof request.url === 'string' &&
    typeof request.status === 'number' &&
    typeof request.duration === 'number' &&
    request.timestamp instanceof Date &&
    typeof request.requestHeaders === 'object' &&
    typeof request.responseHeaders === 'object'
  );
};

export const validateContractExecution = (execution: any): boolean => {
  return (
    typeof execution.id === 'string' &&
    typeof execution.contractAddress === 'string' &&
    typeof execution.method === 'string' &&
    Array.isArray(execution.parameters) &&
    typeof execution.gasUsed === 'number' &&
    typeof execution.gasLimit === 'number' &&
    ['success', 'failed', 'pending'].includes(execution.status) &&
    execution.timestamp instanceof Date &&
    Array.isArray(execution.logs)
  );
};

export const validateLogEntry = (log: any): boolean => {
  return (
    typeof log.id === 'string' &&
    ['debug', 'info', 'warn', 'error'].includes(log.level) &&
    typeof log.message === 'string' &&
    log.timestamp instanceof Date &&
    typeof log.source === 'string'
  );
};

// Performance testing helpers
export const measureExecutionTime = async (fn: () => Promise<any> | any): Promise<{ result: any; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  return {
    result,
    duration: end - start
  };
};

export const measureMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

// Component testing helpers
export const getByTestId = (container: HTMLElement, testId: string): HTMLElement => {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Element with test id "${testId}" not found`);
  }
  return element as HTMLElement;
};

export const queryByTestId = (container: HTMLElement, testId: string): HTMLElement | null => {
  return container.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
};

export const getAllByTestId = (container: HTMLElement, testId: string): HTMLElement[] => {
  return Array.from(container.querySelectorAll(`[data-testid="${testId}"]`)) as HTMLElement[];
};

// Event simulation helpers
export const simulateNetworkDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const simulateUserInteraction = async (element: HTMLElement, action: 'click' | 'hover' | 'focus' = 'click'): Promise<void> => {
  const { fireEvent } = await import('@testing-library/react');
  
  switch (action) {
    case 'click':
      fireEvent.click(element);
      break;
    case 'hover':
      fireEvent.mouseEnter(element);
      break;
    case 'focus':
      fireEvent.focus(element);
      break;
  }
  
  // Allow for any async updates
  await sleep(100);
};

// Assertion helpers
export const expectElementToBeVisible = (element: HTMLElement | null): void => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement | null, text: string): void => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveClass = (element: HTMLElement | null, className: string): void => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveClass(className);
};

// Mock service factory
export const createMockService = <T extends Record<string, any>>(methods: (keyof T)[]): jest.Mocked<T> => {
  const mock = {} as jest.Mocked<T>;
  
  methods.forEach(method => {
    mock[method] = jest.fn() as any;
  });
  
  return mock;
};

// Test environment helpers
export const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
};

export const getTestConfig = () => {
  return {
    timeout: 10000,
    retries: 3,
    slowTestThreshold: 5000
  };
};

// Debug helpers for tests
export const debugElement = (element: HTMLElement): void => {
  console.log('Element HTML:', element.outerHTML);
  console.log('Element classes:', element.className);
  console.log('Element attributes:', Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`));
};

export const debugRenderResult = (result: RenderResult): void => {
  console.log('Rendered HTML:', result.container.innerHTML);
};

// Snapshot testing helpers
export const createSnapshot = (component: ReactElement, name?: string): void => {
  const { container } = customRender(component);
  expect(container.firstChild).toMatchSnapshot(name);
};

export const updateSnapshots = (): boolean => {
  return process.argv.includes('--updateSnapshot') || process.argv.includes('-u');
};

// Export commonly used testing utilities
export const testUtils = {
  setupMocks,
  cleanupMocks,
  waitFor,
  sleep,
  measureExecutionTime,
  measureMemoryUsage,
  simulateNetworkDelay,
  simulateUserInteraction,
  expectElementToBeVisible,
  expectElementToHaveText,
  expectElementToHaveClass,
  createMockService,
  isTestEnvironment,
  getTestConfig,
  debugElement,
  debugRenderResult,
  createSnapshot,
  updateSnapshots
};