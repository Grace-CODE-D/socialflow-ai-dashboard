// Test setup
if (typeof window !== 'undefined' && window.navigator) {
  Object.defineProperty(window.navigator, 'onLine', {
    writable: true,
    value: true,
  });
}
