import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentStatus } from '../PaymentStatus';
import { TransactionStatus } from '../../../types';

const mockSuccessTransaction: TransactionStatus = {
  id: 'tx-123',
  hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  status: 'success',
  timestamp: new Date(),
  amount: '100',
  asset: {
    id: '1',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 1000,
    decimals: 6,
  },
  recipientAddress: 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3',
};

const mockPendingTransaction: TransactionStatus = {
  ...mockSuccessTransaction,
  status: 'pending',
};

const mockErrorTransaction: TransactionStatus = {
  ...mockSuccessTransaction,
  status: 'error',
  errorMessage: 'Insufficient funds',
};

describe('PaymentStatus', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when isOpen is true and transaction exists', () => {
    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockSuccessTransaction}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Payment Status')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PaymentStatus
        isOpen={false}
        transaction={mockSuccessTransaction}
        onClose={mockOnClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays success status', () => {
    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockSuccessTransaction}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('displays pending status with spinner', () => {
    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockPendingTransaction}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('displays error status', () => {
    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockErrorTransaction}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('displays transaction details', () => {
    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockSuccessTransaction}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('tx-123')).toBeInTheDocument();
    expect(screen.getByText(/0xabcdef.+567890/)).toBeInTheDocument();
    expect(screen.getByText('100 USDC')).toBeInTheDocument();
  });

  it('displays error message when transaction fails', () => {
    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockErrorTransaction}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
  });

  it('copies transaction hash to clipboard', async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');

    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockSuccessTransaction}
        onClose={mockOnClose}
      />
    );

    const copyButtons = screen.getAllByTitle('Copy hash');
    await user.click(copyButtons[0]);

    expect(clipboardSpy).toHaveBeenCalledWith(mockSuccessTransaction.hash);
    clipboardSpy.mockRestore();
  });

  it('opens block explorer on view transaction click', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockSuccessTransaction}
        onClose={mockOnClose}
      />
    );

    const viewButton = screen.getByText('View Transaction');
    await user.click(viewButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining(mockSuccessTransaction.hash),
      '_blank'
    );
    windowOpenSpy.mockRestore();
  });

  it('shows view transaction button only for successful transactions', () => {
    const { rerender } = render(
      <PaymentStatus
        isOpen={true}
        transaction={mockSuccessTransaction}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('View Transaction')).toBeInTheDocument();

    rerender(
      <PaymentStatus
        isOpen={true}
        transaction={mockPendingTransaction}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('View Transaction')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockSuccessTransaction}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays pending message for pending transactions', () => {
    render(
      <PaymentStatus
        isOpen={true}
        transaction={mockPendingTransaction}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(/Your transaction is being processed/)
    ).toBeInTheDocument();
  });
});
