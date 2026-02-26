import { paymentService } from '../../services/paymentService';
import { stellarService } from '../../services/stellarService';

jest.mock('../../services/stellarService');

describe('Payment Processing Flow', () => {
  const mockSender = 'GSENDER123';
  const mockReceiver = 'GRECEIVER456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes XLM payment', async () => {
    const mockTxHash = 'tx_hash_123';
    (stellarService.sendPayment as jest.Mock).mockResolvedValue(mockTxHash);

    const result = await paymentService.send({
      from: mockSender,
      to: mockReceiver,
      amount: '10',
      asset: 'XLM'
    });

    expect(result).toBe(mockTxHash);
    expect(stellarService.sendPayment).toHaveBeenCalled();
  });

  it('validates payment amount', async () => {
    await expect(
      paymentService.send({
        from: mockSender,
        to: mockReceiver,
        amount: '-10',
        asset: 'XLM'
      })
    ).rejects.toThrow();
  });

  it('handles insufficient balance', async () => {
    (stellarService.sendPayment as jest.Mock).mockRejectedValue(new Error('Insufficient balance'));

    await expect(
      paymentService.send({
        from: mockSender,
        to: mockReceiver,
        amount: '1000000',
        asset: 'XLM'
      })
    ).rejects.toThrow('Insufficient balance');
  });

  it('processes USDC payment', async () => {
    const mockTxHash = 'tx_hash_456';
    (stellarService.sendPayment as jest.Mock).mockResolvedValue(mockTxHash);

    const result = await paymentService.send({
      from: mockSender,
      to: mockReceiver,
      amount: '50',
      asset: 'USDC'
    });

    expect(result).toBe(mockTxHash);
  });
});
