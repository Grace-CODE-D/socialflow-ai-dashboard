import { vi } from 'vitest';

export const blockchainService = {
  updateStatus: vi.fn().mockResolvedValue({ success: true }),
  depositFunds: vi.fn().mockResolvedValue({ success: true }),
  getPromotionDetails: vi.fn().mockResolvedValue({
    id: '123',
    status: 'active',
    budget: 500,
    is_sponsored: true
  }),
};