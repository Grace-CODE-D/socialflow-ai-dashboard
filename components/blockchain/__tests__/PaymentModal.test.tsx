import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentModal } from '../PaymentModal';
import { Asset } from '../../../types';

const mockAssets: Asset[] = [
  {
    id: '1',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 1000,
    decimals: 6,
  },
  {
    id: '2',
    symbol: 'XLM',
    name: 'Stellar Lumens',
    balance: 500,
    decimals: 7,
  },
];

describe('PaymentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders when isOpen is true', () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Send Payment')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PaymentModal
        isOpen={false}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays available balance for selected asset', () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/1000\.000000 USDC/)).toBeInTheDocument();
  });

  it('validates recipient address format', async () => {
    const user = userEvent.setup();
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    const recipientInput = screen.getByPlaceholderText('G...');
    const submitButton = screen.getByText('Continue');

    await user.type(recipientInput, 'invalid-address');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid recipient address format')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates amount input', async () => {
    const user = userEvent.setup();
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByText('Continue');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
    });
  });

  it('validates insufficient balance', async () => {
    const user = userEvent.setup();
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    const amountInput = screen.getByPlaceholderText('0.00');
    const submitButton = screen.getByText('Continue');

    await user.type(amountInput, '2000');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Insufficient balance')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    const recipientInput = screen.getByPlaceholderText('G...');
    const amountInput = screen.getByPlaceholderText('0.00');
    const submitButton = screen.getByText('Continue');

    const validAddress = 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3';

    await user.type(recipientInput, validAddress);
    await user.type(amountInput, '100');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        recipientAddress: validAddress,
        amount: '100',
        assetId: '1',
        memo: '',
      });
    });
  });

  it('allows changing asset', async () => {
    const user = userEvent.setup();
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    const assetSelect = screen.getByDisplayValue('USDC - USD Coin');
    await user.selectOptions(assetSelect, '2');

    expect(screen.getByText(/500\.0000000 XLM/)).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('includes optional memo in submission', async () => {
    const user = userEvent.setup();
    render(
      <PaymentModal
        isOpen={true}
        onClose={mockOnClose}
        assets={mockAssets}
        onSubmit={mockOnSubmit}
      />
    );

    const validAddress = 'GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNHERX3LRJCX5FWCL46664F3';
    const recipientInput = screen.getByPlaceholderText('G...');
    const amountInput = screen.getByPlaceholderText('0.00');
    const memoInput = screen.getByPlaceholderText('Add a note for this payment...');
    const submitButton = screen.getByText('Continue');

    await user.type(recipientInput, validAddress);
    await user.type(amountInput, '50');
    await user.type(memoInput, 'Payment for services');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        recipientAddress: validAddress,
        amount: '50',
        assetId: '1',
        memo: 'Payment for services',
      });
    });
  });
});
