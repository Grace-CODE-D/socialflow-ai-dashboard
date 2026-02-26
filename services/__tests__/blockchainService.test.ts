import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateRecipientAddress,
  validateAmount,
  calculateGasFee,
  generatePaymentSummary,
  submitPayment,
  generateQRCode,
  generateShareableLink,
  calculateNextPaymentDate,
  validateRecurringPayment,
} from '../blockchainService';
import { Asset, PaymentFormData, PaymentRequest } from '../../types';

const mockAsset: Asset = {
  id: '1',
  symbol: 'USDC',
  name: 'USD Coin',
  balance: 1000,
  decimals: 6,
};

describe('blockchainService', () => {
  describe('validateRecipientAddress', () => {
    it('validates correct Stellar address format', () => {
      const validAddress = 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3';
      expect(validateRecipientAddress(validAddress)).toBe(true);
    });

    it('rejects invalid address format', () => {
      expect(validateRecipientAddress('invalid-address')).toBe(false);
      expect(validateRecipientAddress('GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664')).toBe(false);
      expect(validateRecipientAddress('PBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('validates positive amount within balance', () => {
      const result = validateAmount('100', 1000);
      expect(result.valid).toBe(true);
    });

    it('rejects zero amount', () => {
      const result = validateAmount('0', 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });

    it('rejects negative amount', () => {
      const result = validateAmount('-50', 1000);
      expect(result.valid).toBe(false);
    });

    it('rejects amount exceeding balance', () => {
      const result = validateAmount('2000', 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Insufficient balance');
    });

    it('rejects non-numeric amount', () => {
      const result = validateAmount('abc', 1000);
      expect(result.valid).toBe(false);
    });
  });

  describe('calculateGasFee', () => {
    it('calculates 1% gas fee', () => {
      const fee = calculateGasFee('100');
      expect(parseFloat(fee)).toBe(1);
    });

    it('handles decimal amounts', () => {
      const fee = calculateGasFee('50.5');
      expect(parseFloat(fee)).toBeCloseTo(0.505, 3);
    });

    it('returns string with proper decimals', () => {
      const fee = calculateGasFee('100');
      expect(fee).toMatch(/^\d+\.\d{7}$/);
    });
  });

  describe('generatePaymentSummary', () => {
    it('generates correct payment summary', () => {
      const formData: PaymentFormData = {
        recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
        amount: '100',
        assetId: '1',
        memo: 'Test payment',
      };

      const summary = generatePaymentSummary(formData, mockAsset);

      expect(summary.recipientAddress).toBe(formData.recipientAddress);
      expect(summary.amount).toBe('100');
      expect(summary.asset).toEqual(mockAsset);
      expect(summary.memo).toBe('Test payment');
      expect(parseFloat(summary.estimatedGasFee)).toBe(1);
      expect(parseFloat(summary.totalCost)).toBe(101);
    });
  });

  describe('submitPayment', () => {
    it('returns successful transaction', async () => {
      const summary = generatePaymentSummary(
        {
          recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
          amount: '100',
          assetId: '1',
        },
        mockAsset
      );

      const result = await submitPayment(summary);

      expect(result.status).toBe('success');
      expect(result.hash).toBeDefined();
      expect(result.amount).toBe('100');
      expect(result.asset).toEqual(mockAsset);
    });
  });

  describe('generateQRCode', () => {
    it('generates QR code data URL', async () => {
      const paymentRequest: Omit<PaymentRequest, 'qrCode' | 'shareableLink'> = {
        id: 'pr-123',
        recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
        amount: '100',
        asset: mockAsset,
        memo: 'Test',
        createdAt: new Date(),
      };

      const qrCode = await generateQRCode(paymentRequest);

      expect(qrCode).toMatch(/^data:image\/svg\+xml/);
    });
  });

  describe('generateShareableLink', () => {
    it('generates shareable link with payment parameters', () => {
      const paymentRequest: PaymentRequest = {
        id: 'pr-123',
        recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
        amount: '100',
        asset: mockAsset,
        memo: 'Test',
        qrCode: 'data:image/svg+xml',
        shareableLink: '',
        createdAt: new Date(),
      };

      const link = generateShareableLink(paymentRequest);

      expect(link).toContain('payment=');
      expect(link).toContain('recipient=');
      expect(link).toContain('amount=100');
    });
  });

  describe('calculateNextPaymentDate', () => {
    it('calculates next daily payment date', () => {
      const startDate = new Date('2024-01-01');
      const nextDate = calculateNextPaymentDate(startDate, 'daily');

      expect(nextDate.getDate()).toBe(2);
    });

    it('calculates next weekly payment date', () => {
      const startDate = new Date('2024-01-01');
      const nextDate = calculateNextPaymentDate(startDate, 'weekly');

      expect(nextDate.getDate()).toBe(8);
    });

    it('calculates next monthly payment date', () => {
      const startDate = new Date('2024-01-01');
      const nextDate = calculateNextPaymentDate(startDate, 'monthly');

      expect(nextDate.getMonth()).toBe(1);
      expect(nextDate.getDate()).toBe(1);
    });

    it('handles month boundaries for monthly frequency', () => {
      const startDate = new Date('2024-01-31');
      const nextDate = calculateNextPaymentDate(startDate, 'monthly');

      expect(nextDate.getMonth()).toBe(1); // February
    });
  });

  describe('validateRecurringPayment', () => {
    it('validates correct recurring payment', () => {
      const payment = {
        recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
        amount: '100',
        asset: mockAsset,
        frequency: 'monthly' as const,
        startDate: new Date(),
        memo: 'Test',
      };

      const result = validateRecurringPayment(payment);

      expect(result.valid).toBe(true);
    });

    it('rejects invalid recipient address', () => {
      const payment = {
        recipientAddress: 'invalid-address',
        amount: '100',
        asset: mockAsset,
        frequency: 'monthly' as const,
        startDate: new Date(),
      };

      const result = validateRecurringPayment(payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid recipient address');
    });

    it('rejects insufficient balance', () => {
      const payment = {
        recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
        amount: '2000',
        asset: mockAsset,
        frequency: 'monthly' as const,
        startDate: new Date(),
      };

      const result = validateRecurringPayment(payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Insufficient balance');
    });

    it('rejects end date before start date', () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-01-01');

      const payment = {
        recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
        amount: '100',
        asset: mockAsset,
        frequency: 'monthly' as const,
        startDate,
        endDate,
      };

      const result = validateRecurringPayment(payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('End date must be after start date');
    });
  });
});
