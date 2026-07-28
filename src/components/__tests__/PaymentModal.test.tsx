import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock(
  '../../../components/ui/Card',
  () => ({ Card: ({ children, className }: any) => <div className={className}>{children}</div> }),
  { virtual: true },
);

jest.mock(
  '../../../components/ui/SponsoredBadge',
  () => ({ SponsoredBadge: () => <span /> }),
  { virtual: true },
);

const mockBlockchainService = {
  getSponsorshipTiers: jest.fn(),
  getWalletStatus: jest.fn(),
  connectWallet: jest.fn(),
  createPaymentTransaction: jest.fn(),
  lockFundsInTreasury: jest.fn(),
  submitTransaction: jest.fn(),
};

jest.mock(
  '../../../services/blockchainService',
  () => ({ blockchainService: mockBlockchainService }),
  { virtual: true },
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PaymentModal } = require('../../../components/ui/PaymentModal');

const tiers = [
  { id: 'basic', name: 'Basic', price: 10, duration: 24, reach: '1k', features: ['feature'] },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockBlockchainService.getSponsorshipTiers.mockReturnValue(tiers);
  mockBlockchainService.getWalletStatus.mockReturnValue({ isConnected: true, balance: 100 });
  mockBlockchainService.createPaymentTransaction.mockResolvedValue({ amount: 10 });
  mockBlockchainService.lockFundsInTreasury.mockResolvedValue(true);
  mockBlockchainService.submitTransaction.mockResolvedValue({ status: 'confirmed' });
});

afterEach(() => {
  jest.useRealTimers();
});

test('does not call onPaymentComplete/onClose when unmounted during the success timeout', async () => {
  const onPaymentComplete = jest.fn();
  const onClose = jest.fn();

  const { unmount, getByText, getByRole } = render(
    <PaymentModal isOpen onClose={onClose} onPaymentComplete={onPaymentComplete} postId="post1" />,
  );

  await act(async () => {
    getByText('Continue to Payment').click();
  });
  await act(async () => {
    getByRole('button', { name: /Confirm Payment/ }).click();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

  await waitFor(() => expect(mockBlockchainService.submitTransaction).toHaveBeenCalled());

  unmount();

  act(() => {
    jest.advanceTimersByTime(2000);
  });

  expect(onPaymentComplete).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});
