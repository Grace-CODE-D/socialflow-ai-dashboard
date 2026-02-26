// Mock data generators for testing

export const mockPost = (overrides = {}) => ({
  id: '1',
  content: 'Test post content',
  platform: 'twitter',
  status: 'draft',
  scheduledTime: new Date('2026-03-01T10:00:00Z'),
  createdAt: new Date('2026-02-25T10:00:00Z'),
  ...overrides,
});

export const mockAnalytics = (overrides = {}) => ({
  impressions: 1000,
  engagement: 150,
  clicks: 50,
  shares: 20,
  likes: 80,
  comments: 10,
  period: '7d',
  ...overrides,
});

export const mockMessage = (overrides = {}) => ({
  id: '1',
  sender: 'user@example.com',
  content: 'Test message',
  platform: 'twitter',
  timestamp: new Date('2026-02-25T10:00:00Z'),
  read: false,
  ...overrides,
});

export const mockMedia = (overrides = {}) => ({
  id: '1',
  url: 'https://example.com/image.jpg',
  type: 'image',
  size: 1024000,
  uploadedAt: new Date('2026-02-25T10:00:00Z'),
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  ...overrides,
});

export const mockApiResponse = <T>(data: T, overrides = {}) => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
  ...overrides,
});

export const mockApiError = (message = 'API Error', code = 500) => ({
  success: false,
  error: {
    message,
    code,
  },
  timestamp: new Date().toISOString(),
});
